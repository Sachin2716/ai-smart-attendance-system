import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const markAttendanceSchema = z.object({
  sessionId: z.string().min(1),
  studentId: z.string().min(1),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  verificationMethod: z.enum(['FACE_AI', 'MANUAL', 'CORRECTION', 'FALLBACK']).default('MANUAL'),
  confidenceScore: z.number().optional().nullable(),
  livenessScore: z.number().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

const bulkMarkSchema = z.object({
  sessionId: z.string().min(1),
  updates: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
      verificationMethod: z.enum(['FACE_AI', 'MANUAL', 'CORRECTION', 'FALLBACK']).default('MANUAL'),
      confidenceScore: z.number().optional().nullable(),
      livenessScore: z.number().optional().nullable(),
      remarks: z.string().optional().nullable(),
    })
  ),
});

export async function POST(request: NextRequest) {
  const auth = await requireAuth(['FACULTY', 'ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();

    // Check if bulk or single
    if (body.updates && Array.isArray(body.updates)) {
      const parsed = bulkMarkSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Validation failed' }, { status: 400 });
      }

      const { sessionId, updates } = parsed.data;

      const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
      if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

      await prisma.$transaction(async (tx) => {
        for (const u of updates) {
          await tx.attendanceRecord.upsert({
            where: {
              sessionId_studentId: { sessionId, studentId: u.studentId },
            },
            update: {
              status: u.status,
              verificationMethod: u.verificationMethod,
              confidenceScore: u.confidenceScore,
              livenessScore: u.livenessScore,
              remarks: u.remarks,
              markedById: auth.session!.userId,
              markedAt: new Date(),
            },
            create: {
              sessionId,
              studentId: u.studentId,
              status: u.status,
              verificationMethod: u.verificationMethod,
              confidenceScore: u.confidenceScore,
              livenessScore: u.livenessScore,
              remarks: u.remarks,
              markedById: auth.session!.userId,
            },
          });
        }

        await tx.auditLog.create({
          data: {
            actorId: auth.session!.userId,
            actorRole: auth.session!.role,
            action: 'BULK_ATTENDANCE_UPDATE',
            entityType: 'ATTENDANCE_SESSION',
            entityId: sessionId,
            newValue: `Updated ${updates.length} records`,
            reason: 'Faculty bulk attendance submission',
          },
        });
      });

      return NextResponse.json({ success: true, count: updates.length });
    } else {
      // Single mark
      const parsed = markAttendanceSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Validation failed' }, { status: 400 });
      }

      const { sessionId, studentId, status, verificationMethod, confidenceScore, livenessScore, remarks } = parsed.data;

      const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
      if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

      const record = await prisma.$transaction(async (tx) => {
        const rec = await tx.attendanceRecord.upsert({
          where: {
            sessionId_studentId: { sessionId, studentId },
          },
          update: {
            status,
            verificationMethod,
            confidenceScore,
            livenessScore,
            remarks,
            markedById: auth.session!.userId,
            markedAt: new Date(),
          },
          create: {
            sessionId,
            studentId,
            status,
            verificationMethod,
            confidenceScore,
            livenessScore,
            remarks,
            markedById: auth.session!.userId,
          },
          include: { student: true },
        });

        await tx.auditLog.create({
          data: {
            actorId: auth.session!.userId,
            actorRole: auth.session!.role,
            action: 'MARK_ATTENDANCE',
            entityType: 'ATTENDANCE_RECORD',
            entityId: rec.id,
            newValue: `${status} via ${verificationMethod}`,
            reason: remarks || 'Attendance marked by faculty/AI',
          },
        });

        return rec;
      });

      return NextResponse.json({ success: true, record });
    }
  } catch (error: any) {
    console.error('Mark attendance error:', error);
    return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
  }
}
