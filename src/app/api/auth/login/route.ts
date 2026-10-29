import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken, COOKIE_NAME } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid request body' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Account is deactivated. Contact the system administrator.' },
        { status: 403 }
      );
    }

    // Verify password
    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Role-based destination
    let redirectUrl = '/student/dashboard';
    if (user.role === 'ADMIN') redirectUrl = '/admin/dashboard';
    else if (user.role === 'FACULTY') redirectUrl = '/faculty/dashboard';

    // Sign JWT
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'FACULTY' | 'STUDENT',
      name: user.name,
    });

    // Record login audit log
    try {
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          actorRole: user.role,
          action: 'LOGIN_SUCCESS',
          entityType: 'AUTH',
          entityId: user.id,
          newValue: 'User logged in',
        },
      });
    } catch (e) {
      // Non-blocking audit log
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      redirectUrl,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during authentication' },
      { status: 500 }
    );
  }
}
