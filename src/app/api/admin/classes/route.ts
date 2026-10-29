import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createSectionSchema = z.object({
  departmentId: z.string().min(1),
  semester: z.number().int().min(1).max(8),
  sectionName: z.string().min(1).max(5),
  fullLabel: z.string().min(2),
});

export async function GET() {
  const auth = await requireAuth(['ADMIN', 'FACULTY']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const sections = await prisma.classSection.findMany({
      include: {
        department: true,
        _count: {
          select: { students: true, enrollments: true, sessions: true },
        },
      },
      orderBy: [{ semester: 'asc' }, { sectionName: 'asc' }],
    });

    const courses = await prisma.course.findMany({
      include: { department: true },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json({ success: true, sections, courses });
  } catch (error: any) {
    console.error('Fetch classes error:', error);
    return NextResponse.json({ error: 'Failed to fetch class sections' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(['ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = createSectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { departmentId, semester, sectionName, fullLabel } = parsed.data;

    const existing = await prisma.classSection.findUnique({
      where: { fullLabel: fullLabel.trim().toUpperCase() },
    });
    if (existing) {
      return NextResponse.json({ error: 'A class section with this label already exists' }, { status: 409 });
    }

    const section = await prisma.classSection.create({
      data: {
        departmentId,
        semester,
        sectionName: sectionName.trim().toUpperCase(),
        fullLabel: fullLabel.trim().toUpperCase(),
      },
      include: { department: true },
    });

    return NextResponse.json({ success: true, section }, { status: 201 });
  } catch (error: any) {
    console.error('Create class section error:', error);
    return NextResponse.json({ error: 'Failed to create class section' }, { status: 500 });
  }
}
