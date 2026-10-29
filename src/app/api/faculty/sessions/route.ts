import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const startSessionSchema = z.object({
  classSectionId: z.string().min(1),
  courseId: z.string().min(1),
  roomNumber: z.string().optional().default('Room 201'),
  verificationMode: z.enum(['HYBRID_AI', 'FACE_AI', 'MANUAL']).default('HYBRID_AI'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth(['FACULTY', 'ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const classSectionId = searchParams.get('classSectionId');
  const courseId = searchParams.get('courseId');

  try {
    const faculty = await prisma.faculty.findUnique({
      where: { userId: auth.session!.userId },
    });

    if (!faculty && auth.session!.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Faculty profile not found' }, { status: 404 });
    }

    const where: any = {};
    if (faculty) where.facultyId = faculty.id;
    if (classSectionId) where.classSectionId = classSectionId;
    if (courseId) where.courseId = courseId;

    const sessions = await prisma.attendanceSession.findMany({
      where,
      include: {
        classSection: true,
        course: true,
        records: {
          include: { student: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });

    return NextResponse.json({ success: true, sessions });
  } catch (error: any) {
    console.error('Fetch sessions error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(['FACULTY', 'ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = startSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { classSectionId, courseId, roomNumber, verificationMode } = parsed.data;

    const faculty = await prisma.faculty.findUnique({
      where: { userId: auth.session!.userId },
    });

    if (!faculty && auth.session!.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Faculty record missing' }, { status: 403 });
    }

    const facultyId = faculty ? faculty.id : (await prisma.faculty.findFirst())!.id;

    // Verify faculty authorization for this class and course
    if (auth.session!.role === 'FACULTY') {
      const assignment = await prisma.teachingAssignment.findFirst({
        where: {
          facultyId,
          courseId,
          classSectionId,
        },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: 'You are not assigned to teach this course for this class section' },
          { status: 403 }
        );
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Check for an existing ACTIVE session for the same class and course today
    const existingActive = await prisma.attendanceSession.findFirst({
      where: {
        classSectionId,
        courseId,
        sessionDate: todayStr,
        status: 'ACTIVE',
      },
    });

    if (existingActive) {
      return NextResponse.json(
        {
          error: 'An active attendance session already exists for this class today. Please finalize it first.',
          existingSessionId: existingActive.id,
        },
        { status: 409 }
      );
    }

    // Format start/end times
    const now = new Date();
    const startTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const endTimeObj = new Date(now.getTime() + 60 * 60 * 1000);
    const endTimeStr = endTimeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Transaction to create session and pre-fill student roster as ABSENT
    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.attendanceSession.create({
        data: {
          classSectionId,
          courseId,
          facultyId,
          sessionDate: todayStr,
          startTime: parsed.data.startTime || startTimeStr,
          endTime: parsed.data.endTime || endTimeStr,
          roomNumber,
          verificationMode,
          status: 'ACTIVE',
        },
        include: {
          classSection: true,
          course: true,
          faculty: true,
        },
      });

      // Get enrolled students
      const enrollments = await tx.enrollment.findMany({
        where: { classSectionId, status: 'ENROLLED' },
        include: { student: true },
      });

      // Pre-fill attendance records as ABSENT
      for (const e of enrollments) {
        await tx.attendanceRecord.create({
          data: {
            sessionId: session.id,
            studentId: e.student.id,
            status: 'ABSENT',
            verificationMethod: 'MANUAL',
            markedById: facultyId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: auth.session!.userId,
          actorRole: auth.session!.role,
          action: 'START_ATTENDANCE_SESSION',
          entityType: 'ATTENDANCE_SESSION',
          entityId: session.id,
          newValue: JSON.stringify({ courseId, classSectionId, date: todayStr }),
          reason: 'Faculty opened live attendance session',
        },
      });

      return session;
    });

    return NextResponse.json({ success: true, session: result }, { status: 201 });
  } catch (error: any) {
    console.error('Start session error:', error);
    return NextResponse.json({ error: 'Failed to start attendance session' }, { status: 500 });
  }
}
