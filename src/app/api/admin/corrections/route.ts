import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const reviewCorrectionSchema = z.object({
  requestId: z.string().min(1),
  decision: z.enum(['APPROVED', 'REJECTED']),
  remarks: z.string().min(2, 'A review remark or reason is required'),
  updatedAttendanceStatus: z.enum(['PRESENT', 'EXCUSED']).optional().default('EXCUSED'),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth(['ADMIN', 'FACULTY']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    const where: any = {};
    if (status) where.status = status;

    const requests = await prisma.correctionRequest.findMany({
      where,
      include: {
        student: {
          include: { department: true, currentSection: true },
        },
        session: {
          include: { course: true, classSection: true, faculty: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error('Fetch corrections error:', error);
    return NextResponse.json({ error: 'Failed to fetch correction requests' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(['ADMIN', 'FACULTY']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = reviewCorrectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { requestId, decision, remarks, updatedAttendanceStatus } = parsed.data;

    const existingReq = await prisma.correctionRequest.findUnique({
      where: { id: requestId },
      include: {
        student: { include: { user: true } },
        session: { include: { course: true } },
      },
    });

    if (!existingReq) {
      return NextResponse.json({ error: 'Correction request not found' }, { status: 404 });
    }

    // Execute state change transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update correction request
      const updatedReq = await tx.correctionRequest.update({
        where: { id: requestId },
        data: {
          status: decision,
          responseRemarks: remarks,
          reviewedById: auth.session!.userId,
          reviewedAt: new Date(),
        },
      });

      // 2. If approved, update or insert attendance record
      if (decision === 'APPROVED') {
        await tx.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId: existingReq.sessionId,
              studentId: existingReq.studentId,
            },
          },
          update: {
            status: updatedAttendanceStatus,
            verificationMethod: 'CORRECTION',
            remarks: `Approved correction: ${remarks}`,
          },
          create: {
            sessionId: existingReq.sessionId,
            studentId: existingReq.studentId,
            status: updatedAttendanceStatus,
            verificationMethod: 'CORRECTION',
            remarks: `Approved correction: ${remarks}`,
          },
        });
      }

      // 3. Notification to the student
      await tx.notification.create({
        data: {
          userId: existingReq.student.userId,
          title: `Attendance Correction ${decision === 'APPROVED' ? 'Approved ✅' : 'Rejected ❌'}`,
          message: `Your request for ${existingReq.session.course.name} was ${decision.toLowerCase()} by ${auth.session!.name}. Note: ${remarks}`,
          type: decision === 'APPROVED' ? 'SUCCESS' : 'ALERT',
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: auth.session!.userId,
          actorRole: auth.session!.role,
          action: `CORRECTION_${decision}`,
          entityType: 'CORRECTION_REQUEST',
          entityId: requestId,
          previousValue: existingReq.status,
          newValue: decision,
          reason: remarks,
        },
      });

      return updatedReq;
    });

    return NextResponse.json({ success: true, request: result });
  } catch (error: any) {
    console.error('Review correction error:', error);
    return NextResponse.json({ error: 'Failed to process correction review' }, { status: 500 });
  }
}
