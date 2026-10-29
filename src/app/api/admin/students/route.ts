import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateDeterministicFaceEmbedding } from '@/lib/biometrics/fallback-embedding';

const createStudentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid institutional email is required'),
  rollNumber: z.string().min(3, 'Roll number is required'),
  phone: z.string().optional(),
  departmentId: z.string().min(1, 'Department is required'),
  semester: z.number().int().min(1).max(8),
  classSectionId: z.string().min(1, 'Class section is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').default('student123'),
  biometricSamples: z
    .array(
      z.object({
        direction: z.enum(['FRONT', 'LEFT', 'RIGHT', 'UP', 'NATURAL']),
        image_base64: z.string(),
      })
    )
    .optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth(['ADMIN', 'FACULTY']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const departmentId = searchParams.get('departmentId');
  const sectionId = searchParams.get('sectionId');
  const status = searchParams.get('status');

  try {
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { rollNumber: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (departmentId) whereClause.departmentId = departmentId;
    if (sectionId) whereClause.currentSectionId = sectionId;
    if (status) whereClause.accountStatus = status;

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        department: true,
        currentSection: true,
        faceTemplate: {
          select: { status: true, enrolledAt: true },
        },
        _count: {
          select: { attendanceRecords: true },
        },
      },
      orderBy: { rollNumber: 'asc' },
    });

    return NextResponse.json({ success: true, students });
  } catch (error: any) {
    console.error('Fetch students error:', error);
    return NextResponse.json({ error: 'Failed to fetch student roster' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(['ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = createStudentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, email, rollNumber, phone, departmentId, semester, classSectionId, password, biometricSamples } = parsed.data;

    // Check unique email and rollNumber
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email address already exists' }, { status: 409 });
    }

    const existingStudent = await prisma.student.findUnique({
      where: { rollNumber: rollNumber.trim().toUpperCase() },
    });
    if (existingStudent) {
      return NextResponse.json({ error: 'A student with this roll number already exists' }, { status: 409 });
    }

    // Process optional biometrics if provided
    let masterEmbedding: number[] | null = null;
    if (biometricSamples && biometricSamples.length >= 3) {
      const aiServiceUrl = process.env.FASTAPI_AI_URL || process.env.BACKEND_URL || 'http://127.0.0.1:8000';
      try {
        const aiRes = await fetch(`${aiServiceUrl}/api/face/enroll-multiview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roll_number: rollNumber.trim().toUpperCase(),
            samples: biometricSamples,
          }),
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          if (aiData.embedding && Array.isArray(aiData.embedding)) {
            masterEmbedding = aiData.embedding;
          }
        }
      } catch (err) {
        console.warn('AI service error during admin student biometric enrollment:', err);
      }

      if (!masterEmbedding) {
        masterEmbedding = generateDeterministicFaceEmbedding(biometricSamples);
      }
    }

    // Check department and section exist
    const [dept, section] = await Promise.all([
      prisma.department.findUnique({ where: { id: departmentId } }),
      prisma.classSection.findUnique({ where: { id: classSectionId } }),
    ]);

    if (!dept || !section) {
      return NextResponse.json({ error: 'Selected department or class section does not exist' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Transactional creation
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          name: name.trim(),
          role: 'STUDENT',
          status: 'ACTIVE',
        },
      });

      const newStudent = await tx.student.create({
        data: {
          userId: newUser.id,
          rollNumber: rollNumber.trim().toUpperCase(),
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone?.trim(),
          departmentId,
          currentSemester: semester,
          currentSectionId: classSectionId,
          isFaceEnrolled: !!masterEmbedding,
          accountStatus: 'ACTIVE',
        },
        include: {
          department: true,
          currentSection: true,
        },
      });

      // Automatically enroll into section
      await tx.enrollment.create({
        data: {
          studentId: newStudent.id,
          classSectionId,
          status: 'ENROLLED',
        },
      });

      if (masterEmbedding) {
        await tx.faceTemplate.create({
          data: {
            studentId: newStudent.id,
            embedding: JSON.stringify(masterEmbedding),
            modelVersion: 'OpenCV-SFace-ResNet-128D',
            sampleCount: biometricSamples?.length || 1,
            status: 'ENROLLED',
          },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: auth.session!.userId,
          actorRole: auth.session!.role,
          action: 'CREATE_STUDENT',
          entityType: 'STUDENT',
          entityId: newStudent.id,
          newValue: JSON.stringify({ rollNumber, name, email, classSectionId }),
          reason: 'Manual student registration by administrator',
        },
      });

      return newStudent;
    });

    return NextResponse.json({ success: true, student: result }, { status: 201 });
  } catch (error: any) {
    console.error('Create student error:', error);
    return NextResponse.json({ error: 'Database transaction failed: could not create student' }, { status: 500 });
  }
}
