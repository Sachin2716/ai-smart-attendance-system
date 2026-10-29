import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const auth = await requireAuth(['FACULTY', 'ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const faculty = await prisma.faculty.findUnique({
      where: { userId: auth.session!.userId },
      include: {
        department: true,
        assignments: {
          include: {
            course: true,
            classSection: true,
          },
        },
      },
    });

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty profile not found' }, { status: 404 });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[new Date().getDay()];

    // Today's timetable
    const todayTimetable = await prisma.timetableSlot.findMany({
      where: {
        facultyId: faculty.id,
        dayOfWeek: currentDay,
      },
      include: {
        course: true,
        classSection: true,
      },
      orderBy: { startTime: 'asc' },
    });

    // Today's sessions
    const sessionsToday = await prisma.attendanceSession.findMany({
      where: {
        facultyId: faculty.id,
        sessionDate: todayStr,
      },
      include: {
        course: true,
        classSection: true,
        records: true,
      },
      orderBy: { startTime: 'asc' },
    });

    // Pending correction requests for classes taught by this faculty
    const assignedSectionIds = faculty.assignments.map((a) => a.classSectionId);
    const pendingCorrections = await prisma.correctionRequest.findMany({
      where: {
        status: 'PENDING',
        session: {
          classSectionId: { in: assignedSectionIds },
        },
      },
      include: {
        student: true,
        session: { include: { course: true, classSection: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Calculate completion metrics
    const totalAssignedClasses = faculty.assignments.length;
    const completedSessionsCount = sessionsToday.filter((s) => s.status === 'COMPLETED').length;

    return NextResponse.json({
      success: true,
      faculty,
      todayTimetable,
      sessionsToday,
      pendingCorrections,
      stats: {
        totalAssignedClasses,
        sessionsConductedToday: sessionsToday.length,
        completedSessionsCount,
        pendingReviewCount: pendingCorrections.length,
      },
    });
  } catch (error: any) {
    console.error('Faculty dashboard error:', error);
    return NextResponse.json({ error: 'Failed to retrieve faculty dashboard data' }, { status: 500 });
  }
}
