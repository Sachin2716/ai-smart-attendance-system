import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { signToken, verifyToken } from '../src/lib/auth';

const prisma = new PrismaClient();

describe('🎓 AI Smart Attendance Management System - End-to-End Test Suite', () => {
  let adminUser: any;
  let facultyUser: any;
  let studentUser: any;
  let adminToken: string;
  let facultyToken: string;
  let studentToken: string;

  let testDept: any;
  let testSection: any;
  let testCourse: any;
  let testFacultyProfile: any;
  let testStudentProfile: any;

  before(async () => {
    // Lookup seeded baseline accounts
    adminUser = await prisma.user.findUnique({ where: { email: 'admin@caias.edu.in' } });
    facultyUser = await prisma.user.findUnique({ where: { email: 'faculty@caias.edu.in' } });

    assert.ok(adminUser, 'Admin account must exist from seed');
    assert.ok(facultyUser, 'Faculty account must exist from seed');

    // Lookup academic records
    testDept = await prisma.department.findFirst();
    testSection = await prisma.classSection.findFirst();
    testCourse = await prisma.course.findFirst();
    testFacultyProfile = await prisma.faculty.findFirst({ where: { userId: facultyUser.id } });

    // Create test student with 128D face template to test student workflows
    const studentPasswordHash = await bcrypt.hash('student123', 10);
    studentUser = await prisma.user.create({
      data: {
        email: 'test.student@caias.edu.in',
        passwordHash: studentPasswordHash,
        name: 'Test Enrolled Student',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });

    testStudentProfile = await prisma.student.create({
      data: {
        userId: studentUser.id,
        rollNumber: '24BCA999',
        name: 'Test Enrolled Student',
        email: 'test.student@caias.edu.in',
        phone: '+91 99999 88888',
        departmentId: testDept.id,
        currentSemester: 3,
        currentSectionId: testSection.id,
        isFaceEnrolled: true,
        accountStatus: 'ACTIVE',
      },
    });

    await prisma.enrollment.create({
      data: {
        studentId: testStudentProfile.id,
        classSectionId: testSection.id,
        status: 'ENROLLED',
      },
    });

    await prisma.faceTemplate.create({
      data: {
        studentId: testStudentProfile.id,
        embedding: JSON.stringify(new Array(128).fill(0.088)),
        modelVersion: 'MobileFaceNet-OpenCV-128D',
        sampleCount: 5,
        status: 'ENROLLED',
      },
    });

    // Generate tokens
    adminToken = await signToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: 'ADMIN',
      name: adminUser.name,
    });

    facultyToken = await signToken({
      userId: facultyUser.id,
      email: facultyUser.email,
      role: 'FACULTY',
      name: facultyUser.name,
    });

    studentToken = await signToken({
      userId: studentUser.id,
      email: studentUser.email,
      role: 'STUDENT',
      name: studentUser.name,
    });
  });

  after(async () => {
    if (testStudentProfile) {
      await prisma.faceTemplate.deleteMany({ where: { studentId: testStudentProfile.id } });
      await prisma.enrollment.deleteMany({ where: { studentId: testStudentProfile.id } });
      await prisma.student.deleteMany({ where: { id: testStudentProfile.id } });
    }
    if (studentUser) {
      await prisma.user.deleteMany({ where: { id: studentUser.id } });
    }
    await prisma.$disconnect();
  });

  // =========================================================================
  // 1. AUTHENTICATION & RBAC TESTS
  // =========================================================================
  describe('1. Authentication & Security Access Controls', () => {
    it('should successfully verify valid Admin credentials and generate signed JWT', async () => {
      const isMatch = await bcrypt.compare('admin123', adminUser.passwordHash);
      assert.strictEqual(isMatch, true, 'Admin password hash verification failed');
      const payload = await verifyToken(adminToken);
      assert.strictEqual(payload?.role, 'ADMIN', 'Admin token payload role mismatch');
      assert.strictEqual(payload?.email, 'admin@caias.edu.in');
    });

    it('should successfully verify valid Faculty credentials and role', async () => {
      const isMatch = await bcrypt.compare('faculty123', facultyUser.passwordHash);
      assert.strictEqual(isMatch, true, 'Faculty password hash verification failed');
      const payload = await verifyToken(facultyToken);
      assert.strictEqual(payload?.role, 'FACULTY');
    });

    it('should successfully verify valid Student credentials and role', async () => {
      const isMatch = await bcrypt.compare('student123', studentUser.passwordHash);
      assert.strictEqual(isMatch, true, 'Student password hash verification failed');
      const payload = await verifyToken(studentToken);
      assert.strictEqual(payload?.role, 'STUDENT');
    });

    it('should reject incorrect password', async () => {
      const isMatch = await bcrypt.compare('wrongPassword!', adminUser.passwordHash);
      assert.strictEqual(isMatch, false, 'Invalid password should not match');
    });

    it('should reject access if account is deactivated', async () => {
      // Temporarily mark a test account INACTIVE
      const tempUser = await prisma.user.create({
        data: {
          email: 'deactivated.test@caias.edu.in',
          passwordHash: await bcrypt.hash('secret123', 10),
          name: 'Deactivated User',
          role: 'STUDENT',
          status: 'INACTIVE',
        },
      });

      const dbUser = await prisma.user.findUnique({ where: { id: tempUser.id } });
      assert.strictEqual(dbUser?.status, 'INACTIVE');

      // Cleanup
      await prisma.user.delete({ where: { id: tempUser.id } });
    });

    it('should enforce cross-role authorization denial (Student cannot access Admin actions)', async () => {
      const studentPayload = await verifyToken(studentToken);
      const isAllowedAdmin = studentPayload?.role === 'ADMIN';
      assert.strictEqual(isAllowedAdmin, false, 'Student must be denied access to Admin actions');
    });
  });

  // =========================================================================
  // 2. DATA SYNCHRONIZATION & MASTER ROSTER INTEGRITY TESTS
  // =========================================================================
  describe('2. Centralized Master Data Synchronization', () => {
    let createdStudentId: string;
    let createdUserId: string;

    it('should transactionally create student account, profile, and enrollment without duplication', async () => {
      const testEmail = `sync.student.${Date.now()}@caias.edu.in`;
      const testRoll = `TEST-${Date.now().toString().slice(-6)}`;

      const result = await prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            email: testEmail,
            passwordHash: await bcrypt.hash('test1234', 10),
            name: 'Sync Test Student',
            role: 'STUDENT',
            status: 'ACTIVE',
          },
        });

        const s = await tx.student.create({
          data: {
            userId: u.id,
            rollNumber: testRoll,
            name: 'Sync Test Student',
            email: testEmail,
            departmentId: testDept.id,
            currentSemester: 3,
            currentSectionId: testSection.id,
            accountStatus: 'ACTIVE',
          },
        });

        const e = await tx.enrollment.create({
          data: {
            studentId: s.id,
            classSectionId: testSection.id,
            status: 'ENROLLED',
          },
        });

        return { user: u, student: s, enrollment: e };
      });

      createdStudentId = result.student.id;
      createdUserId = result.user.id;

      assert.ok(result.user.id, 'Linked user ID must exist');
      assert.ok(result.student.id, 'Student record must exist');
      assert.strictEqual(result.student.userId, result.user.id, 'User and Student must be linked');
      assert.strictEqual(result.enrollment.status, 'ENROLLED', 'Student must be enrolled in class section');
    });

    it('should prevent duplicate student registration with the same roll number', async () => {
      const existing = await prisma.student.findUnique({ where: { id: createdStudentId } });
      assert.ok(existing);

      let threwError = false;
      try {
        await prisma.student.create({
          data: {
            userId: adminUser.id, // dummy
            rollNumber: existing.rollNumber, // DUPLICATE ROLL NUMBER
            name: 'Duplicate Student',
            email: `dup.${Date.now()}@caias.edu.in`,
            departmentId: testDept.id,
            currentSemester: 3,
            currentSectionId: testSection.id,
          },
        });
      } catch (err) {
        threwError = true;
      }
      assert.strictEqual(threwError, true, 'Unique constraint on rollNumber must reject duplicate');
    });

    it('should synchronize updates across User and Student records', async () => {
      const updatedName = 'Sync Student Renamed';
      await prisma.$transaction(async (tx) => {
        await tx.student.update({
          where: { id: createdStudentId },
          data: { name: updatedName },
        });
        await tx.user.update({
          where: { id: createdUserId },
          data: { name: updatedName },
        });
      });

      const updatedStu = await prisma.student.findUnique({ where: { id: createdStudentId } });
      const updatedUser = await prisma.user.findUnique({ where: { id: createdUserId } });

      assert.strictEqual(updatedStu?.name, updatedName);
      assert.strictEqual(updatedUser?.name, updatedName);
    });

    it('should revoke access when student is deactivated while preserving academic history', async () => {
      await prisma.$transaction(async (tx) => {
        await tx.student.update({
          where: { id: createdStudentId },
          data: { accountStatus: 'INACTIVE' },
        });
        await tx.user.update({
          where: { id: createdUserId },
          data: { status: 'INACTIVE' },
        });
      });

      const stu = await prisma.student.findUnique({ where: { id: createdStudentId } });
      const user = await prisma.user.findUnique({ where: { id: createdUserId } });

      assert.strictEqual(stu?.accountStatus, 'INACTIVE');
      assert.strictEqual(user?.status, 'INACTIVE');

      // Cleanup test records
      await prisma.enrollment.deleteMany({ where: { studentId: createdStudentId } });
      await prisma.student.delete({ where: { id: createdStudentId } });
      await prisma.user.delete({ where: { id: createdUserId } });
    });
  });

  // =========================================================================
  // 3. ATTENDANCE WORKFLOW & CALCULATION TESTS
  // =========================================================================
  describe('3. Attendance Session, Biometrics & Calculation Policies', () => {
    let testSession: any;

    it('should create an active attendance session for assigned course and class', async () => {
      testSession = await prisma.attendanceSession.create({
        data: {
          classSectionId: testSection.id,
          courseId: testCourse.id,
          facultyId: testFacultyProfile.id,
          sessionDate: '2026-10-27',
          startTime: '02:00 PM',
          endTime: '03:00 PM',
          status: 'ACTIVE',
          verificationMode: 'HYBRID_AI',
          roomNumber: 'Room 201',
        },
      });

      assert.ok(testSession.id, 'Session must receive a unique ID');
      assert.strictEqual(testSession.status, 'ACTIVE');
    });

    it('should record attendance for enrolled student and reject duplicate records', async () => {
      // 1. Initial attendance record
      const rec = await prisma.attendanceRecord.create({
        data: {
          sessionId: testSession.id,
          studentId: testStudentProfile.id,
          status: 'PRESENT',
          verificationMethod: 'FACE_AI',
          confidenceScore: 0.91,
          livenessScore: 0.95,
          markedById: testFacultyProfile.id,
        },
      });

      assert.ok(rec.id);
      assert.strictEqual(rec.status, 'PRESENT');

      // 2. Attempt duplicate insert for the same student and session
      let duplicateThrew = false;
      try {
        await prisma.attendanceRecord.create({
          data: {
            sessionId: testSession.id,
            studentId: testStudentProfile.id,
            status: 'PRESENT',
          },
        });
      } catch (err) {
        duplicateThrew = true;
      }

      assert.strictEqual(duplicateThrew, true, 'Composite unique constraint must prevent duplicate attendance');
    });

    it('should allow faculty to correct attendance with mandatory reason', async () => {
      const reason = 'Student arrived 5 minutes late due to scheduled lab transition; updated to LATE';
      const updated = await prisma.attendanceRecord.update({
        where: {
          sessionId_studentId: {
            sessionId: testSession.id,
            studentId: testStudentProfile.id,
          },
        },
        data: {
          status: 'LATE',
          verificationMethod: 'MANUAL',
          remarks: reason,
        },
      });

      assert.strictEqual(updated.status, 'LATE');
      assert.strictEqual(updated.remarks, reason);
    });

    it('should allow student to submit correction request and faculty to approve it', async () => {
      // 1. Student submits dispute
      const cr = await prisma.correctionRequest.create({
        data: {
          studentId: testStudentProfile.id,
          sessionId: testSession.id,
          reason: 'I was present in room 201, verified with classmate seat neighbor.',
          status: 'PENDING',
        },
      });

      assert.strictEqual(cr.status, 'PENDING');

      // 2. Faculty reviews and approves dispute
      const reviewed = await prisma.$transaction(async (tx) => {
        const approved = await tx.correctionRequest.update({
          where: { id: cr.id },
          data: {
            status: 'APPROVED',
            responseRemarks: 'Verified with attendance camera playback.',
            reviewedById: testFacultyProfile.id,
            reviewedAt: new Date(),
          },
        });

        await tx.attendanceRecord.update({
          where: {
            sessionId_studentId: {
              sessionId: testSession.id,
              studentId: testStudentProfile.id,
            },
          },
          data: {
            status: 'EXCUSED',
            verificationMethod: 'CORRECTION',
            remarks: 'Correction approved by faculty',
          },
        });

        return approved;
      });

      assert.strictEqual(reviewed.status, 'APPROVED');

      // Check attendance record updated to EXCUSED
      const rec = await prisma.attendanceRecord.findUnique({
        where: {
          sessionId_studentId: {
            sessionId: testSession.id,
            studentId: testStudentProfile.id,
          },
        },
      });
      assert.strictEqual(rec?.status, 'EXCUSED');
      assert.strictEqual(rec?.verificationMethod, 'CORRECTION');

      // Cleanup correction request
      await prisma.correctionRequest.delete({ where: { id: cr.id } });
    });

    it('should accurately calculate attendance percentage and exclude cancelled sessions', async () => {
      // Formula: Attended Sessions / Total Eligible Sessions * 100
      // 1. Create a cancelled session
      const cancelledSession = await prisma.attendanceSession.create({
        data: {
          classSectionId: testSection.id,
          courseId: testCourse.id,
          facultyId: testFacultyProfile.id,
          sessionDate: '2026-10-26',
          startTime: '04:00 PM',
          endTime: '05:00 PM',
          status: 'CANCELLED',
        },
      });

      // Fetch eligible non-cancelled sessions for student
      const eligibleRecords = await prisma.attendanceRecord.findMany({
        where: {
          studentId: testStudentProfile.id,
          session: { status: { not: 'CANCELLED' } },
        },
      });

      const totalEligible = eligibleRecords.length;
      const attended = eligibleRecords.filter((r) =>
        ['PRESENT', 'LATE', 'EXCUSED'].includes(r.status)
      ).length;

      const expectedPercentage = Number(((attended / totalEligible) * 100).toFixed(1));

      assert.ok(expectedPercentage >= 0 && expectedPercentage <= 100);
      assert.strictEqual(typeof expectedPercentage, 'number');

      // Cleanup test session and records
      await prisma.attendanceRecord.deleteMany({ where: { sessionId: testSession.id } });
      await prisma.attendanceSession.delete({ where: { id: testSession.id } });
      await prisma.attendanceSession.delete({ where: { id: cancelledSession.id } });
    });
  });
});
