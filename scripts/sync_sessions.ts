import dotenv from 'dotenv';
dotenv.config({ path: '.env.production.local', override: true });
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Attendance Session Synchronization ---');
  
  const activeSessions = await prisma.attendanceSession.findMany({
    where: { status: 'ACTIVE' },
    include: {
      classSection: {
        include: {
          enrollments: {
            include: { student: true }
          }
        }
      },
      records: true
    }
  });

  console.log(`Found ${activeSessions.length} active sessions.`);

  for (const session of activeSessions) {
    const existingStudentIds = new Set(session.records.map(r => r.studentId));
    const enrollments = session.classSection.enrollments;
    const missingEnrollments = enrollments.filter(e => !existingStudentIds.has(e.studentId));

    console.log(`Session ${session.id} (${session.classSection.fullLabel}): existing records=${session.records.length}, total enrolled students=${enrollments.length}, missing=${missingEnrollments.length}`);

    for (const missing of missingEnrollments) {
      await prisma.attendanceRecord.create({
        data: {
          sessionId: session.id,
          studentId: missing.studentId,
          status: 'ABSENT',
          verificationMethod: 'MANUAL',
          markedById: session.facultyId
        }
      });
      console.log(`  -> Added student ${missing.student.name} (${missing.student.rollNumber}) to session ${session.id}`);
    }
  }

  // Also verify student counts across all sections
  const sections = await prisma.classSection.findMany({
    include: {
      _count: { select: { students: true, enrollments: true, sessions: true } }
    }
  });
  console.log('\nUpdated Class Sections:');
  for (const s of sections) {
    console.log(`Section ${s.fullLabel}: students=${s._count.students}, enrollments=${s._count.enrollments}, sessions=${s._count.sessions}`);
  }

  // Verify records in all active sessions
  const refreshedSessions = await prisma.attendanceSession.findMany({
    where: { status: 'ACTIVE' },
    include: {
      _count: { select: { records: true } },
      classSection: true,
      course: true
    }
  });
  console.log('\nRefreshed Active Sessions:');
  for (const sess of refreshedSessions) {
    console.log(`Session ${sess.id} [${sess.course.code} - ${sess.classSection.fullLabel}]: ${sess._count.records} records`);
  }

  console.log('\n--- Synchronization Complete ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
