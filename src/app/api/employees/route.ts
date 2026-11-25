import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createEmployeeSchema = z.object({
  matricule: z.string().trim().min(2).max(40),
  nomComplet: z.string().trim().min(2).max(120),
  poste: z.string().trim().min(2).max(100),
  departement: z.string().trim().min(2).max(100),
  actif: z.boolean().optional().default(true),
  dateEmbauche: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim();
    const department = (searchParams.get('department') || '').trim();
    const status = (searchParams.get('status') || '').trim();

    const employees = await prisma.employee.findMany({
      where: {
        ...(department && department !== 'ALL' ? { departement: department } : {}),
        ...(status === 'ACTIVE' ? { actif: true } : status === 'INACTIVE' ? { actif: false } : {}),
        ...(search
          ? {
              OR: [
                { nomComplet: { contains: search, mode: 'insensitive' } },
                { matricule: { contains: search, mode: 'insensitive' } },
                { poste: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('GET /api/employees error:', error);
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
    const parsed = createEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.employee.findUnique({
      where: { matricule: parsed.data.matricule },
    });

    if (existing) {
      return NextResponse.json({ error: 'MATRICULE_EXISTS' }, { status: 409 });
    }

    const hireDate = parsed.data.dateEmbauche ? new Date(parsed.data.dateEmbauche) : new Date();
    const validHireDate = Number.isNaN(hireDate.getTime()) ? new Date() : hireDate;

    const employee = await prisma.employee.create({
      data: {
        matricule: parsed.data.matricule,
        nomComplet: parsed.data.nomComplet,
        poste: parsed.data.poste,
        departement: parsed.data.departement,
        actif: parsed.data.actif,
        dateEmbauche: validHireDate,
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

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    console.error('POST /api/employees error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}