import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateSlotSchema = z.object({
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).optional(),
  startTime: z.string().min(2).optional(),
  endTime: z.string().min(2).optional(),
  roomNumber: z.string().min(1).optional(),
  courseId: z.string().min(1).optional(),
  facultyId: z.string().min(1).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(['ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateSlotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const existing = await prisma.timetableSlot.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Timetable slot not found' }, { status: 404 });
    }

    const updated = await prisma.timetableSlot.update({
      where: { id },
      data: parsed.data,
      include: {
        classSection: true,
        course: true,
        faculty: true,
      },
    });

    return NextResponse.json({ success: true, slot: updated });
  } catch (error: any) {
    console.error('Update timetable slot error:', error);
    return NextResponse.json({ error: 'Failed to update timetable slot' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(['ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    const existing = await prisma.timetableSlot.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Timetable slot not found' }, { status: 404 });
    }

    await prisma.timetableSlot.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Timetable slot deleted' });
  } catch (error: any) {
    console.error('Delete timetable slot error:', error);
    return NextResponse.json({ error: 'Failed to delete timetable slot' }, { status: 500 });
  }
}
