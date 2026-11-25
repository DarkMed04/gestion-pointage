import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateSettingsSchema = z.object({
  heureEntreeStandard: z.string().trim().regex(/^\d{1,2}:\d{2}$/),
  heureSortieStandard: z.string().trim().regex(/^\d{1,2}:\d{2}$/),
  margeToleranceMinutes: z.number().int().min(0).max(180),
});

function getTodayUTCStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
}

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
    const period = (searchParams.get('period') || 'month').toLowerCase();

    const now = new Date();
    let startDate: Date | null = null;

    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    } else if (period === 'year') {
      startDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
    }

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

    const todayStart = getTodayUTCStart();

    const [employees, todayPointages, periodPointages] = await Promise.all([
      prisma.employee.findMany({
        where: { actif: true },
        select: {
          id: true,
          matricule: true,
          nomComplet: true,
          poste: true,
          departement: true,
        },
      }),
      prisma.pointage.findMany({
        where: { datePointage: todayStart },
        select: {
          id: true,
          estEnRetard: true,
          minutesRetard: true,
        },
      }),
      prisma.pointage.findMany({
        where: startDate ? { datePointage: { gte: startDate } } : undefined,
        select: {
          employeeId: true,
          estEnRetard: true,
          minutesRetard: true,
          statut: true,
        },
      }),
    ]);

    const todayTotal = todayPointages.length;
    const todayGreen = todayPointages.filter((p) => !p.estEnRetard).length;
    const todayRed = todayPointages.filter((p) => p.estEnRetard).length;

    const metricsByEmp = new Map<
      string,
      {
        onTimeDays: number;
        totalDays: number;
        lateDays: number;
        totalLateMinutes: number;
      }
    >();

    for (const emp of employees) {
      metricsByEmp.set(emp.id, {
        onTimeDays: 0,
        totalDays: 0,
        lateDays: 0,
        totalLateMinutes: 0,
      });
    }

    for (const pt of periodPointages) {
      const m = metricsByEmp.get(pt.employeeId);
      if (!m) continue;
      m.totalDays += 1;
      if (pt.estEnRetard || pt.minutesRetard > 0 || pt.statut === 'RETARD') {
        m.lateDays += 1;
        m.totalLateMinutes += pt.minutesRetard || 0;
      } else {
        m.onTimeDays += 1;
      }
    }

    const combined = employees.map((emp) => {
      const m = metricsByEmp.get(emp.id) ?? {
        onTimeDays: 0,
        totalDays: 0,
        lateDays: 0,
        totalLateMinutes: 0,
      };
      const punctualityRate =
        m.totalDays > 0 ? Math.round((m.onTimeDays / m.totalDays) * 100) : 0;

      return {
        ...emp,
        ...m,
        punctualityRate,
      };
    });

    // Top 5 li kay7adro flwe9t bzaaf w 0 delay
    const topDisciplined = [...combined]
      .filter((x) => x.onTimeDays > 0)
      .sort((a, b) => {
        if (b.onTimeDays !== a.onTimeDays) return b.onTimeDays - a.onTimeDays;
        if (a.totalLateMinutes !== b.totalLateMinutes) return a.totalLateMinutes - b.totalLateMinutes;
        return b.punctualityRate - a.punctualityRate;
      })
      .slice(0, 5);

    // Akther 5 dyal nass li kayt3atlo
    const topDelayed = [...combined]
      .filter((x) => x.totalLateMinutes > 0 || x.lateDays > 0)
      .sort((a, b) => {
        if (b.totalLateMinutes !== a.totalLateMinutes) return b.totalLateMinutes - a.totalLateMinutes;
        return b.lateDays - a.lateDays;
      })
      .slice(0, 5);

    return NextResponse.json({
      period,
      settings,
      kpis: {
        activeEmployees: employees.length,
        todayTotal,
        todayGreen,
        todayRed,
      },
      topDisciplined,
      topDelayed,
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid settings data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.settings.upsert({
      where: { id: 'default_settings' },
      update: {
        heureEntreeStandard: parsed.data.heureEntreeStandard,
        heureSortieStandard: parsed.data.heureSortieStandard,
        margeToleranceMinutes: parsed.data.margeToleranceMinutes,
      },
      create: {
        id: 'default_settings',
        heureEntreeStandard: parsed.data.heureEntreeStandard,
        heureSortieStandard: parsed.data.heureSortieStandard,
        margeToleranceMinutes: parsed.data.margeToleranceMinutes,
      },
    });

    return NextResponse.json({ settings: updated });
  } catch (error) {
    console.error('PATCH /api/dashboard error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}