import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const auth = await requireAuth(['STUDENT', 'ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { userId: auth.session!.userId },
      include: {
        department: true,
        currentSection: true,
        faceTemplate: { select: { status: true, enrolledAt: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[new Date().getDay()];

    // 1. Today's Timetable
    const todayTimetable = await prisma.timetableSlot.findMany({
      where: {
        classSectionId: student.currentSectionId,
        dayOfWeek: currentDay,
      },
      include: {
        course: true,
        faculty: true,
      },
      orderBy: { startTime: 'asc' },
    });

    // 2. Attendance Records
    const records = await prisma.attendanceRecord.findMany({
      where: {
        studentId: student.id,
        session: { status: { not: 'CANCELLED' } },
      },
      include: {
        session: {
          include: { course: true, faculty: true },
        },
      },
      orderBy: { session: { sessionDate: 'desc' } },
    });

    // 3. Calculate Overall Metrics
    const totalEligibleSessions = records.length;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    const courseMap: Record<string, { code: string; name: string; total: number; attended: number }> = {};

    records.forEach((r) => {
      const course = r.session.course;
      if (!courseMap[course.id]) {
        courseMap[course.id] = {
          code: course.code,
          name: course.name,
          total: 0,
          attended: 0,
        };
      }
      courseMap[course.id].total++;

      if (r.status === 'PRESENT') {
        presentCount++;
        courseMap[course.id].attended++;
      } else if (r.status === 'LATE') {
        lateCount++;
        courseMap[course.id].attended++;
      } else if (r.status === 'EXCUSED') {
        excusedCount++;
        courseMap[course.id].attended++;
      } else {
        absentCount++;
      }
    });

    const attendedCount = presentCount + lateCount + excusedCount;
    const overallPercentage =
      totalEligibleSessions > 0
        ? Number(((attendedCount / totalEligibleSessions) * 100).toFixed(1))
        : 0;

    const subjectWise = Object.values(courseMap).map((c) => ({
      ...c,
      percentage: c.total > 0 ? Number(((c.attended / c.total) * 100).toFixed(1)) : 0,
    }));

    // 4. Notifications & Active Warnings
    const notifications = await prisma.notification.findMany({
      where: { userId: auth.session!.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const isLowAttendance = totalEligibleSessions > 0 && overallPercentage < 75;

    return NextResponse.json({
      success: true,
      student,
      todayTimetable,
      recentRecords: records.slice(0, 8),
      subjectWise,
      metrics: {
        totalEligibleSessions,
        attendedCount,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        overallPercentage,
        isLowAttendance,
      },
      notifications,
    });
  } catch (error: any) {
    console.error('Student dashboard error:', error);
    return NextResponse.json({ error: 'Failed to retrieve student dashboard data' }, { status: 500 });
  }
}
