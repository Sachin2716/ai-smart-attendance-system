import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const auth = await requireAuth(['ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Parallel live database queries
    const [
      totalActiveStudents,
      totalActiveFaculty,
      totalDepartments,
      totalSections,
      sessionsToday,
      totalRecords,
      presentRecords,
      absentRecords,
      pendingCorrections,
      recentLogs,
    ] = await Promise.all([
      prisma.student.count({ where: { accountStatus: 'ACTIVE' } }),
      prisma.faculty.count({ where: { accountStatus: 'ACTIVE' } }),
      prisma.department.count(),
      prisma.classSection.count(),
      prisma.attendanceSession.count({ where: { sessionDate: todayStr } }),
      prisma.attendanceRecord.count(),
      prisma.attendanceRecord.count({ where: { status: { in: ['PRESENT', 'LATE', 'EXCUSED'] } } }),
      prisma.attendanceRecord.count({ where: { status: 'ABSENT' } }),
      prisma.correctionRequest.count({ where: { status: 'PENDING' } }),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { timestamp: 'desc' },
        include: { actor: { select: { name: true, email: true, role: true } } },
      }),
    ]);

    const overallAttendancePercent =
      totalRecords > 0 ? Number(((presentRecords / totalRecords) * 100).toFixed(1)) : 0;

    // Course attendance breakdown
    const courses = await prisma.course.findMany({
      include: {
        sessions: {
          include: {
            records: true,
          },
        },
      },
      take: 6,
    });

    const courseStats = courses.map((c) => {
      let attended = 0;
      let total = 0;
      c.sessions.forEach((s) => {
        if (s.status !== 'CANCELLED') {
          s.records.forEach((r) => {
            total++;
            if (['PRESENT', 'LATE', 'EXCUSED'].includes(r.status)) attended++;
          });
        }
      });
      return {
        courseCode: c.code,
        courseName: c.name,
        percentage: total > 0 ? Number(((attended / total) * 100).toFixed(1)) : 0,
        totalSessions: c.sessions.length,
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalActiveStudents,
        totalActiveFaculty,
        presentStudents: presentRecords,
        absentStudents: absentRecords,
        overallAttendancePercent,
        totalDepartments,
        totalSections,
        sessionsToday,
        pendingCorrections,
        totalRecords,
      },
      recentLogs,
      courseStats,
    });
  } catch (error: any) {
    console.error('Admin dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve admin dashboard metrics' }, { status: 500 });
  }
}
