'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  ShieldAlert,
  UserPlus,
  Edit3,
  Trash2,
  Sun,
  Moon,
  Languages,
  LogOut,
  CheckCircle2,
  XCircle,
  X,
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Loader2,
  KeyRound,
} from 'lucide-react';

type Lang = 'ar' | 'fr';

interface SystemUser {
  id: string;
  nom: string;
  username: string;
  role: 'ADMIN' | 'SECURITY';
  actif: boolean;
  createdAt: string;
  _count?: {
    pointagesEnregistres: number;
  };
}

const dict = {
  ar: {
    title: 'إدارة المستخدمين والأمن',
    subtitle: 'إضافة، تفعيل، تعطيل، أو حذف حسابات رجال الأمن والمديرين',
    addAgent: 'إضافة حساب جديد',
    fullName: 'الاسم الكامل',
    username: 'اسم الدخول',
    password: 'كلمة المرور',
    newPasswordHint: 'اتركها فارغة إذا لم ترد تغيير كلمة المرور',
    role: 'الصلاحية / الدور',
    roleSecurity: 'أمن / حارس (SECURITY)',
    roleAdmin: 'مدير (ADMIN)',
    active: 'نشط',
    inactive: 'موقوف',
    actions: 'الإجراءات',
    recordedCount: 'تسجيلات الحضور',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ الحساب',
    saving: 'جاري الحفظ...',
    cancel: 'إلغاء',
    addModalTitle: 'إضافة مستخدم / رجل أمن',
    editModalTitle: 'تعديل بيانات المستخدم',
    deleteTitle: 'تأكيد حذف الحساب',
    deleteDesc: 'هل أنت متأكد من حذف هذا الحساب نهائياً؟',
    confirmDelete: 'نعم، احذف',
    deleting: 'جاري الحذف...',
    usernameExists: 'اسم الدخول هذا مستعمل مسبقاً.',
    cannotDeleteSelf: 'لا يمكنك حذف حسابك الحالي أثناء تسجيل الدخول.',
    savedOk: 'تم حفظ بيانات الحساب بنجاح.',
    deletedOk: 'تم حذف الحساب بنجاح.',
    errMsg: 'حدث خطأ أثناء تنفيذ العملية.',
    logout: 'خروج',
    langSwitch: 'FR',
    navDashboard: 'الرئيسية',
    navEmployees: 'الموظفون',
    navPointage: 'الحضور',
    navUsers: 'الأمن',
  },
  fr: {
    title: 'Gestion des Utilisateurs & Sécurité',
    subtitle: 'Ajouter, activer, désactiver ou supprimer les comptes agents et admins',
    addAgent: 'Ajouter un compte',
    fullName: 'Nom complet',
    username: "Nom d'utilisateur",
    password: 'Mot de passe',
    newPasswordHint: 'Laisser vide pour conserver le mot de passe actuel',
    role: 'Rôle',
    roleSecurity: 'Agent Sécurité (SECURITY)',
    roleAdmin: 'Administrateur (ADMIN)',
    active: 'Actif',
    inactive: 'Désactivé',
    actions: 'Actions',
    recordedCount: 'Pointages saisis',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    saving: 'Envoi...',
    cancel: 'Annuler',
    addModalTitle: 'Ajouter un utilisateur / agent',
    editModalTitle: "Modifier l'utilisateur",
    deleteTitle: 'Confirmer la suppression',
    deleteDesc: 'Voulez-vous vraiment supprimer ce compte ?',
    confirmDelete: 'Oui, supprimer',
    deleting: 'Suppression...',
    usernameExists: "Ce nom d'utilisateur existe déjà.",
    cannotDeleteSelf: 'Impossible de supprimer votre propre compte actif.',
    savedOk: 'Compte enregistré avec succès.',
    deletedOk: 'Compte supprimé avec succès.',
    errMsg: "Une erreur s'est produite.",
    logout: 'Déconnexion',
    langSwitch: 'AR',
    navDashboard: 'Accueil',
    navEmployees: 'Employés',
    navPointage: 'Pointage',
    navUsers: 'Sécurité',
  },
} as const;

export default function UsersPage() {
  const [lang, setLang] = useState<Lang>('ar');
  const [isDark, setIsDark] = useState<boolean>(true);

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Modal Create/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [nom, setNom] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'SECURITY'>('SECURITY');
  const [actif, setActif] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Delete Modal
  const [deletingUser, setDeletingUser] = useState<SystemUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const notify = useCallback((type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast((prev) => (prev?.text === text ? null : prev)), 3200);
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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      if (!res.ok) throw new Error('Load users error');
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      notify('err', dict[lang].errMsg);
    } finally {
      setLoading(false);
    }
  }, [lang, notify]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setNom('');
    setUsername('');
    setPassword('');
    setRole('SECURITY');
    setActif(true);
    setModalOpen(true);
  };

  const openEdit = (u: SystemUser) => {
    setEditingUser(u);
    setNom(u.nom);
    setUsername(u.username);
    setPassword('');
    setRole(u.role);
    setActif(u.actif);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PATCH' : 'POST';

      const payload: Record<string, unknown> = {
        nom: nom.trim(),
        username: username.trim().toLowerCase(),
        role,
        actif,
      };
      if (!editingUser) {
        payload.password = password;
      } else if (password.trim().length >= 4) {
        payload.password = password.trim();
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data?.error === 'USERNAME_EXISTS') {
          notify('err', dict[lang].usernameExists);
        } else {
          notify('err', dict[lang].errMsg);
        }
        setSubmitting(false);
        return;
      }

      setModalOpen(false);
      notify('ok', dict[lang].savedOk);
      await fetchUsers();
    } catch {
      notify('err', dict[lang].errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        if (data?.error === 'CANNOT_DELETE_SELF') {
          notify('err', dict[lang].cannotDeleteSelf);
        } else {
          notify('err', dict[lang].errMsg);
        }
        setDeleting(false);
        return;
      }

      setDeletingUser(null);
      notify('ok', dict[lang].deletedOk);
      await fetchUsers();
    } catch {
      notify('err', dict[lang].errMsg);
    } finally {
      setDeleting(false);
    }
  };

  const t = dict[lang];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-100 pb-24 text-slate-900 transition-colors duration-300 dark:bg-[#070b14] dark:text-slate-100 md:pb-10">
      {/* Ambient Liquid Glass Blobs */}
      <div className="pointer-events-none fixed -top-32 -left-24 h-96 w-96 rounded-full bg-cyan-400/25 blur-3xl dark:bg-cyan-500/15" />
      <div className="pointer-events-none fixed top-1/2 -right-24 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/15" />

      {/* Top Glass Header */}
      <header className="sticky top-0 z-30 border-b border-white/30 bg-white/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 ring-1 ring-cyan-400/40">
              <ShieldAlert className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
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
              className="glass-card rounded-xl px-3.5 py-2 text-xs font-semibold transition hover:bg-white/80 dark:hover:bg-slate-800/70"
            >
              {t.navPointage}
            </Link>
            <Link
              href="/users"
              className="rounded-xl bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-600 ring-1 ring-emerald-500/30 dark:text-emerald-400"
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
          <div
            className={`glass-card flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold shadow-2xl sm:text-sm ${
              toast.type === 'ok'
                ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                : 'border-rose-500/40 text-rose-700 dark:text-rose-300'
            }`}
          >
            {toast.type === 'ok' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-500" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {users.length}
          </span>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-105 sm:text-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span>{t.addAgent}</span>
          </button>
        </div>

        {loading ? (
          <div className="glass-card flex justify-center rounded-2xl py-16">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map((u) => (
              <div key={u.id} className="glass-card flex flex-col justify-between gap-4 rounded-2xl p-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-cyan-500/15 px-2.5 py-1 font-mono text-xs font-bold text-cyan-700 dark:text-cyan-300">
                      @{u.username}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        u.actif
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {u.actif ? t.active : t.inactive}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold">{u.nom}</h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {u.role === 'ADMIN' ? t.roleAdmin : t.roleSecurity}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.recordedCount}:{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {u._count?.pointagesEnregistres ?? 0}
                    </strong>
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-200/50 pt-3 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => openEdit(u)}
                    className="inline-flex items-center gap-1 rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>{t.edit}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingUser(u)}
                    className="inline-flex items-center gap-1 rounded-xl bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{t.delete}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create / Edit User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-3xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingUser ? t.editModalTitle : t.addModalTitle}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold">{t.fullName}</label>
                <input
                  type="text"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">{t.username}</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="agent1"
                  className="glass-input w-full rounded-xl px-3.5 py-2.5 font-mono text-sm"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
                  <KeyRound className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{t.password}</span>
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm"
                />
                {editingUser && (
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {t.newPasswordHint}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">{t.role}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'ADMIN' | 'SECURITY')}
                  className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm"
                >
                  <option value="SECURITY">{t.roleSecurity}</option>
                  <option value="ADMIN">{t.roleAdmin}</option>
                </select>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold sm:text-sm">
                <input
                  type="checkbox"
                  checked={actif}
                  onChange={(e) => setActif(e.target.checked)}
                  className="h-4 w-4 rounded accent-emerald-500"
                />
                <span>{t.active}</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-300/60 px-4 py-2 text-xs font-bold dark:border-white/15"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{submitting ? t.saving : t.save}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-3xl p-6">
            <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400">
              {t.deleteTitle}
            </h2>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
              {t.deleteDesc}
            </p>
            <p className="mt-3 rounded-xl bg-white/40 px-3.5 py-2 text-xs font-bold dark:bg-white/5">
              {deletingUser.nom} (@{deletingUser.username})
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="rounded-xl border border-slate-300/60 px-4 py-2 text-xs font-bold dark:border-white/15"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{deleting ? t.deleting : t.confirmDelete}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
            className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400"
          >
            <ClipboardCheck className="h-4 w-4" />
            <span>{t.navPointage}</span>
          </Link>
          <Link
            href="/users"
            className="flex flex-col items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400"
          >
            <ShieldAlert className="h-4 w-4" />
            <span>{t.navUsers}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}