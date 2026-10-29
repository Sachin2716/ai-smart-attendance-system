import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(['ADMIN', 'FACULTY']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const sectionId = searchParams.get('sectionId');
  const courseId = searchParams.get('courseId');

  try {
    const whereClause: any = {};
    if (sectionId) whereClause.classSectionId = sectionId;
    if (courseId) whereClause.courseId = courseId;

    const sessions = await prisma.attendanceSession.findMany({
      where: whereClause,
      include: {
        classSection: true,
        course: true,
        faculty: true,
        records: {
          include: { student: true },
        },
      },
      orderBy: { sessionDate: 'asc' },
    });

    // Build CSV content
    const rows = [
      ['Session ID', 'Date', 'Start Time', 'Class Section', 'Course Code', 'Course Name', 'Faculty', 'Student Roll No', 'Student Name', 'Status', 'Verification Method', 'Confidence Score', 'Liveness Score'],
    ];

    sessions.forEach((s) => {
      s.records.forEach((r) => {
        rows.push([
          s.id,
          s.sessionDate,
          s.startTime,
          s.classSection.fullLabel,
          s.course.code,
          `"${s.course.name.replace(/"/g, '""')}"`,
          `"${s.faculty.name.replace(/"/g, '""')}"`,
          r.student.rollNumber,
          `"${r.student.name.replace(/"/g, '""')}"`,
          r.status,
          r.verificationMethod,
          r.confidenceScore ? r.confidenceScore.toFixed(2) : 'N/A',
          r.livenessScore ? r.livenessScore.toFixed(2) : 'N/A',
        ]);
      });
    });

    const csvContent = rows.map((e) => e.join(',')).join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="Attendance_Report_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Export report error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
