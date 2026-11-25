'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  ClipboardCheck,
  Clock,
  Search,
  RefreshCw,
  Save,
  Sun,
  Moon,
  Languages,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  LayoutDashboard,
  Users,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

type Lang = 'ar' | 'fr';

interface SettingsData {
  heureEntreeStandard: string;
  heureSortieStandard: string;
  margeToleranceMinutes: number;
}

interface PointageRecord {
  id: string;
  heureEntree: string | null;
  heureSortie: string | null;
  minutesRetard: number;
  estEnRetard: boolean;
  statut: 'PRESENT' | 'RETARD' | 'ABSENT' | 'CONGE';
  remarque: string | null;
  enregistrePar?: {
    id: string;
    nom: string;
    username: string;
  } | null;
}

interface PointageRow {
  employee: {
    id: string;
    matricule: string;
    nomComplet: string;
    poste: string;
    departement: string;
  };
  pointage: PointageRecord | null;
}

const dict = {
  ar: {
    title: 'تسجيل الحضور اليومي',
    subtitle: 'تسجيل الدخول والخروج مع احتساب الألوان والتأخير تلقائياً',
    searchPlaceholder: 'ابحث بالاسم، الرقم الوظيفي، أو القسم...',
    refresh: 'تحديث',
    now: 'الآن',
    save: 'حفظ',
    saving: 'حفظ...',
    entry: 'وقت الدخول',
    exit: 'وقت الخروج',
    status: 'الحالة',
    onTime: 'في الوقت (أخضر)',
    late: 'متأخر / مبكر (أحمر)',
    pending: 'لم يُسجل بعد',
    minLate: 'د تأخير',
    refEntry: 'الدخول المرجعي',
    refExit: 'الخروج المرجعي',
    tolerance: 'هامش',
    min: 'د',
    recordedBy: 'بواسطة',
    savedOk: 'تم حفظ الحضور بنجاح.',
    saveErr: 'تعذر حفظ الحضور، تحقق من صحة الوقت.',
    noRows: 'لا يوجد موظفون نشطون مطابقون.',
    totalActive: 'النشطون',
    greenCount: 'ملتزمون (أخضر)',
    redCount: 'متأخرون (أحمر)',
    logout: 'خروج',
    langSwitch: 'FR',
    navDashboard: 'الرئيسية',
    navEmployees: 'الموظفون',
    navPointage: 'الحضور',
    navUsers: 'الأمن',
  },
  fr: {
    title: 'Pointage Journalier',
    subtitle: 'Saisie entrée/sortie avec code couleur vert/rouge automatique',
    searchPlaceholder: 'Rechercher par nom, matricule ou département...',
    refresh: 'Actualiser',
    now: 'Maint.',
    save: 'Valider',
    saving: 'Envoi...',
    entry: 'Entrée',
    exit: 'Sortie',
    status: 'Statut',
    onTime: "À l'heure (Vert)",
    late: 'Retard / Avance (Rouge)',
    pending: 'Non pointé',
    minLate: 'min retard',
    refEntry: 'Entrée réf.',
    refExit: 'Sortie réf.',
    tolerance: 'Tolérance',
    min: 'min',
    recordedBy: 'Par',
    savedOk: 'Pointage enregistré avec succès.',
    saveErr: "Erreur lors de l'enregistrement, vérifiez l'heure.",
    noRows: 'Aucun employé actif trouvé.',
    totalActive: 'Actifs',
    greenCount: "À l'heure (Vert)",
    redCount: 'En retard (Rouge)',
    logout: 'Déconnexion',
    langSwitch: 'AR',
    navDashboard: 'Accueil',
    navEmployees: 'Employés',
    navPointage: 'Pointage',
    navUsers: 'Sécurité',
  },
} as const;

function getCurrentHHMM(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function PointagePage() {
  const [lang, setLang] = useState<Lang>('ar');
  const [isDark, setIsDark] = useState<boolean>(true);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [rows, setRows] = useState<PointageRow[]>([]);
  const [settings, setSettings] = useState<SettingsData>({
    heureEntreeStandard: '08:30',
    heureSortieStandard: '17:30',
    margeToleranceMinutes: 0,
  });

  const [draftEntries, setDraftEntries] = useState<Record<string, string>>({});
  const [draftExits, setDraftExits] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const notify = useCallback((type: 'ok' | 'err', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 3000);
  }, []);

  useEffect(() => {
    setSelectedDate(getTodayISO());

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

  const loadPointages = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ date: selectedDate });
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/pointage?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Load error');
      const data = await res.json();

      const loadedRows: PointageRow[] = data.rows || [];
      setRows(loadedRows);
      if (data.settings) setSettings(data.settings);

      const entriesMap: Record<string, string> = {};
      const exitsMap: Record<string, string> = {};
      for (const r of loadedRows) {
        entriesMap[r.employee.id] = r.pointage?.heureEntree ?? '';
        exitsMap[r.employee.id] = r.pointage?.heureSortie ?? '';
      }
      setDraftEntries(entriesMap);
      setDraftExits(exitsMap);
    } catch {
      notify('err', dict[lang].saveErr);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, search, lang, notify]);

  useEffect(() => {
    if (!selectedDate) return;
    const timer = setTimeout(() => {
      loadPointages();
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedDate, loadPointages]);

  const handleSaveRow = async (employeeId: string) => {
    setSavingId(employeeId);
    try {
      const heureEntree = draftEntries[employeeId] || null;
      const heureSortie = draftExits[employeeId] || null;

      const res = await fetch('/api/pointage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          date: selectedDate,
          heureEntree,
          heureSortie,
        }),
      });

      if (!res.ok) throw new Error('Save error');
      const data = await res.json();

      setRows((prev) =>
        prev.map((row) =>
          row.employee.id === employeeId ? { ...row, pointage: data.pointage } : row
        )
      );
      notify('ok', dict[lang].savedOk);
    } catch {
      notify('err', dict[lang].saveErr);
    } finally {
      setSavingId(null);
    }
  };

  const summary = useMemo(() => {
    let green = 0;
    let red = 0;
    for (const r of rows) {
      if (!r.pointage) continue;
      if (r.pointage.estEnRetard) red += 1;
      else green += 1;
    }
    return { total: rows.length, green, red };
  }, [rows]);

  const t = dict[lang];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-100 pb-24 text-slate-900 transition-colors duration-300 dark:bg-[#070b14] dark:text-slate-100 md:pb-10">
      {/* Ambient Liquid Glass Blobs */}
      <div className="pointer-events-none fixed -top-32 -left-24 h-96 w-96 rounded-full bg-emerald-400/25 blur-3xl dark:bg-emerald-500/15" />
      <div className="pointer-events-none fixed top-1/2 -right-24 h-96 w-96 rounded-full bg-rose-400/20 blur-3xl dark:bg-rose-500/15" />

      {/* Top Glass Header */}
      <header className="sticky top-0 z-30 border-b border-white/30 bg-white/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-emerald-400/40">
              <ClipboardCheck className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
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
              className="glass-card rounded-xl px-3.5 py-2 text-xs font-semibold transition hover:bg-white/80 dark:hover:bg-slate-800/70"
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
              className="rounded-xl bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-600 ring-1 ring-emerald-500/30 dark:text-emerald-400"
            >
              {t.navPointage}
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

      {/* Feedback Banner */}
      {feedback && (
        <div className="fixed bottom-24 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 md:bottom-6">
          <div
            className={`glass-card flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold shadow-2xl sm:text-sm ${
              feedback.type === 'ok'
                ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                : 'border-rose-500/40 text-rose-700 dark:text-rose-300'
            }`}
          >
            {feedback.type === 'ok' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            )}
            <span>{feedback.text}</span>
          </div>
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-7xl space-y-5 px-4 pt-5 sm:px-6">
        {/* Reference Time Bar + Summary */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="glass-card flex flex-wrap items-center justify-between gap-2 rounded-2xl p-4 lg:col-span-2">
            <div className="flex items-center gap-2 text-xs font-bold sm:text-sm">
              <Clock className="h-4 w-4 text-emerald-500" />
              <span>
                {t.refEntry}:{' '}
                <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 font-mono text-emerald-600 dark:text-emerald-400">
                  {settings.heureEntreeStandard}
                </span>
              </span>
              <span>•</span>
              <span>
                {t.refExit}:{' '}
                <span className="rounded-lg bg-cyan-500/15 px-2 py-0.5 font-mono text-cyan-600 dark:text-cyan-400">
                  {settings.heureSortieStandard}
                </span>
              </span>
            </div>

            <span className="rounded-full bg-slate-200/70 px-2.5 py-0.5 text-[11px] font-semibold dark:bg-white/10">
              {t.tolerance}: {settings.margeToleranceMinutes} {t.min}
            </span>
          </div>

          <div className="glass-card flex items-center justify-between rounded-2xl p-4">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {t.greenCount}
            </span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {summary.green}
            </span>
          </div>

          <div className="glass-card flex items-center justify-between rounded-2xl p-4">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {t.redCount}
            </span>
            <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
              {summary.red}
            </span>
          </div>
        </section>

        {/* Date, Search & Live Refresh */}
        <section className="glass-card rounded-2xl p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="glass-input rounded-xl px-3.5 py-2 text-xs font-semibold sm:text-sm"
              />

              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ltr:left-3 rtl:right-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="glass-input w-full rounded-xl py-2 text-xs sm:text-sm ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={loadPointages}
              className="glass-card inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition hover:scale-[1.01] sm:text-sm"
            >
              <RefreshCw className={`h-4 w-4 text-emerald-500 ${loading ? 'animate-spin' : ''}`} />
              <span>{t.refresh}</span>
            </button>
          </div>
        </section>

        {/* Rows List */}
        {loading ? (
          <div className="glass-card flex justify-center rounded-2xl py-16">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
          </div>
        ) : rows.length === 0 ? (
          <div className="glass-card rounded-2xl py-14 text-center text-sm text-slate-500 dark:text-slate-400">
            {t.noRows}
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map(({ employee, pointage }) => {
              const isSaved = Boolean(pointage);
              const isRed = Boolean(pointage?.estEnRetard);

              return (
                <div
                  key={employee.id}
                  className={`glass-card flex flex-col justify-between gap-4 rounded-2xl p-4 transition lg:flex-row lg:items-center ${
                    isSaved
                      ? isRed
                        ? 'border-rose-500/40 ring-1 ring-rose-500/20'
                        : 'border-emerald-500/40 ring-1 ring-emerald-500/20'
                      : ''
                  }`}
                >
                  {/* Employee Info & Color Status */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                        #{employee.matricule}
                      </span>
                      <h3 className="truncate text-sm font-extrabold sm:text-base">
                        {employee.nomComplet}
                      </h3>

                      {!isSaved ? (
                        <span className="rounded-full bg-slate-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          {t.pending}
                        </span>
                      ) : isRed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 ring-1 ring-rose-500/40 dark:text-rose-300">
                          <span className="h-2 w-2 rounded-full bg-rose-500" />
                          {t.late}
                          {pointage?.minutesRetard ? ` (${pointage.minutesRetard} ${t.minLate})` : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-500/40 dark:text-emerald-300">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {t.onTime}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        {employee.poste} • {employee.departement}
                      </span>
                      {pointage?.enregistrePar && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-white/40 px-2 py-0.5 text-[11px] font-medium dark:bg-white/5">
                          <UserCheck className="h-3 w-3 text-emerald-500" />
                          {t.recordedBy}: {pointage.enregistrePar.nom}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Manual Entry / Exit Inputs + Save */}
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {t.entry}:
                      </label>
                      <input
                        type="time"
                        value={draftEntries[employee.id] ?? ''}
                        onChange={(e) =>
                          setDraftEntries((prev) => ({
                            ...prev,
                            [employee.id]: e.target.value,
                          }))
                        }
                        className="glass-input rounded-xl px-2.5 py-1.5 font-mono text-xs sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setDraftEntries((prev) => ({
                            ...prev,
                            [employee.id]: getCurrentHHMM(),
                          }))
                        }
                        className="rounded-xl bg-cyan-500/15 px-2.5 py-1.5 text-[11px] font-bold text-cyan-700 transition hover:bg-cyan-500/25 dark:text-cyan-300"
                      >
                        {t.now}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {t.exit}:
                      </label>
                      <input
                        type="time"
                        value={draftExits[employee.id] ?? ''}
                        onChange={(e) =>
                          setDraftExits((prev) => ({
                            ...prev,
                            [employee.id]: e.target.value,
                          }))
                        }
                        className="glass-input rounded-xl px-2.5 py-1.5 font-mono text-xs sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setDraftExits((prev) => ({
                            ...prev,
                            [employee.id]: getCurrentHHMM(),
                          }))
                        }
                        className="rounded-xl bg-cyan-500/15 px-2.5 py-1.5 text-[11px] font-bold text-cyan-700 transition hover:bg-cyan-500/25 dark:text-cyan-300"
                      >
                        {t.now}
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={savingId === employee.id}
                      onClick={() => handleSaveRow(employee.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition hover:brightness-105 disabled:opacity-60 sm:text-sm"
                    >
                      {savingId === employee.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>{savingId === employee.id ? t.saving : t.save}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/30 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around py-2">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400"
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
            className="flex flex-col items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400"
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