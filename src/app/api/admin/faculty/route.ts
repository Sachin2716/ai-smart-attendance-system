import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const createFacultySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid institutional email is required'),
  employeeId: z.string().min(3, 'Employee ID is required'),
  phone: z.string().optional(),
  designation: z.string().min(2, 'Designation is required'),
  departmentId: z.string().min(1, 'Department is required'),
  password: z.string().min(6).default('faculty123'),
  assignedCourseIds: z.array(z.string()).optional(),
  assignedSectionIds: z.array(z.string()).optional(),
});

export async function GET() {
  const auth = await requireAuth(['ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const facultyList = await prisma.faculty.findMany({
      include: {
        department: true,
        assignments: {
          include: {
            course: true,
            classSection: true,
          },
        },
        _count: {
          select: { sessions: true },
        },
      },
      orderBy: { employeeId: 'asc' },
    });

    return NextResponse.json({ success: true, faculty: facultyList });
  } catch (error: any) {
    console.error('Fetch faculty error:', error);
    return NextResponse.json({ error: 'Failed to retrieve faculty directory' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(['ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = createFacultySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, email, employeeId, phone, designation, departmentId, password } = parsed.data;

    // Check unique email and employeeId
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email address already exists' }, { status: 409 });
    }

    const existingFaculty = await prisma.faculty.findUnique({
      where: { employeeId: employeeId.trim().toUpperCase() },
    });
    if (existingFaculty) {
      return NextResponse.json({ error: 'A faculty member with this employee ID already exists' }, { status: 409 });
    }

    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      return NextResponse.json({ error: 'Selected department does not exist' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Transactional creation
    const newFaculty = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          name: name.trim(),
          role: 'FACULTY',
          status: 'ACTIVE',
        },
      });

      const faculty = await tx.faculty.create({
        data: {
          userId: newUser.id,
          employeeId: employeeId.trim().toUpperCase(),
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone?.trim(),
          designation: designation.trim(),
          departmentId,
          accountStatus: 'ACTIVE',
        },
        include: {
          department: true,
          assignments: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: auth.session!.userId,
          actorRole: auth.session!.role,
          action: 'CREATE_FACULTY',
          entityType: 'FACULTY',
          entityId: faculty.id,
          newValue: JSON.stringify({ employeeId, name, email, designation }),
          reason: 'Faculty appointment created by administrator',
        },
      });

      return faculty;
    });

    return NextResponse.json({ success: true, faculty: newFaculty }, { status: 201 });
  } catch (error: any) {
    console.error('Create faculty error:', error);
    return NextResponse.json({ error: 'Database transaction failed: could not create faculty record' }, { status: 500 });
  }
}
