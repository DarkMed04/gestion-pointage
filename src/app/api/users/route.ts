import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createUserSchema = z.object({
  nom: z.string().trim().min(2).max(100),
  username: z.string().trim().min(2).max(50),
  password: z.string().min(4).max(120),
  role: z.enum(['ADMIN', 'SECURITY']).default('SECURITY'),
  actif: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        nom: true,
        username: true,
        role: true,
        actif: true,
        createdAt: true,
        _count: {
          select: { pointagesEnregistres: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid user data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const normalizedUsername = parsed.data.username.toLowerCase();
    const exists = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (exists) {
      return NextResponse.json({ error: 'USERNAME_EXISTS' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const created = await prisma.user.create({
      data: {
        nom: parsed.data.nom,
        username: normalizedUsername,
        passwordHash,
        role: parsed.data.role,
        actif: parsed.data.actif,
      },
      select: {
        id: true,
        nom: true,
        username: true,
        role: true,
        actif: true,
        createdAt: true,
        _count: {
          select: { pointagesEnregistres: true },
        },
      },
    });

    return NextResponse.json({ user: created }, { status: 201 });
  } catch (error) {
    console.error('POST /api/users error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}