import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  // Fetch role-specific profile details
  let profile = null;
  if (session.role === 'STUDENT') {
    profile = await prisma.student.findUnique({
      where: { userId: session.userId },
      include: {
        department: true,
        currentSection: true,
      },
    });
  } else if (session.role === 'FACULTY') {
    profile = await prisma.faculty.findUnique({
      where: { userId: session.userId },
      include: {
        department: true,
      },
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      profile,
    },
  });
}
