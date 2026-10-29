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
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const slots = await prisma.timetableSlot.findMany({
      where: { classSectionId: student.currentSectionId },
      include: {
        course: true,
        faculty: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json({ success: true, slots });
  } catch (error: any) {
    console.error('Fetch student timetable error:', error);
    return NextResponse.json({ error: 'Failed to fetch timetable' }, { status: 500 });
  }
}
