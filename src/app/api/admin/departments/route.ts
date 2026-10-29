import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createDeptSchema = z.object({
  code: z.string().min(2).max(10),
  name: z.string().min(3),
});

export async function GET() {
  const auth = await requireAuth(['ADMIN', 'FACULTY']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const departments = await prisma.department.findMany({
      include: {
        courses: true,
        classSections: true,
        _count: {
          select: { students: true, faculty: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json({ success: true, departments });
  } catch (error: any) {
    console.error('Fetch departments error:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(['ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = createDeptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { code, name } = parsed.data;

    const existing = await prisma.department.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (existing) {
      return NextResponse.json({ error: 'A department with this code already exists' }, { status: 409 });
    }

    const dept = await prisma.department.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
      },
    });

    return NextResponse.json({ success: true, department: dept }, { status: 201 });
  } catch (error: any) {
    console.error('Create department error:', error);
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}
