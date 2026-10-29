import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        classSections: {
          select: {
            id: true,
            fullLabel: true,
            semester: true,
            sectionName: true,
          },
          orderBy: { fullLabel: 'asc' },
        },
      },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json({ success: true, departments });
  } catch (error: any) {
    console.error('Academic catalog fetch error:', error);
    return NextResponse.json({ error: 'Failed to load academic catalog' }, { status: 500 });
  }
}
