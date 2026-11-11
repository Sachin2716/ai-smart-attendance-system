import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateSessionSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']),
  reason: z.string().optional().default('Session completed by faculty'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(['FACULTY', 'ADMIN', 'STUDENT']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    const session = await prisma.attendanceSession.findUnique({
      where: { id },
      include: {
        classSection: {
          include: { department: true },
        },
        course: true,
        faculty: true,
        records: {
          include: {
            student: {
              include: {
                faceTemplate: { select: { status: true } },
              },
            },
          },
          orderBy: { student: { rollNumber: 'asc' } },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Auto-synchronize missing enrolled students into active sessions
    if (session.status === 'ACTIVE') {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          classSectionId: session.classSectionId,
          status: 'ENROLLED',
        },
        select: { studentId: true },
      });

      const existingStudentIds = new Set(session.records.map((r) => r.studentId));
      const missingStudentIds = enrollments
        .map((e) => e.studentId)
        .filter((id) => !existingStudentIds.has(id));

      if (missingStudentIds.length > 0) {
        await prisma.attendanceRecord.createMany({
          data: missingStudentIds.map((studentId) => ({
            sessionId: session.id,
            studentId,
            status: 'ABSENT',
            verificationMethod: 'MANUAL',
            markedById: session.facultyId,
          })),
          skipDuplicates: true,
        });

        const refreshedRecords = await prisma.attendanceRecord.findMany({
          where: { sessionId: session.id },
          include: {
            student: {
              include: {
                faceTemplate: { select: { status: true } },
              },
            },
          },
          orderBy: { student: { rollNumber: 'asc' } },
        });

        session.records = refreshedRecords;
      }
    }

    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    console.error('Fetch session details error:', error);
    return NextResponse.json({ error: 'Failed to fetch session details' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(['FACULTY', 'ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { status, reason } = parsed.data;

    const existingSession = await prisma.attendanceSession.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const sess = await tx.attendanceSession.update({
        where: { id },
        data: { status },
        include: { course: true, classSection: true, records: true },
      });

      await tx.auditLog.create({
        data: {
          actorId: auth.session!.userId,
          actorRole: auth.session!.role,
          action: `SESSION_STATUS_${status}`,
          entityType: 'ATTENDANCE_SESSION',
          entityId: id,
          previousValue: existingSession.status,
          newValue: status,
          reason,
        },
      });

      return sess;
    });

    return NextResponse.json({ success: true, session: updated });
  } catch (error: any) {
    console.error('Update session error:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
