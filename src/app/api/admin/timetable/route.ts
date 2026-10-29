import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createSlotSchema = z.object({
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  startTime: z.string().min(2),
  endTime: z.string().min(2),
  roomNumber: z.string().min(1),
  classSectionId: z.string().min(1),
  courseId: z.string().min(1),
  facultyId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth(['ADMIN', 'FACULTY', 'STUDENT']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const sectionId = searchParams.get('sectionId');
  const facultyId = searchParams.get('facultyId');

  try {
    const where: any = {};
    if (sectionId) where.classSectionId = sectionId;
    if (facultyId) where.facultyId = facultyId;

    const [slots, courses, faculty] = await Promise.all([
      prisma.timetableSlot.findMany({
        where,
        include: {
          classSection: true,
          course: true,
          faculty: true,
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      }),
      prisma.course.findMany({
        orderBy: { code: 'asc' },
      }),
      prisma.faculty.findMany({
        where: { accountStatus: 'ACTIVE' },
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({ success: true, slots, courses, faculty });
  } catch (error: any) {
    console.error('Fetch timetable error:', error);
    return NextResponse.json({ error: 'Failed to fetch timetable' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(['ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = createSlotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const slot = await prisma.timetableSlot.create({
      data: parsed.data,
      include: {
        classSection: true,
        course: true,
        faculty: true,
      },
    });

    return NextResponse.json({ success: true, slot }, { status: 201 });
  } catch (error: any) {
    console.error('Create timetable slot error:', error);
    return NextResponse.json({ error: 'Failed to create timetable slot' }, { status: 500 });
  }
}
