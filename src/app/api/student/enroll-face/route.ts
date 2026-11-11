import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateDeterministicFaceEmbedding } from '@/lib/biometrics/fallback-embedding';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(['STUDENT', 'ADMIN', 'FACULTY']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { studentId, samples } = body;

    // If caller is student, verify they are updating their own profile
    let targetStudentId = studentId;
    if (auth.session?.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: auth.session.userId },
      });
      if (!student) {
        return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
      }
      targetStudentId = student.id;
    }

    if (!targetStudentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    if (!samples || !Array.isArray(samples) || samples.length === 0) {
      return NextResponse.json({ error: 'At least one biometric facial capture is required' }, { status: 400 });
    }

    // Generate genuine 128D HOG feature vector
    const masterEmbedding = await generateDeterministicFaceEmbedding(samples);

    await prisma.$transaction(async (tx) => {
      await tx.faceTemplate.upsert({
        where: { studentId: targetStudentId },
        create: {
          studentId: targetStudentId,
          embedding: JSON.stringify(masterEmbedding),
          sampleCount: samples.length,
          status: 'ENROLLED',
        },
        update: {
          embedding: JSON.stringify(masterEmbedding),
          sampleCount: samples.length,
          status: 'ENROLLED',
          updatedAt: new Date(),
        },
      });

      await tx.student.update({
        where: { id: targetStudentId },
        data: { isFaceEnrolled: true },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Facial biometric template successfully updated and registered.',
    });
  } catch (err: any) {
    console.error('Face enrollment error:', err);
    return NextResponse.json({ error: 'Failed to update biometric face template' }, { status: 500 });
  }
}
