import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createCorrectionSchema = z.object({
  sessionId: z.string().min(1, 'Attendance session is required'),
  reason: z.string().min(10, 'Please provide an explanatory reason (minimum 10 characters)'),
});

export async function GET() {
  const auth = await requireAuth(['STUDENT', 'ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { userId: auth.session!.userId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const requests = await prisma.correctionRequest.findMany({
      where: { studentId: student.id },
      include: {
        session: {
          include: {
            course: true,
            faculty: true,
            records: {
              where: { studentId: student.id },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error('Fetch student correction requests error:', error);
    return NextResponse.json({ error: 'Failed to fetch correction requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(['STUDENT']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = createCorrectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { userId: auth.session!.userId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const { sessionId, reason } = parsed.data;

    // Verify session exists and student has a record for it
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { course: true, faculty: { include: { user: true } } },
    });

    if (!session) {
      return NextResponse.json({ error: 'Attendance session not found' }, { status: 404 });
    }

    // Check if an existing pending request already exists
    const existing = await prisma.correctionRequest.findFirst({
      where: {
        studentId: student.id,
        sessionId,
        status: 'PENDING',
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A pending correction request is already active for this session.' },
        { status: 409 }
      );
    }

    const newRequest = await prisma.$transaction(async (tx) => {
      const cr = await tx.correctionRequest.create({
        data: {
          studentId: student.id,
          sessionId,
          reason: reason.trim(),
          status: 'PENDING',
        },
        include: { session: { include: { course: true } } },
      });

      // Notify the faculty member teaching this course
      if (session.faculty?.userId) {
        await tx.notification.create({
          data: {
            userId: session.faculty.userId,
            title: 'Attendance Correction Submitted',
            message: `${student.name} (${student.rollNumber}) submitted a correction request for ${session.course.name}.`,
            type: 'INFO',
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: auth.session!.userId,
          actorRole: auth.session!.role,
          action: 'SUBMIT_CORRECTION_REQUEST',
          entityType: 'CORRECTION_REQUEST',
          entityId: cr.id,
          newValue: reason.trim(),
          reason: 'Student filed attendance dispute',
        },
      });

      return cr;
    });

    return NextResponse.json({ success: true, request: newRequest }, { status: 201 });
  } catch (error: any) {
    console.error('Submit correction error:', error);
    return NextResponse.json({ error: 'Failed to submit correction request' }, { status: 500 });
  }
}
