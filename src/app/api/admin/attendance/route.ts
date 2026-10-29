import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(['ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const sectionId = searchParams.get('sectionId');
  const courseId = searchParams.get('courseId');
  const date = searchParams.get('date');

  try {
    const where: any = {};
    if (sectionId) where.classSectionId = sectionId;
    if (courseId) where.courseId = courseId;
    if (date) where.sessionDate = date;

    const sessions = await prisma.attendanceSession.findMany({
      where,
      include: {
        classSection: true,
        course: true,
        faculty: true,
        records: {
          include: {
            student: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, sessions });
  } catch (error: any) {
    console.error('Fetch admin attendance error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance history' }, { status: 500 });
  }
}
