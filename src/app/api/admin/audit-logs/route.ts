import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(['ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const where: any = {};
    if (action) where.action = { contains: action };

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { name: true, email: true, role: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('Fetch audit logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit trail' }, { status: 500 });
  }
}
