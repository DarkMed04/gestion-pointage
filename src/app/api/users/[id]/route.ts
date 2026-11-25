import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateUserSchema = z.object({
  nom: z.string().trim().min(2).max(100).optional(),
  username: z.string().trim().min(2).max(50).optional(),
  password: z.string().min(4).max(120).optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'SECURITY']).optional(),
  actif: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    let nextUsername: string | undefined;
    if (parsed.data.username) {
      nextUsername = parsed.data.username.toLowerCase();
      if (nextUsername !== existing.username) {
        const dup = await prisma.user.findUnique({ where: { username: nextUsername } });
        if (dup) {
          return NextResponse.json({ error: 'USERNAME_EXISTS' }, { status: 409 });
        }
      }
    }

    const nextPasswordHash =
      parsed.data.password && parsed.data.password.length >= 4
        ? await bcrypt.hash(parsed.data.password, 12)
        : undefined;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(parsed.data.nom !== undefined ? { nom: parsed.data.nom } : {}),
        ...(nextUsername !== undefined ? { username: nextUsername } : {}),
        ...(nextPasswordHash !== undefined ? { passwordHash: nextPasswordHash } : {}),
        ...(parsed.data.role !== undefined ? { role: parsed.data.role } : {}),
        ...(parsed.data.actif !== undefined ? { actif: parsed.data.actif } : {}),
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

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('PATCH /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;

    if (session.user.id === id) {
      return NextResponse.json({ error: 'CANNOT_DELETE_SELF' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}