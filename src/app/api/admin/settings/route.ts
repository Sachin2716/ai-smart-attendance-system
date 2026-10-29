import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const auth = await requireAuth(['ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(['ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json(); // array of { key, value }
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Expected an array of settings' }, { status: 400 });
    }

    for (const item of body) {
      if (item.key && item.value !== undefined) {
        await prisma.systemSetting.upsert({
          where: { key: item.key },
          update: { value: String(item.value) },
          create: {
            key: item.key,
            value: String(item.value),
            description: item.description || '',
          },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        actorId: auth.session!.userId,
        actorRole: auth.session!.role,
        action: 'UPDATE_SYSTEM_SETTINGS',
        entityType: 'SETTINGS',
        entityId: 'SYSTEM',
        newValue: JSON.stringify(body),
        reason: 'Administrative configuration update',
      },
    });

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error: any) {
    console.error('Save settings error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
