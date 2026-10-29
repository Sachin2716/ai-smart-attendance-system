import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateFacultySchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  designation: z.string().min(2).optional(),
  departmentId: z.string().optional(),
  accountStatus: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  assignments: z.array(
    z.object({
      courseId: z.string(),
      classSectionId: z.string(),
    })
  ).optional(),
  reason: z.string().optional().default('Faculty administrative update'),
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
    const parsed = updateFacultySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const existingFaculty = await prisma.faculty.findUnique({
      where: { id },
      include: { user: true, assignments: true },
    });

    if (!existingFaculty) {
      return NextResponse.json({ error: 'Faculty record not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (parsed.data.name) updateData.name = parsed.data.name.trim();
    if (parsed.data.email) updateData.email = parsed.data.email.toLowerCase().trim();
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
    if (parsed.data.designation) updateData.designation = parsed.data.designation.trim();
    if (parsed.data.departmentId) updateData.departmentId = parsed.data.departmentId;
    if (parsed.data.accountStatus) updateData.accountStatus = parsed.data.accountStatus;

    const result = await prisma.$transaction(async (tx) => {
      const updatedFaculty = await tx.faculty.update({
        where: { id },
        data: updateData,
        include: { department: true, assignments: { include: { course: true, classSection: true } } },
      });

      // Synchronize User record
      const userUpdate: any = {};
      if (updateData.name) userUpdate.name = updateData.name;
      if (updateData.email) userUpdate.email = updateData.email;
      if (updateData.accountStatus) userUpdate.status = updateData.accountStatus;

      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: existingFaculty.userId },
          data: userUpdate,
        });
      }

      // Handle reassignments if specified
      if (parsed.data.assignments) {
        // Remove existing assignments
        await tx.teachingAssignment.deleteMany({
          where: { facultyId: id },
        });

        // Insert new assignments
        for (const assign of parsed.data.assignments) {
          await tx.teachingAssignment.create({
            data: {
              facultyId: id,
              courseId: assign.courseId,
              classSectionId: assign.classSectionId,
            },
          });
        }
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: auth.session!.userId,
          actorRole: auth.session!.role,
          action: 'UPDATE_FACULTY',
          entityType: 'FACULTY',
          entityId: id,
          previousValue: JSON.stringify({
            name: existingFaculty.name,
            status: existingFaculty.accountStatus,
            designation: existingFaculty.designation,
          }),
          newValue: JSON.stringify(updateData),
          reason: parsed.data.reason,
        },
      });

      return updatedFaculty;
    });

    return NextResponse.json({ success: true, faculty: result });
  } catch (error: any) {
    console.error('Update faculty error:', error);
    return NextResponse.json({ error: 'Failed to update faculty record' }, { status: 500 });
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
    const faculty = await prisma.faculty.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty record not found' }, { status: 404 });
    }

    // Prevent deleting own administrative account if linked
    if (faculty.userId === auth.session!.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own administrative account' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete timetable slots assigned to this faculty
      await tx.timetableSlot.deleteMany({ where: { facultyId: id } });

      // 2. Delete teaching assignments
      await tx.teachingAssignment.deleteMany({ where: { facultyId: id } });

      // 3. Delete attendance sessions and dependent attendance records
      const sessions = await tx.attendanceSession.findMany({
        where: { facultyId: id },
        select: { id: true },
      });
      const sessionIds = sessions.map((s) => s.id);
      if (sessionIds.length > 0) {
        await tx.correctionRequest.deleteMany({
          where: { sessionId: { in: sessionIds } },
        });
        await tx.attendanceRecord.deleteMany({
          where: { sessionId: { in: sessionIds } },
        });
        await tx.attendanceSession.deleteMany({
          where: { id: { in: sessionIds } },
        });
      }

      // 4. Delete faculty profile and linked user account
      await tx.faculty.delete({ where: { id } });
      if (faculty.userId) {
        await tx.user.delete({ where: { id: faculty.userId } });
      }

      // 5. Record administrative audit trail
      await tx.auditLog.create({
        data: {
          actorId: auth.session!.userId,
          actorRole: auth.session!.role,
          action: 'DELETE_FACULTY',
          entityType: 'FACULTY',
          entityId: id,
          previousValue: JSON.stringify({
            name: faculty.name,
            employeeId: faculty.employeeId,
            email: faculty.email,
          }),
          reason: 'Permanent faculty account deletion by Administrator',
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Faculty '${faculty.name}' (${faculty.employeeId}) deleted successfully`,
    });
  } catch (error: any) {
    console.error('Delete faculty error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete faculty record' },
      { status: 500 }
    );
  }
}

