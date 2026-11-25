'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  ShieldAlert,
  Trophy,
  AlertOctagon,
  Clock,
  Save,
  Sun,
  Moon,
  Languages,
  LogOut,
  CheckCircle2,
  Loader2,
  Award,
} from 'lucide-react';

type Lang = 'ar' | 'fr';
type Period = 'week' | 'month' | 'year' | 'all';

interface LeaderItem {
  id: string;
  matricule: string;
  nomComplet: string;
  poste: string;
  departement: string;
  onTimeDays: number;
  totalDays: number;
  lateDays: number;
  totalLateMinutes: number;
  punctualityRate: number;
}

interface DashboardResponse {
  kpis: {
    activeEmployees: number;
    todayTotal: number;
    todayGreen: number;
    todayRed: number;
  };
  settings: {
    heureEntreeStandard: string;
    heureSortieStandard: string;
    margeToleranceMinutes: number;
  };
  topDisciplined: LeaderItem[];
  topDelayed: LeaderItem[];
}

const dict = {
  ar: {
    title: 'لوحة القيادة والمكافآت',
    subtitle: 'متابعة الحضور، إعداد التوقيت اليدوي، وقائمة التميز والتأخير',
    activeEmp: 'الموظفون النشطون',
    todayRecorded: 'مسجلو اليوم',
    todayGreen: 'في الوقت (أخضر)',
    todayRed: 'متأخر / مبكر (أحمر)',
    manualTimeTitle: 'إعدادات التوقيت اليدوي (اللون الأخضر والأحمر)',
    entryStd: 'وقت الدخول الرسمي',
    exitStd: 'وقت الخروج الرسمي',
    toleranceMin: 'هامش التسامح (بالدقائق)',
    saveSettings: 'حفظ التوقيت',
    saving: 'جاري الحفظ...',
    settingsSaved: 'تم تحديث إعدادات التوقيت بنجاح.',
    settingsErr: 'تعذر حفظ الإعدادات.',
    top5Title: 'أفضل 5 موظفين التزاماً (المكافآت)',
    top5Sub: 'الأكثر حضوراً في الوقت دون تأخير',
    worst5Title: 'أكثر 5 موظفين تأخيراً',
    worst5Sub: 'الأعلى في مجموع دقائق التأخير',
    onTimeDays: 'أيام في الوقت',
    lateMinTotal: 'د تأخير',
    noData: 'لا توجد بيانات كافية لهذه الفترة.',
    week: 'أسبوع',
    month: 'شهر',
    year: 'سنة',
    all: 'الكل',
    logout: 'خروج',
    langSwitch: 'FR',
    navDashboard: 'الرئيسية',
    navEmployees: 'الموظفون',
    navPointage: 'الحضور',
    navUsers: 'الأمن',
  },
  fr: {
    title: 'Tableau de Bord & Récompenses',
    subtitle: 'Suivi du pointage, horaires manuels, Top 5 discipline et retards',
    activeEmp: 'Employés actifs',
    todayRecorded: "Pointés aujourd'hui",
    todayGreen: "À l'heure (Vert)",
    todayRed: 'Retard / Avance (Rouge)',
    manualTimeTitle: 'Configuration Horaire Manuel (Vert / Rouge)',
    entryStd: 'Heure entrée standard',
    exitStd: 'Heure sortie standard',
    toleranceMin: 'Tolérance (minutes)',
    saveSettings: 'Enregistrer horaire',
    saving: 'Envoi...',
    settingsSaved: 'Paramètres horaires mis à jour.',
    settingsErr: 'Erreur lors de la mise à jour.',
    top5Title: 'Top 5 Meilleure Ponctualité (Récompenses)',
    top5Sub: "Plus grand nombre de jours à l'heure",
    worst5Title: 'Top 5 Plus Grands Retards',
    worst5Sub: 'Cumul le plus élevé de minutes de retard',
    onTimeDays: "j à l'heure",
    lateMinTotal: 'min retard',
    noData: 'Aucune donnée pour cette période.',
    week: 'Semaine',
    month: 'Mois',
    year: 'Année',
    all: 'Tout',
    logout: 'Déconnexion',
    langSwitch: 'AR',
    navDashboard: 'Accueil',
    navEmployees: 'Employés',
    navPointage: 'Pointage',
    navUsers: 'Sécurité',
  },
} as const;

export default function DashboardPage() {
  const [lang, setLang] = useState<Lang>('ar');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [period, setPeriod] = useState<Period>('month');

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [heureEntreeStandard, setHeureEntreeStandard] = useState('08:30');
  const [heureSortieStandard, setHeureSortieStandard] = useState('17:30');
  const [margeToleranceMinutes, setMargeToleranceMinutes] = useState<number>(0);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 3000);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('gp_theme');
    const darkMode = savedTheme ? savedTheme === 'dark' : true;
    setIsDark(darkMode);
    document.documentElement.classList.toggle('dark', darkMode);

    const savedLang = (localStorage.getItem('gp_lang') as Lang | null) || 'ar';
    setLang(savedLang);
    document.documentElement.lang = savedLang;
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('gp_theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  const toggleLang = () => {
    const next: Lang = lang === 'ar' ? 'fr' : 'ar';
    setLang(next);
    localStorage.setItem('gp_lang', next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?period=${period}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Dashboard load failed');
      const json: DashboardResponse = await res.json();
      setData(json);
      if (json.settings) {
        setHeureEntreeStandard(json.settings.heureEntreeStandard);
        setHeureSortieStandard(json.settings.heureSortieStandard);
        setMargeToleranceMinutes(json.settings.margeToleranceMinutes);
      }
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/dashboard', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heureEntreeStandard,
          heureSortieStandard,
          margeToleranceMinutes: Number(margeToleranceMinutes) || 0,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      notify(dict[lang].settingsSaved);
      await loadDashboard();
    } catch {
      notify(dict[lang].settingsErr);
    } finally {
      setSavingSettings(false);
    }
  };

  const t = dict[lang];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-100 pb-24 text-slate-900 transition-colors duration-300 dark:bg-[#070b14] dark:text-slate-100 md:pb-10">
      {/* Ambient Liquid Glass Blobs */}
      <div className="pointer-events-none fixed -top-32 -left-24 h-96 w-96 rounded-full bg-emerald-400/25 blur-3xl dark:bg-emerald-500/15" />
      <div className="pointer-events-none fixed top-1/2 -right-24 h-96 w-96 rounded-full bg-amber-400/20 blur-3xl dark:bg-indigo-500/15" />

      {/* Top Glass Header (Fixed Layout) */}
      <header className="sticky top-0 z-30 border-b border-white/30 bg-white/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 ring-1 ring-emerald-400/40">
              <LayoutDashboard className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-bold sm:text-xl">{t.title}</h1>
              <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                {t.subtitle}
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            <Link
              href="/dashboard"
              className="rounded-xl bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-600 ring-1 ring-emerald-500/30 dark:text-emerald-400"
            >
              {t.navDashboard}
            </Link>
            <Link
              href="/employees"
              className="glass-card rounded-xl px-3.5 py-2 text-xs font-semibold transition hover:bg-white/80 dark:hover:bg-slate-800/70"
            >
              {t.navEmployees}
            </Link>
            <Link
              href="/pointage"
              className="glass-card rounded-xl px-3.5 py-2 text-xs font-semibold transition hover:bg-white/80 dark:hover:bg-slate-800/70"
            >
              {t.navPointage}
            </Link>
            <Link
              href="/users"
              className="glass-card rounded-xl px-3.5 py-2 text-xs font-semibold transition hover:bg-white/80 dark:hover:bg-slate-800/70"
            >
              {t.navUsers}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLang}
              className="glass-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold"
            >
              <Languages className="h-4 w-4 text-emerald-500" />
              <span>{t.langSwitch}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="glass-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold"
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </button>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="glass-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 md:bottom-6">
          <div className="glass-card flex items-center gap-2 rounded-2xl border-emerald-500/40 px-4 py-3 text-xs font-bold text-emerald-700 shadow-2xl dark:text-emerald-300 sm:text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>{toast}</span>
          </div>
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6">
        {/* KPIs */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="glass-card rounded-2xl p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.activeEmp}
            </span>
            <p className="mt-2 text-2xl font-extrabold sm:text-3xl">
              {data?.kpis.activeEmployees ?? 0}
            </p>
          </div>

          <div className="glass-card rounded-2xl p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.todayRecorded}
            </span>
            <p className="mt-2 text-2xl font-extrabold text-cyan-600 dark:text-cyan-400 sm:text-3xl">
              {data?.kpis.todayTotal ?? 0}
            </p>
          </div>

          <div className="glass-card rounded-2xl p-4 sm:p-5">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {t.todayGreen}
            </span>
            <p className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 sm:text-3xl">
              {data?.kpis.todayGreen ?? 0}
            </p>
          </div>

          <div className="glass-card rounded-2xl p-4 sm:p-5">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {t.todayRed}
            </span>
            <p className="mt-2 text-2xl font-extrabold text-rose-600 dark:text-rose-400 sm:text-3xl">
              {data?.kpis.todayRed ?? 0}
            </p>
          </div>
        </section>

        {/* Manual Time Settings */}
        <section className="glass-card rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-500" />
            <h2 className="text-sm font-bold sm:text-base">{t.manualTimeTitle}</h2>
          </div>

          <form
            onSubmit={handleSaveSettings}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
          >
            <div>
              <label className="mb-1 block text-xs font-semibold">{t.entryStd}</label>
              <input
                type="time"
                required
                value={heureEntreeStandard}
                onChange={(e) => setHeureEntreeStandard(e.target.value)}
                className="glass-input w-full rounded-xl px-3.5 py-2.5 font-mono text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">{t.exitStd}</label>
              <input
                type="time"
                required
                value={heureSortieStandard}
                onChange={(e) => setHeureSortieStandard(e.target.value)}
                className="glass-input w-full rounded-xl px-3.5 py-2.5 font-mono text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">{t.toleranceMin}</label>
              <input
                type="number"
                min={0}
                max={180}
                value={margeToleranceMinutes}
                onChange={(e) => setMargeToleranceMinutes(Number(e.target.value))}
                className="glass-input w-full rounded-xl px-3.5 py-2.5 font-mono text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-105 disabled:opacity-60 sm:text-sm"
            >
              {savingSettings ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{savingSettings ? t.saving : t.saveSettings}</span>
            </button>
          </form>
        </section>

        {/* Period Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {(['week', 'month', 'year', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                period === p
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                  : 'glass-card text-slate-600 dark:text-slate-300'
              }`}
            >
              {t[p]}
            </button>
          ))}
        </div>

        {/* Top 5 Rewards & Top 5 Delays */}
        {loading ? (
          <div className="glass-card flex justify-center rounded-2xl py-14">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top 5 Punctual (Rewards) */}
            <div className="glass-card rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-400" />
                    <h2 className="text-base font-extrabold">{t.top5Title}</h2>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t.top5Sub}</p>
                </div>
                <Award className="h-6 w-6 text-emerald-500" />
              </div>

              {!data?.topDisciplined.length ? (
                <p className="rounded-xl bg-white/30 p-4 text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  {t.noData}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {data.topDisciplined.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3.5 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-bold">{item.nomComplet}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.departement} • {item.punctualityRate}%
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                        {item.onTimeDays} {t.onTimeDays}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top 5 Delayed */}
            <div className="glass-card rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="h-5 w-5 text-rose-500" />
                    <h2 className="text-base font-extrabold">{t.worst5Title}</h2>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {t.worst5Sub}
                  </p>
                </div>
              </div>

              {!data?.topDelayed.length ? (
                <p className="rounded-xl bg-white/30 p-4 text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  {t.noData}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {data.topDelayed.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/25 bg-rose-500/5 px-3.5 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/20 text-xs font-extrabold text-rose-600 dark:text-rose-400">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-bold">{item.nomComplet}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.departement} • {item.lateDays}x
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-extrabold text-rose-700 dark:text-rose-300">
                        {item.totalLateMinutes} {t.lateMinTotal}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/30 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around py-2">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>{t.navDashboard}</span>
          </Link>
          <Link
            href="/employees"
            className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400"
          >
            <Users className="h-4 w-4" />
            <span>{t.navEmployees}</span>
          </Link>
          <Link
            href="/pointage"
            className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400"
          >
            <ClipboardCheck className="h-4 w-4" />
            <span>{t.navPointage}</span>
          </Link>
          <Link
            href="/users"
            className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400"
          >
            <ShieldAlert className="h-4 w-4" />
            <span>{t.navUsers}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}