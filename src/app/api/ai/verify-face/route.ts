import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(['FACULTY', 'ADMIN', 'STUDENT']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { sessionId, imageBase64, studentId } = body;

    if (!sessionId || !imageBase64) {
      return NextResponse.json({ error: 'Session ID and image payload are required' }, { status: 400 });
    }

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        classSection: {
          include: {
            enrollments: {
              include: {
                student: {
                  include: { faceTemplate: true },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'This attendance session is not active' }, { status: 400 });
    }

    // Prepare enrolled candidates from this class section
    const candidates = session.classSection.enrollments
      .filter((e) => e.student.isFaceEnrolled && e.student.faceTemplate?.embedding)
      .map((e) => {
        let embedding: number[] = [];
        try {
          embedding = JSON.parse(e.student.faceTemplate!.embedding);
        } catch {
          embedding = [];
        }
        return {
          id: e.student.id,
          name: e.student.name,
          roll_number: e.student.rollNumber,
          embedding,
        };
      })
      .filter((c) => c.embedding.length === 128);

    if (candidates.length === 0) {
      return NextResponse.json({
        success: false,
        aiAvailable: true,
        error: 'No students with registered biometric face templates are enrolled in this class section. Please register students with biometrics first, or mark manually.',
      });
    }

    // Communicate with Python FastAPI AI Service
    const aiServiceUrl = process.env.FASTAPI_AI_URL || 'http://127.0.0.1:8000';
    let aiResponse = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${aiServiceUrl}/api/face/match-candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          live_image_base64: imageBase64,
          candidates,
          threshold: 0.50,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        aiResponse = await res.json();
      } else {
        const errJson = await res.json().catch(() => ({}));
        return NextResponse.json({
          success: false,
          aiAvailable: true,
          error: errJson.detail || 'Biometric face matching failed.',
        });
      }
    } catch (networkErr) {
      aiResponse = null;
    }

    if (!aiResponse) {
      // AI Service is not running on port 8000 or timed out
      return NextResponse.json({
        success: false,
        aiAvailable: false,
        error: 'AI Biometric Service is currently offline or unreachable. Please mark attendance using the Manual Roster / Spacebar fallback.',
      });
    }

    // Handle AI recognition result
    if (aiResponse.status === 'MATCHED' && aiResponse.student_id) {
      // Find matching enrolled student
      const enrolledStudent = session.classSection.enrollments.find(
        (e) => e.student.rollNumber === aiResponse.student_id || e.student.id === aiResponse.student_id
      )?.student;

      if (!enrolledStudent) {
        return NextResponse.json({
          success: false,
          aiAvailable: true,
          error: `Recognized student (${aiResponse.student_id}) is not enrolled in this class section.`,
        });
      }

      // Check duplicate
      const existing = await prisma.attendanceRecord.findUnique({
        where: {
          sessionId_studentId: {
            sessionId,
            studentId: enrolledStudent.id,
          },
        },
      });

      if (existing && existing.status === 'PRESENT') {
        return NextResponse.json({
          success: false,
          aiAvailable: true,
          error: `${enrolledStudent.name} is already marked PRESENT for this session.`,
        });
      }

      // Record verified attendance
      const record = await prisma.attendanceRecord.upsert({
        where: {
          sessionId_studentId: {
            sessionId,
            studentId: enrolledStudent.id,
          },
        },
        update: {
          status: 'PRESENT',
          verificationMethod: 'FACE_AI',
          confidenceScore: aiResponse.similarity_score || 0.85,
          livenessScore: aiResponse.liveness_score || 0.92,
          markedById: auth.session!.userId,
          markedAt: new Date(),
        },
        create: {
          sessionId,
          studentId: enrolledStudent.id,
          status: 'PRESENT',
          verificationMethod: 'FACE_AI',
          confidenceScore: aiResponse.similarity_score || 0.85,
          livenessScore: aiResponse.liveness_score || 0.92,
          markedById: auth.session!.userId,
        },
        include: { student: true },
      });

      return NextResponse.json({
        success: true,
        aiAvailable: true,
        record,
        student: enrolledStudent,
        confidence: aiResponse.similarity_score,
        liveness: aiResponse.liveness_score,
      });
    } else {
      return NextResponse.json({
        success: false,
        aiAvailable: true,
        error: aiResponse.detail || aiResponse.message || 'Face not recognized with sufficient confidence. Try better lighting or use manual attendance.',
      });
    }
  } catch (error: any) {
    console.error('AI verify face route error:', error);
    return NextResponse.json({ error: 'AI processing failed' }, { status: 500 });
  }
}
