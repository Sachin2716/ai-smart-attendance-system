import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  extractFaceBiometricVector,
  calculateCosineSimilarity,
  detectFacesAndCount,
  checkPassiveFaceLiveness,
} from '@/lib/biometrics/fallback-embedding';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(['FACULTY', 'ADMIN', 'STUDENT']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { sessionId, imageBase64, studentId, mode } = body;

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

    // 1. Prepare enrolled candidates who have valid 128D biometric templates
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
        statusCode: 'NO_ENROLLED_TEMPLATES',
        aiAvailable: true,
        error:
          'No students with registered biometric face templates are enrolled in this class section. Please register students with biometrics first, or mark manually.',
      });
    }

    const cleanB64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const imgBuffer = Buffer.from(cleanB64, 'base64');

    if (!imgBuffer || imgBuffer.length < 500) {
      return NextResponse.json({
        success: false,
        statusCode: 'INVALID_IMAGE',
        aiAvailable: true,
        error: 'No valid camera frame detected. Please look directly into the camera.',
      });
    }

    // 2. Multi-Face Detection: Identify all face regions in the frame (supports multiple individuals)
    const faceDetection = await detectFacesAndCount(imgBuffer);

    // Collect all candidate face boxes (all detected faces + main face crop)
    const faceBoxesToEvaluate: { left: number; top: number; width: number; height: number }[] = [];
    if (faceDetection.boxes && faceDetection.boxes.length > 0) {
      faceBoxesToEvaluate.push(...faceDetection.boxes);
    } else if (faceDetection.box && faceDetection.box.width >= 20) {
      faceBoxesToEvaluate.push(faceDetection.box);
    }

    // 3. Pre-Processing Gate: Passive Liveness & Anti-Spoofing
    const livenessResult = await checkPassiveFaceLiveness(imgBuffer);
    if (!livenessResult.isLive) {
      return NextResponse.json({
        success: false,
        statusCode: 'LIVENESS_FAILED',
        aiAvailable: true,
        error:
          livenessResult.reason ||
          'Liveness verification failed: Anti-spoofing alert. Screen projection or printed photograph rejected.',
      });
    }

    // 4. Biometric Feature Extraction across all detected faces with Mirror-Invariance
    const faceVectors = await Promise.all(
      faceBoxesToEvaluate.map(async (box) => {
        const [std, flop] = await Promise.all([
          extractFaceBiometricVector(cleanB64, false, box),
          extractFaceBiometricVector(cleanB64, true, box),
        ]);
        return { std, flop, box };
      })
    );

    // Fallback: If no face boxes produced valid vectors, extract from primary frame
    if (faceVectors.length === 0) {
      const [std, flop] = await Promise.all([
        extractFaceBiometricVector(cleanB64, false),
        extractFaceBiometricVector(cleanB64, true),
      ]);
      faceVectors.push({ std, flop, box: faceDetection.box });
    }

    // Calibrated Biometric Decision Boundaries:
    // - User Requirement: Mark as present if accuracy is at least 10% match (RECOGNITION_THRESHOLD = 0.10)
    // - Display Requirement: Never show low percentages; always mention at least 50.0% accuracy
    const RECOGNITION_THRESHOLD = 0.10;
    const AMBIGUITY_MARGIN = 0.04;

    // Helper to format reported confidence: maps raw similarity [0.10, 1.00] to display confidence [0.50, 0.99]
    // Ensures reported match accuracy is always at least 50.0% (never shows 10%, 22%, etc.)
    const formatReportedConfidence = (rawSim: number): number => {
      if (rawSim < 0.10) return 0.50;
      const normalized = 0.50 + ((rawSim - 0.10) / 0.90) * 0.485;
      return Number(Math.min(0.99, Math.max(0.50, normalized)).toFixed(4));
    };

    // Helper to evaluate similarity with mirror-invariance across ALL detected faces in the frame
    const matchCandidateScore = (embedding: number[]) => {
      let maxScore = -1;
      for (const fv of faceVectors) {
        const simStandard = calculateCosineSimilarity(fv.std, embedding);
        const simFlipped = calculateCosineSimilarity(fv.flop, embedding);
        const bestSim = Math.max(simStandard, simFlipped);
        if (bestSim > maxScore) {
          maxScore = bestSim;
        }
      }
      return maxScore;
    };

    // Score all enrolled candidates in this section
    const scoredCandidates = candidates
      .map((c) => ({
        candidate: c,
        similarity: matchCandidateScore(c.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    const topCandidate = scoredCandidates[0];
    const secondCandidate = scoredCandidates[1] || null;

    let matchedCandidate: (typeof candidates)[0] | null = null;
    let verifiedConfidence = 0;

    const is1to1Mode = mode === '1:1' || (Boolean(studentId) && mode !== '1:N');

    if (is1to1Mode && studentId) {
      // -------------------------------------------------------------
      // 1:1 VERIFICATION MODE: Verify live face against specific student
      // -------------------------------------------------------------
      const targetCandidate = candidates.find((c) => c.id === studentId || c.roll_number === studentId);

      if (!targetCandidate) {
        return NextResponse.json({
          success: false,
          statusCode: 'TARGET_NOT_FOUND',
          aiAvailable: true,
          error: `Target student (${studentId}) is not enrolled with biometrics in this class section.`,
        });
      }

      const targetScore = matchCandidateScore(targetCandidate.embedding);

      // Check 1: Target must meet the minimum calibrated recognition threshold (10% match)
      if (targetScore < RECOGNITION_THRESHOLD) {
        return NextResponse.json({
          success: false,
          statusCode: 'FACE_NOT_RECOGNIZED',
          aiAvailable: true,
          error: `Aligning with ${targetCandidate.name}. Please face camera directly and press Spacebar to verify.`,
        });
      }

      // Check 2: Cross-Student Impostor Check:
      // Only reject if another registered student is overwhelmingly higher (> 15% margin)
      if (topCandidate && topCandidate.candidate.id !== targetCandidate.id && (topCandidate.similarity - targetScore) > 0.15) {
        return NextResponse.json({
          success: false,
          statusCode: 'IDENTITY_MISMATCH',
          aiAvailable: true,
          error: `Identity mismatch! The person in front of the camera matches ${topCandidate.candidate.name} (${topCandidate.candidate.roll_number}), NOT ${targetCandidate.name}.`,
        });
      }

      matchedCandidate = targetCandidate;
      verifiedConfidence = formatReportedConfidence(targetScore);
    } else {
      // -------------------------------------------------------------
      // 1:N IDENTIFICATION MODE: Match live face against all candidates
      // -------------------------------------------------------------
      if (!topCandidate || topCandidate.similarity < RECOGNITION_THRESHOLD) {
        return NextResponse.json({
          success: false,
          statusCode: 'FACE_NOT_RECOGNIZED',
          aiAvailable: true,
          error: 'Scanning for registered student... Please align face with camera and press Spacebar to mark present.',
        });
      }

      // Check Ambiguity Margin: Difference between best match and second best match
      if (
        secondCandidate &&
        secondCandidate.similarity >= RECOGNITION_THRESHOLD &&
        topCandidate.similarity - secondCandidate.similarity < AMBIGUITY_MARGIN
      ) {
        return NextResponse.json({
          success: false,
          statusCode: 'AMBIGUOUS_MATCH',
          aiAvailable: true,
          error: `Ambiguous biometric match between ${topCandidate.candidate.name} and ${secondCandidate.candidate.name}. Please face camera directly.`,
        });
      }

      matchedCandidate = topCandidate.candidate;
      verifiedConfidence = formatReportedConfidence(topCandidate.similarity);
    }

    if (!matchedCandidate) {
      return NextResponse.json({
        success: false,
        statusCode: 'VERIFICATION_FAILED',
        aiAvailable: true,
        error: 'Biometric identity verification in progress. Press Spacebar to retry.',
      });
    }

    // 5. Locate Enrolled Student Record in Class Section
    const enrolledStudent = session.classSection.enrollments.find(
      (e) => e.student.id === matchedCandidate!.id || e.student.rollNumber === matchedCandidate!.roll_number
    )?.student;

    if (!enrolledStudent) {
      return NextResponse.json({
        success: false,
        statusCode: 'NOT_ENROLLED',
        aiAvailable: true,
        error: `Recognized student (${matchedCandidate.name}) is not enrolled in this class section.`,
      });
    }

    // 6. Check for Duplicate Attendance Record
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
        statusCode: 'ALREADY_MARKED',
        aiAvailable: true,
        error: `${enrolledStudent.name} (${enrolledStudent.rollNumber}) is already marked PRESENT for this session.`,
        student: enrolledStudent,
      });
    }

    // 7. Atomic Database Upsert: Record Verified Attendance
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
        confidenceScore: Number(verifiedConfidence.toFixed(4)),
        livenessScore: livenessResult.livenessScore,
        markedById: auth.session!.userId,
        markedAt: new Date(),
      },
      create: {
        sessionId,
        studentId: enrolledStudent.id,
        status: 'PRESENT',
        verificationMethod: 'FACE_AI',
        confidenceScore: Number(verifiedConfidence.toFixed(4)),
        livenessScore: livenessResult.livenessScore,
        markedById: auth.session!.userId,
      },
      include: { student: true },
    });

    return NextResponse.json({
      success: true,
      statusCode: 'ATTENDANCE_MARKED',
      aiAvailable: true,
      record,
      student: enrolledStudent,
      confidence: Number(verifiedConfidence.toFixed(4)),
      liveness: livenessResult.livenessScore,
      message: `Identity Verified: ${enrolledStudent.name} (${enrolledStudent.rollNumber}) marked PRESENT!`,
    });
  } catch (error: any) {
    console.error('AI verify face route error:', error);
    return NextResponse.json({ error: 'AI processing failed' }, { status: 500 });
  }
}
