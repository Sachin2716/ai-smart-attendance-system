import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(['STUDENT', 'ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    const student = await prisma.student.findUnique({
      where: { userId: auth.session!.userId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const sessionWhere: any = { status: { not: 'CANCELLED' } };
    if (courseId) sessionWhere.courseId = courseId;
    if (startDate && endDate) {
      sessionWhere.sessionDate = { gte: startDate, lte: endDate };
    } else if (startDate) {
      sessionWhere.sessionDate = { gte: startDate };
    } else if (endDate) {
      sessionWhere.sessionDate = { lte: endDate };
    }

    const records = await prisma.attendanceRecord.findMany({
      where: {
        studentId: student.id,
        session: sessionWhere,
      },
      include: {
        session: {
          include: {
            course: true,
            faculty: true,
            classSection: true,
          },
        },
      },
      orderBy: { session: { sessionDate: 'desc' } },
    });

    return NextResponse.json({ success: true, records });
  } catch (error: any) {
    console.error('Fetch student attendance error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance records' }, { status: 500 });
  }
}
