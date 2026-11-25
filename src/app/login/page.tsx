'use client';

import React, { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  User,
  Sun,
  Moon,
  Languages,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
} from 'lucide-react';

type Lang = 'ar' | 'fr';

const copy = {
  ar: {
    badge: 'نظام تدبير الحضور الآمن',
    title: 'تسجيل الدخول',
    subtitle: 'أدخل اسم المستخدم وكلمة المرور للوصول إلى حسابك (مدير أو أمن)',
    usernameLabel: 'اسم المستخدم',
    usernamePlaceholder: 'مثال: admin أو agent1',
    passwordLabel: 'كلمة المرور',
    passwordPlaceholder: '••••••••',
    submit: 'دخول إلى النظام',
    submitting: 'جاري التحقق...',
    errorInvalid: 'اسم المستخدم أو كلمة المرور غير صحيحة، أو الحساب موقوف.',
    errorGeneric: 'حدث خطأ غير متوقع، حاول مرة أخرى.',
    firstTimeHint: 'أول دخول: admin / Admin@1234',
    langSwitch: 'FR',
    dark: 'ليلي',
    light: 'نهاري',
  },
  fr: {
    badge: 'Système de Pointage Sécurisé',
    title: 'Connexion',
    subtitle: 'Saisissez vos identifiants pour accéder à votre espace (Admin ou Sécurité)',
    usernameLabel: "Nom d'utilisateur",
    usernamePlaceholder: 'ex: admin ou agent1',
    passwordLabel: 'Mot de passe',
    passwordPlaceholder: '••••••••',
    submit: 'Se connecter',
    submitting: 'Connexion en cours...',
    errorInvalid: 'Identifiants invalides ou compte désactivé.',
    errorGeneric: 'Une erreur est survenue, veuillez réessayer.',
    firstTimeHint: 'Premier accès : admin / Admin@1234',
    langSwitch: 'AR',
    dark: 'Sombre',
    light: 'Clair',
  },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('ar');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (!res || res.error) {
        setErrorMsg(copy[lang].errorInvalid);
        setLoading(false);
        return;
      }

      router.refresh();
      router.push('/dashboard');
    } catch {
      setErrorMsg(copy[lang].errorGeneric);
      setLoading(false);
    }
  };

  const t = copy[lang];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-[#070b14] dark:text-slate-100">
      {/* Liquid Glass Mesh Background Blobs */}
      <div className="pointer-events-none absolute -top-28 -left-24 h-80 w-80 rounded-full bg-emerald-400/30 blur-3xl dark:bg-emerald-500/20" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-cyan-400/25 blur-3xl dark:bg-indigo-500/20" />
      <div className="pointer-events-none absolute -bottom-28 left-1/3 h-80 w-80 rounded-full bg-rose-400/20 blur-3xl dark:bg-rose-500/15" />

      {/* Top Controls (Language & Theme) */}
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="glass-card inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
          <span>{t.badge}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLang}
            className="glass-card inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition hover:scale-[1.02] active:scale-[0.98]"
            aria-label="Switch Language"
          >
            <Languages className="h-4 w-4 text-emerald-500" />
            <span>{t.langSwitch}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="glass-card inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition hover:scale-[1.02] active:scale-[0.98]"
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <>
                <Sun className="h-4 w-4 text-amber-400" />
                <span className="hidden sm:inline">{t.light}</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-slate-700" />
                <span className="hidden sm:inline">{t.dark}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Center Glass Card */}
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-md items-center justify-center px-4 py-8">
        <div className="glass-card w-full rounded-3xl p-6 sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 ring-1 ring-emerald-400/40">
              <ShieldCheck className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400 sm:text-sm">
              {t.subtitle}
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="mb-5 rounded-2xl border border-rose-500/40 bg-rose-500/15 px-4 py-3 text-xs font-medium text-rose-700 dark:text-rose-300 sm:text-sm"
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300 sm:text-sm">
                {t.usernameLabel}
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ltr:left-3.5 rtl:right-3.5" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.usernamePlaceholder}
                  className="glass-input w-full rounded-2xl py-3 text-sm ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300 sm:text-sm">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ltr:left-3.5 rtl:right-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="glass-input w-full rounded-2xl py-3 text-sm ltr:pl-10 ltr:pr-11 rtl:pr-10 rtl:pl-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ltr:right-3.5 rtl:left-3.5"
                  aria-label="Toggle Password Visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loading ? t.submitting : t.submit}</span>
            </button>
          </form>

          <div className="mt-6 border-t border-slate-300/40 pt-4 text-center text-[11px] text-slate-500 dark:border-white/10 dark:text-slate-400">
            {t.firstTimeHint}
          </div>
        </div>
      </main>
    </div>
  );
}