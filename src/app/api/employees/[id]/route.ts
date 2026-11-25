import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateEmployeeSchema = z.object({
  matricule: z.string().trim().min(2).max(40).optional(),
  nomComplet: z.string().trim().min(2).max(120).optional(),
  poste: z.string().trim().min(2).max(100).optional(),
  departement: z.string().trim().min(2).max(100).optional(),
  actif: z.boolean().optional(),
  dateEmbauche: z.string().optional(),
});

export async function GET(
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
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        pointages: {
          orderBy: { datePointage: 'desc' },
          take: 15,
        },
        _count: {
          select: { pointages: true },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ employee });
  } catch (error) {
    console.error('GET /api/employees/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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
    const body = await req.json();
    const parsed = updateEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (parsed.data.matricule && parsed.data.matricule !== existing.matricule) {
      const duplicate = await prisma.employee.findUnique({
        where: { matricule: parsed.data.matricule },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'MATRICULE_EXISTS' }, { status: 409 });
      }
    }

    let parsedDate: Date | undefined;
    if (parsed.data.dateEmbauche) {
      const d = new Date(parsed.data.dateEmbauche);
      if (!Number.isNaN(d.getTime())) parsedDate = d;
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...(parsed.data.matricule !== undefined ? { matricule: parsed.data.matricule } : {}),
        ...(parsed.data.nomComplet !== undefined ? { nomComplet: parsed.data.nomComplet } : {}),
        ...(parsed.data.poste !== undefined ? { poste: parsed.data.poste } : {}),
        ...(parsed.data.departement !== undefined ? { departement: parsed.data.departement } : {}),
        ...(parsed.data.actif !== undefined ? { actif: parsed.data.actif } : {}),
        ...(parsedDate ? { dateEmbauche: parsedDate } : {}),
      },
      include: {
        pointages: {
          orderBy: { datePointage: 'desc' },
          take: 5,
        },
        _count: {
          select: { pointages: true },
        },
      },
    });

    return NextResponse.json({ employee: updated });
  } catch (error) {
    console.error('PATCH /api/employees/[id] error:', error);
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
    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/employees/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}