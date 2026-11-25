import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const pointageSchema = z.object({
  employeeId: z.string().trim().min(1),
  date: z.string().optional(), // YYYY-MM-DD
  heureEntree: z.string().trim().nullable().optional(), // "HH:MM"
  heureSortie: z.string().trim().nullable().optional(), // "HH:MM"
  statut: z.enum(['PRESENT', 'RETARD', 'ABSENT', 'CONGE']).optional(),
  remarque: z.string().trim().max(300).nullable().optional(),
});

function timeToMinutes(timeStr: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeStr.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  return h * 60 + m;
}

function normalizeDayDate(dateStr?: string): Date {
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  }
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date') || undefined;
    const search = (searchParams.get('search') || '').trim();
    const targetDate = normalizeDayDate(dateParam);

    let settings = await prisma.settings.findUnique({
      where: { id: 'default_settings' },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'default_settings',
          heureEntreeStandard: '08:30',
          heureSortieStandard: '17:30',
          margeToleranceMinutes: 0,
        },
      });
    }

    const employees = await prisma.employee.findMany({
      where: {
        actif: true,
        ...(search
          ? {
              OR: [
                { nomComplet: { contains: search, mode: 'insensitive' } },
                { matricule: { contains: search, mode: 'insensitive' } },
                { departement: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        pointages: {
          where: { datePointage: targetDate },
          include: {
            enregistrePar: {
              select: { id: true, nom: true, username: true },
            },
          },
        },
      },
      orderBy: { nomComplet: 'asc' },
    });

    const rows = employees.map((emp) => ({
      employee: {
        id: emp.id,
        matricule: emp.matricule,
        nomComplet: emp.nomComplet,
        poste: emp.poste,
        departement: emp.departement,
      },
      pointage: emp.pointages[0] ?? null,
    }));

    return NextResponse.json({
      date: targetDate.toISOString().split('T')[0],
      settings,
      rows,
    });
  } catch (error) {
    console.error('GET /api/pointage error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = pointageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const targetDate = normalizeDayDate(parsed.data.date);
    const empExists = await prisma.employee.findUnique({
      where: { id: parsed.data.employeeId },
    });
    if (!empExists) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const settings =
      (await prisma.settings.findUnique({ where: { id: 'default_settings' } })) ??
      (await prisma.settings.create({
        data: {
          id: 'default_settings',
          heureEntreeStandard: '08:30',
          heureSortieStandard: '17:30',
          margeToleranceMinutes: 0,
        },
      }));

    const stdEntryMin = timeToMinutes(settings.heureEntreeStandard) ?? 8 * 60 + 30;
    const stdExitMin = timeToMinutes(settings.heureSortieStandard) ?? 17 * 60 + 30;
    const allowedEntryMin = stdEntryMin + (settings.margeToleranceMinutes || 0);

    const entreeStr = parsed.data.heureEntree ? parsed.data.heureEntree.trim() : null;
    const sortieStr = parsed.data.heureSortie ? parsed.data.heureSortie.trim() : null;

    const entreeMin = entreeStr ? timeToMinutes(entreeStr) : null;
    const sortieMin = sortieStr ? timeToMinutes(sortieStr) : null;

    let minutesRetard = 0;
    let estEnRetard = false;

    if (entreeMin !== null && entreeMin > allowedEntryMin) {
      minutesRetard = entreeMin - stdEntryMin;
      estEnRetard = true;
    }

    // Ila khrej 9bel lwe9t dyal sortie b tari9a ghir tab3a
    if (sortieMin !== null && sortieMin < stdExitMin) {
      estEnRetard = true;
    }

    let computedStatut = parsed.data.statut;
    if (!computedStatut) {
      if (!entreeStr && !sortieStr) {
        computedStatut = 'ABSENT';
      } else if (estEnRetard) {
        computedStatut = 'RETARD';
      } else {
        computedStatut = 'PRESENT';
      }
    }

    const recorderId = session.user.id || null;

    const saved = await prisma.pointage.upsert({
      where: {
        employeeId_datePointage: {
          employeeId: parsed.data.employeeId,
          datePointage: targetDate,
        },
      },
      update: {
        heureEntree: entreeStr,
        heureSortie: sortieStr,
        minutesRetard,
        estEnRetard,
        statut: computedStatut,
        remarque: parsed.data.remarque ?? null,
        ...(recorderId ? { enregistreParId: recorderId } : {}),
      },
      create: {
        employeeId: parsed.data.employeeId,
        datePointage: targetDate,
        heureEntree: entreeStr,
        heureSortie: sortieStr,
        minutesRetard,
        estEnRetard,
        statut: computedStatut,
        remarque: parsed.data.remarque ?? null,
        enregistreParId: recorderId,
      },
      include: {
        enregistrePar: {
          select: { id: true, nom: true, username: true },
        },
      },
    });

    return NextResponse.json({ pointage: saved });
  } catch (error) {
    console.error('POST /api/pointage error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}