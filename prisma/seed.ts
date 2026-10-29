import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting clean academic database seeding (Zero Mock Data)...');

  // 1. Clean existing records in correct foreign-key dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.correctionRequest.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.timetableSlot.deleteMany();
  await prisma.teachingAssignment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.faceTemplate.deleteMany();
  await prisma.student.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.course.deleteMany();
  await prisma.classSection.deleteMany();
  await prisma.department.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Purged all previous mock records, fake embeddings, and mock attendance history.');

  // 2. Seed Master System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'INSTITUTION_NAME', value: 'CAIAS Institute of Advanced Studies', description: 'Official institution name' },
      { key: 'MIN_ATTENDANCE_PERCENT', value: '75', description: 'Mandatory minimum attendance threshold percentage' },
      { key: 'FACE_CONFIDENCE_THRESHOLD', value: '0.75', description: 'AI face recognition minimum cosine similarity' },
      { key: 'LIVENESS_THRESHOLD', value: '0.65', description: 'Anti-spoofing liveness check confidence threshold' },
      { key: 'SESSION_DURATION_MINUTES', value: '60', description: 'Default lecture duration' },
      { key: 'LOW_ATTENDANCE_WARNING', value: '75', description: 'Threshold to trigger low attendance warnings' },
    ],
  });

  // 3. Seed Official Academic Department (Only Computer Science)
  const deptCS = await prisma.department.create({
    data: { code: 'CS', name: 'Computer Science' },
  });

  console.log('🏢 Department configured: Computer Science (CS)');

  // 4. Seed Official Class Section (Only BCA AIML B)
  const sectionBCAAIMLB = await prisma.classSection.create({
    data: {
      departmentId: deptCS.id,
      semester: 3,
      sectionName: 'B',
      fullLabel: 'BCA AIML B',
    },
  });

  console.log('🏫 Class section configured: BCA AIML B');

  // 5. Seed Official Courses for Computer Science
  const courseDBMS = await prisma.course.create({
    data: {
      code: 'CS301',
      name: 'Database Management Systems',
      departmentId: deptCS.id,
      semester: 3,
      credits: 4,
    },
  });
  const courseNetworks = await prisma.course.create({
    data: {
      code: 'CS302',
      name: 'Computer Networks & Cloud Infrastructure',
      departmentId: deptCS.id,
      semester: 3,
      credits: 4,
    },
  });
  const courseAI = await prisma.course.create({
    data: {
      code: 'CS303',
      name: 'Artificial Intelligence & Neural Systems',
      departmentId: deptCS.id,
      semester: 3,
      credits: 4,
    },
  });
  const courseML = await prisma.course.create({
    data: {
      code: 'CS304',
      name: 'Machine Learning & Data Analytics',
      departmentId: deptCS.id,
      semester: 3,
      credits: 4,
    },
  });
  const courseWeb = await prisma.course.create({
    data: {
      code: 'CS305',
      name: 'Full Stack Web Engineering',
      departmentId: deptCS.id,
      semester: 3,
      credits: 4,
    },
  });

  console.log('📚 Academic curriculum courses configured (CS301 to CS305).');

  // 6. Seed Operational Admin Account
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@caias.edu.in',
      passwordHash: adminPasswordHash,
      name: 'College Administrator',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // 7. Seed Operational Faculty Account (Dr. Alan Turing)
  const facultyPassword = process.env.SEED_FACULTY_PASSWORD || 'faculty123';
  const facultyPasswordHash = await bcrypt.hash(facultyPassword, 10);
  const facultyUser = await prisma.user.create({
    data: {
      email: 'faculty@caias.edu.in',
      passwordHash: facultyPasswordHash,
      name: 'Dr. Alan Turing',
      role: 'FACULTY',
      status: 'ACTIVE',
    },
  });

  const facultyProfile = await prisma.faculty.create({
    data: {
      userId: facultyUser.id,
      employeeId: 'FAC-101',
      name: 'Dr. Alan Turing',
      email: 'faculty@caias.edu.in',
      phone: '+91 98765 43210',
      designation: 'Professor & Head of Department',
      departmentId: deptCS.id,
      accountStatus: 'ACTIVE',
    },
  });

  console.log('👤 Baseline Accounts Created:');
  console.log('   - Admin:   admin@caias.edu.in');
  console.log('   - Faculty: faculty@caias.edu.in');

  // 8. Teaching Assignments (Linking Faculty to BCA AIML B courses)
  await prisma.teachingAssignment.createMany({
    data: [
      { facultyId: facultyProfile.id, courseId: courseDBMS.id, classSectionId: sectionBCAAIMLB.id },
      { facultyId: facultyProfile.id, courseId: courseNetworks.id, classSectionId: sectionBCAAIMLB.id },
      { facultyId: facultyProfile.id, courseId: courseAI.id, classSectionId: sectionBCAAIMLB.id },
      { facultyId: facultyProfile.id, courseId: courseML.id, classSectionId: sectionBCAAIMLB.id },
      { facultyId: facultyProfile.id, courseId: courseWeb.id, classSectionId: sectionBCAAIMLB.id },
    ],
  });

  // 9. Fixed Weekly Timetable (Monday through Saturday) for BCA AIML B
  const weeklySchedule = [
    // Monday
    { day: 'Monday', start: '09:00 AM', end: '10:00 AM', room: 'Room 201', courseId: courseDBMS.id },
    { day: 'Monday', start: '10:15 AM', end: '11:15 AM', room: 'AI Lab 3', courseId: courseAI.id },
    { day: 'Monday', start: '11:30 AM', end: '12:30 PM', room: 'Room 201', courseId: courseNetworks.id },
    { day: 'Monday', start: '01:30 PM', end: '02:30 PM', room: 'Room 201', courseId: courseML.id },

    // Tuesday
    { day: 'Tuesday', start: '09:00 AM', end: '10:00 AM', room: 'Room 201', courseId: courseML.id },
    { day: 'Tuesday', start: '10:15 AM', end: '11:15 AM', room: 'Room 201', courseId: courseDBMS.id },
    { day: 'Tuesday', start: '11:30 AM', end: '12:30 PM', room: 'Web Lab 1', courseId: courseWeb.id },
    { day: 'Tuesday', start: '01:30 PM', end: '02:30 PM', room: 'AI Lab 3', courseId: courseAI.id },

    // Wednesday
    { day: 'Wednesday', start: '09:00 AM', end: '10:00 AM', room: 'AI Lab 3', courseId: courseAI.id },
    { day: 'Wednesday', start: '10:15 AM', end: '11:15 AM', room: 'Room 201', courseId: courseNetworks.id },
    { day: 'Wednesday', start: '11:30 AM', end: '12:30 PM', room: 'Room 201', courseId: courseDBMS.id },
    { day: 'Wednesday', start: '01:30 PM', end: '02:30 PM', room: 'Web Lab 1', courseId: courseWeb.id },

    // Thursday
    { day: 'Thursday', start: '09:00 AM', end: '10:00 AM', room: 'Room 201', courseId: courseNetworks.id },
    { day: 'Thursday', start: '10:15 AM', end: '11:15 AM', room: 'Room 201', courseId: courseDBMS.id },
    { day: 'Thursday', start: '11:30 AM', end: '12:30 PM', room: 'Room 201', courseId: courseML.id },
    { day: 'Thursday', start: '01:30 PM', end: '02:30 PM', room: 'AI Lab 3', courseId: courseAI.id },

    // Friday
    { day: 'Friday', start: '09:00 AM', end: '10:00 AM', room: 'Web Lab 1', courseId: courseWeb.id },
    { day: 'Friday', start: '10:15 AM', end: '11:15 AM', room: 'Room 201', courseId: courseML.id },
    { day: 'Friday', start: '11:30 AM', end: '12:30 PM', room: 'AI Lab 3', courseId: courseAI.id },
    { day: 'Friday', start: '01:30 PM', end: '02:30 PM', room: 'Room 201', courseId: courseDBMS.id },

    // Saturday
    { day: 'Saturday', start: '09:00 AM', end: '10:00 AM', room: 'Room 201', courseId: courseDBMS.id },
    { day: 'Saturday', start: '10:15 AM', end: '11:15 AM', room: 'Room 201', courseId: courseNetworks.id },
    { day: 'Saturday', start: '11:30 AM', end: '12:30 PM', room: 'Web Lab 1', courseId: courseWeb.id },
  ];

  for (const slot of weeklySchedule) {
    await prisma.timetableSlot.create({
      data: {
        dayOfWeek: slot.day,
        startTime: slot.start,
        endTime: slot.end,
        roomNumber: slot.room,
        classSectionId: sectionBCAAIMLB.id,
        courseId: slot.courseId,
        facultyId: facultyProfile.id,
      },
    });
  }

  console.log('📅 Fixed weekly timetable configured for BCA AIML B (Monday to Saturday).');

  // Record Audit Log for initialization
  await prisma.auditLog.create({
    data: {
      actorId: adminUser.id,
      actorRole: 'ADMIN',
      action: 'SYSTEM_INITIALIZATION',
      entityType: 'SYSTEM',
      entityId: 'INIT',
      reason: 'Clean database seeded with zero mock students and zero mock attendance. Ready for live multi-view biometric enrollment.',
    },
  });

  console.log('✅ Clean database seeded successfully.');
  console.log('   - Total Students: 0 (Awaiting real student registration)');
  console.log('   - Total Sessions: 0 (Clean slate)');
  console.log('   - Total Attendance Records: 0 (100% genuine data only)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
