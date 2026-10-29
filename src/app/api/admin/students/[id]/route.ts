import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateStudentSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  rollNumber: z.string().min(3).optional(),
  phone: z.string().optional().nullable(),
  departmentId: z.string().optional(),
  currentSemester: z.number().int().min(1).max(8).optional(),
  currentSectionId: z.string().optional(),
  accountStatus: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  reason: z.string().optional().default('Administrative update'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(['ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateStudentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (parsed.data.name) updateData.name = parsed.data.name.trim();
    if (parsed.data.email) updateData.email = parsed.data.email.toLowerCase().trim();
    if (parsed.data.rollNumber) updateData.rollNumber = parsed.data.rollNumber.trim().toUpperCase();
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
    if (parsed.data.departmentId) updateData.departmentId = parsed.data.departmentId;
    if (parsed.data.currentSemester) updateData.currentSemester = parsed.data.currentSemester;
    if (parsed.data.currentSectionId) updateData.currentSectionId = parsed.data.currentSectionId;
    if (parsed.data.accountStatus) updateData.accountStatus = parsed.data.accountStatus;

    // Transaction to update student and linked user
    const updated = await prisma.$transaction(async (tx) => {
      const student = await tx.student.update({
        where: { id },
        data: updateData,
        include: { department: true, currentSection: true },
      });

      // Synchronize User table
      const userUpdate: any = {};
      if (updateData.name) userUpdate.name = updateData.name;
      if (updateData.email) userUpdate.email = updateData.email;
      if (updateData.accountStatus) userUpdate.status = updateData.accountStatus;

      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: existingStudent.userId },
          data: userUpdate,
        });
      }

      // If section changed, ensure enrollment exists
      if (updateData.currentSectionId && updateData.currentSectionId !== existingStudent.currentSectionId) {
        await tx.enrollment.upsert({
          where: {
            studentId_classSectionId: {
              studentId: student.id,
              classSectionId: updateData.currentSectionId,
            },
          },
          update: { status: 'ENROLLED' },
          create: {
            studentId: student.id,
            classSectionId: updateData.currentSectionId,
            status: 'ENROLLED',
          },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: auth.session!.userId,
          actorRole: auth.session!.role,
          action: 'UPDATE_STUDENT',
          entityType: 'STUDENT',
          entityId: id,
          previousValue: JSON.stringify({
            name: existingStudent.name,
            rollNumber: existingStudent.rollNumber,
            status: existingStudent.accountStatus,
          }),
          newValue: JSON.stringify(updateData),
          reason: parsed.data.reason,
        },
      });

      return student;
    });

    return NextResponse.json({ success: true, student: updated });
  } catch (error: any) {
    console.error('Update student error:', error);
    return NextResponse.json({ error: 'Failed to update student record' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(['ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Clean up child dependencies safely
      await tx.faceTemplate.deleteMany({ where: { studentId: id } });
      await tx.correctionRequest.deleteMany({ where: { studentId: id } });
      await tx.attendanceRecord.deleteMany({ where: { studentId: id } });
      await tx.enrollment.deleteMany({ where: { studentId: id } });
      
      // Delete student profile and user account
      await tx.student.delete({ where: { id } });
      if (student.userId) {
        await tx.user.delete({ where: { id: student.userId } });
      }

      // Record administrative audit trail
      await tx.auditLog.create({
        data: {
          actorId: auth.session!.userId,
          actorRole: auth.session!.role,
          action: 'DELETE_STUDENT',
          entityType: 'STUDENT',
          entityId: id,
          previousValue: JSON.stringify({
            name: student.name,
            rollNumber: student.rollNumber,
            email: student.email,
          }),
          reason: 'Permanent student account deletion by Administrator',
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Student '${student.name}' (${student.rollNumber}) deleted successfully`,
    });
  } catch (error: any) {
    console.error('Delete student error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete student record' },
      { status: 500 }
    );
  }
}

