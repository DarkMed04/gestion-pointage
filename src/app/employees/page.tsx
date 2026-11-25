'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  Users,
  UserPlus,
  Search,
  Edit3,
  Trash2,
  Eye,
  Sun,
  Moon,
  Languages,
  LogOut,
  X,
  CheckCircle2,
  XCircle,
  Building2,
  Briefcase,
  Calendar,
  Hash,
  LayoutDashboard,
  ClipboardCheck,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

type Lang = 'ar' | 'fr';

interface PointageItem {
  id: string;
  datePointage: string;
  heureEntree: string | null;
  heureSortie: string | null;
  minutesRetard: number;
  estEnRetard: boolean;
  statut: string;
}

interface Employee {
  id: string;
  matricule: string;
  nomComplet: string;
  poste: string;
  departement: string;
  actif: boolean;
  dateEmbauche: string;
  pointages?: PointageItem[];
  _count?: {
    pointages: number;
  };
}

const dict = {
  ar: {
    pageTitle: 'إدارة الموظفين',
    pageSubtitle: 'إضافة، تعديل، حذف، وعرض تفاصيل الموظفين',
    addBtn: 'إضافة موظف',
    searchPlaceholder: 'ابحث بالاسم، الرقم الوظيفي، أو المنصب...',
    allDepartments: 'كل الأقسام',
    allStatus: 'كل الحالات',
    active: 'نشط',
    inactive: 'غير نشط',
    totalEmployees: 'إجمالي الموظفين',
    activeEmployees: 'الموظفون النشطون',
    inactiveEmployees: 'غير النشطين',
    matricule: 'الرقم الوظيفي',
    fullName: 'الاسم الكامل',
    position: 'المنصب',
    department: 'القسم',
    status: 'الحالة',
    hireDate: 'تاريخ الالتحاق',
    actions: 'الإجراءات',
    details: 'التفاصيل',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ البيانات',
    saving: 'جاري الحفظ...',
    cancel: 'إلغاء',
    addModalTitle: 'إضافة موظف جديد',
    editModalTitle: 'تعديل بيانات الموظف',
    detailsModalTitle: 'ملف وتفاصيل الموظف',
    deleteModalTitle: 'تأكيد حذف الموظف',
    deleteWarning: 'هل أنت متأكد من حذف هذا الموظف نهائياً؟ سيتم حذف سجل حضوره المرتبط أيضاً.',
    confirmDelete: 'نعم، احذف',
    deleting: 'جاري الحذف...',
    noEmployees: 'لا توجد نتائج مطابقة للبحث الحالي.',
    matriculeExists: 'هذا الرقم الوظيفي مسجل مسبقاً لموظف آخر.',
    saveSuccess: 'تم حفظ بيانات الموظف بنجاح.',
    deleteSuccess: 'تم حذف الموظف بنجاح.',
    errorMsg: 'حدث خطأ أثناء تنفيذ العملية، تأكد من صحة الحقول.',
    recentPointages: 'آخر سجلات الحضور',
    totalPointagesCount: 'إجمالي أيام التسجيل',
    noPointages: 'لا توجد سجلات حضور لهذا الموظف بعد.',
    entry: 'دخول',
    exit: 'خروج',
    lateMin: 'د تأخير',
    onTime: 'في الوقت',
    logout: 'خروج',
    langSwitch: 'FR',
    dark: 'ليلي',
    light: 'نهاري',
    navDashboard: 'الرئيسية',
    navEmployees: 'الموظفون',
    navPointage: 'الحضور',
    navUsers: 'الأمن',
  },
  fr: {
    pageTitle: 'Gestion des Employés',
    pageSubtitle: 'Ajouter, modifier, supprimer et consulter les fiches employés',
    addBtn: 'Ajouter un employé',
    searchPlaceholder: 'Rechercher par nom, matricule ou poste...',
    allDepartments: 'Tous les départements',
    allStatus: 'Tous les statuts',
    active: 'Actif',
    inactive: 'Inactif',
    totalEmployees: 'Total Employés',
    activeEmployees: 'Employés Actifs',
    inactiveEmployees: 'Inactifs',
    matricule: 'Matricule',
    fullName: 'Nom complet',
    position: 'Poste',
    department: 'Département',
    status: 'Statut',
    hireDate: "Date d'embauche",
    actions: 'Actions',
    details: 'Détails',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    cancel: 'Annuler',
    addModalTitle: 'Ajouter un nouvel employé',
    editModalTitle: "Modifier les informations de l'employé",
    detailsModalTitle: "Détails et historique de l'employé",
    deleteModalTitle: "Confirmer la suppression",
    deleteWarning: "Voulez-vous vraiment supprimer cet employé ? Ses pointages associés seront aussi supprimés.",
    confirmDelete: 'Oui, supprimer',
    deleting: 'Suppression...',
    noEmployees: 'Aucun employé trouvé avec ces filtres.',
    matriculeExists: 'Ce matricule existe déjà pour un autre employé.',
    saveSuccess: 'Données enregistrées avec succès.',
    deleteSuccess: 'Employé supprimé avec succès.',
    errorMsg: 'Une erreur est survenue, vérifiez les champs saisis.',
    recentPointages: 'Derniers pointages',
    totalPointagesCount: 'Total jours pointés',
    noPointages: 'Aucun pointage enregistré pour cet employé.',
    entry: 'Entrée',
    exit: 'Sortie',
    lateMin: 'min retard',
    onTime: "À l'heure",
    logout: 'Déconnexion',
    langSwitch: 'AR',
    dark: 'Sombre',
    light: 'Clair',
    navDashboard: 'Accueil',
    navEmployees: 'Employés',
    navPointage: 'Pointage',
    navUsers: 'Sécurité',
  },
} as const;

export default function EmployeesPage() {
  const [lang, setLang] = useState<Lang>('ar');
  const [isDark, setIsDark] = useState<boolean>(true);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Modal (Create / Edit)
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [matricule, setMatricule] = useState('');
  const [nomComplet, setNomComplet] = useState('');
  const [poste, setPoste] = useState('');
  const [departement, setDepartement] = useState('');
  const [actif, setActif] = useState(true);
  const [dateEmbauche, setDateEmbauche] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Details Modal
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Delete Modal
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
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

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (departmentFilter !== 'ALL') params.set('department', departmentFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/employees?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch {
      showToast('error', dict[lang].errorMsg);
    } finally {
      setLoading(false);
    }
  }, [search, departmentFilter, statusFilter, lang, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees();
    }, 180);
    return () => clearTimeout(timer);
  }, [fetchEmployees]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((emp) => {
      if (emp.departement) set.add(emp.departement);
    });
    return Array.from(set).sort();
  }, [employees]);

  const stats = useMemo(() => {
    const total = employees.length;
    const activeCount = employees.filter((e) => e.actif).length;
    const inactiveCount = total - activeCount;
    return { total, activeCount, inactiveCount };
  }, [employees]);

  const openCreateModal = () => {
    setEditingEmployee(null);
    setMatricule('');
    setNomComplet('');
    setPoste('');
    setDepartement('');
    setActif(true);
    setDateEmbauche(new Date().toISOString().split('T')[0]);
    setFormOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setMatricule(emp.matricule);
    setNomComplet(emp.nomComplet);
    setPoste(emp.poste);
    setDepartement(emp.departement);
    setActif(emp.actif);
    setDateEmbauche(
      emp.dateEmbauche ? new Date(emp.dateEmbauche).toISOString().split('T')[0] : ''
    );
    setFormOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : '/api/employees';
      const method = editingEmployee ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matricule: matricule.trim(),
          nomComplet: nomComplet.trim(),
          poste: poste.trim(),
          departement: departement.trim(),
          actif,
          dateEmbauche,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data?.error === 'MATRICULE_EXISTS') {
          showToast('error', dict[lang].matriculeExists);
        } else {
          showToast('error', dict[lang].errorMsg);
        }
        setSubmitting(false);
        return;
      }

      setFormOpen(false);
      showToast('success', dict[lang].saveSuccess);
      await fetchEmployees();
    } catch {
      showToast('error', dict[lang].errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const openDetailsModal = async (emp: Employee) => {
    setSelectedEmployee(emp);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/employees/${emp.id}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.employee) setSelectedEmployee(data.employee);
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEmployee) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/employees/${deletingEmployee.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');

      setDeletingEmployee(null);
      showToast('success', dict[lang].deleteSuccess);
      await fetchEmployees();
    } catch {
      showToast('error', dict[lang].errorMsg);
    } finally {
      setDeleting(false);
    }
  };

  const t = dict[lang];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-100 pb-24 text-slate-900 transition-colors duration-300 dark:bg-[#070b14] dark:text-slate-100 md:pb-10">
      {/* Ambient Liquid Glass Blobs */}
      <div className="pointer-events-none fixed -top-32 -left-24 h-96 w-96 rounded-full bg-emerald-400/25 blur-3xl dark:bg-emerald-500/15" />
      <div className="pointer-events-none fixed top-1/2 -right-24 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl dark:bg-indigo-500/15" />

      {/* Top Glass Header */}
      <header className="sticky top-0 z-30 border-b border-white/30 bg-white/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-emerald-400/40">
              <Users className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-bold sm:text-xl">{t.pageTitle}</h1>
              <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                {t.pageSubtitle}
              </p>
            </div>
          </div>

          {/* Desktop Quick Nav */}
          <nav className="hidden items-center gap-2 md:flex">
            <Link
              href="/dashboard"
              className="glass-card rounded-xl px-3.5 py-2 text-xs font-semibold transition hover:bg-white/80 dark:hover:bg-slate-800/70"
            >
              {t.navDashboard}
            </Link>
            <Link
              href="/employees"
              className="rounded-xl bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-600 ring-1 ring-emerald-500/30 dark:text-emerald-400"
            >
              {t.navEmployees}
            </Link>
            <Link
              href="/pointage"
              className="glass-card rounded-xl px-3.5 py-2 text-xs font-semibold transition hover:bg-white/80 dark:hover:bg-slate-800/70"
            >
              {t.navPointage}
            </Link>
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLang}
              className="glass-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition hover:scale-[1.02]"
            >
              <Languages className="h-4 w-4 text-emerald-500" />
              <span>{t.langSwitch}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="glass-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition hover:scale-[1.02]"
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
              className="glass-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/10 dark:text-rose-400"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 md:bottom-6">
          <div
            className={`glass-card flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-semibold shadow-2xl sm:text-sm ${
              toast.type === 'success'
                ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                : 'border-rose-500/40 text-rose-700 dark:text-rose-300'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6">
        {/* Stats Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="glass-card rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.totalEmployees}
              </span>
              <Users className="h-5 w-5 text-cyan-500" />
            </div>
            <p className="mt-2 text-2xl font-extrabold sm:text-3xl">{stats.total}</p>
          </div>

          <div className="glass-card rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.activeEmployees}
              </span>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 sm:text-3xl">
              {stats.activeCount}
            </p>
          </div>

          <div className="glass-card rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.inactiveEmployees}
              </span>
              <XCircle className="h-5 w-5 text-rose-500" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-rose-600 dark:text-rose-400 sm:text-3xl">
              {stats.inactiveCount}
            </p>
          </div>
        </section>

        {/* Search, Filters & Add Button */}
        <section className="glass-card rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="relative sm:col-span-1">
                <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ltr:left-3.5 rtl:right-3.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="glass-input w-full rounded-xl py-2.5 text-xs sm:text-sm ltr:pl-10 ltr:pr-3.5 rtl:pr-10 rtl:pl-3.5"
                />
              </div>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="glass-input rounded-xl px-3.5 py-2.5 text-xs sm:text-sm"
              >
                <option value="ALL">{t.allDepartments}</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="glass-input rounded-xl px-3.5 py-2.5 text-xs sm:text-sm"
              >
                <option value="ALL">{t.allStatus}</option>
                <option value="ACTIVE">{t.active}</option>
                <option value="INACTIVE">{t.inactive}</option>
              </select>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-105 active:scale-[0.99] sm:text-sm"
            >
              <UserPlus className="h-4 w-4" />
              <span>{t.addBtn}</span>
            </button>
          </div>
        </section>

        {/* Employees List: Table on Desktop, Cards on Mobile */}
        {loading ? (
          <div className="glass-card flex items-center justify-center rounded-2xl py-16">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
          </div>
        ) : employees.length === 0 ? (
          <div className="glass-card rounded-2xl py-14 text-center text-sm text-slate-500 dark:text-slate-400">
            {t.noEmployees}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="glass-card hidden overflow-x-auto rounded-2xl md:block">
              <table className="w-full border-collapse text-start text-sm">
                <thead>
                  <tr className="border-b border-slate-200/60 text-xs font-bold uppercase text-slate-500 dark:border-white/10 dark:text-slate-400">
                    <th className="px-5 py-4 text-start">{t.matricule}</th>
                    <th className="px-5 py-4 text-start">{t.fullName}</th>
                    <th className="px-5 py-4 text-start">{t.position}</th>
                    <th className="px-5 py-4 text-start">{t.department}</th>
                    <th className="px-5 py-4 text-start">{t.status}</th>
                    <th className="px-5 py-4 text-end">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/40 dark:divide-white/5">
                  {employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="transition hover:bg-white/40 dark:hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {emp.matricule}
                      </td>
                      <td className="px-5 py-4 font-bold">{emp.nomComplet}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{emp.poste}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-200/70 px-2.5 py-1 text-xs font-medium dark:bg-white/10">
                          {emp.departement}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {emp.actif ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {t.active}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-500/30 dark:text-rose-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            {t.inactive}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openDetailsModal(emp)}
                            title={t.details}
                            className="rounded-xl bg-cyan-500/10 p-2 text-cyan-600 transition hover:bg-cyan-500/20 dark:text-cyan-400"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(emp)}
                            title={t.edit}
                            className="rounded-xl bg-amber-500/10 p-2 text-amber-600 transition hover:bg-amber-500/20 dark:text-amber-400"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingEmployee(emp)}
                            title={t.delete}
                            className="rounded-xl bg-rose-500/10 p-2 text-rose-600 transition hover:bg-rose-500/20 dark:text-rose-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="grid grid-cols-1 gap-3.5 md:hidden">
              {employees.map((emp) => (
                <div key={emp.id} className="glass-card space-y-3 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        #{emp.matricule}
                      </span>
                      <h3 className="text-base font-bold">{emp.nomComplet}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {emp.poste} • {emp.departement}
                      </p>
                    </div>

                    {emp.actif ? (
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                        {t.active}
                      </span>
                    ) : (
                      <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-300">
                        {t.inactive}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-slate-200/50 pt-3 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => openDetailsModal(emp)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-cyan-500/10 py-2 text-xs font-bold text-cyan-700 dark:text-cyan-300"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{t.details}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(emp)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500/10 py-2 text-xs font-bold text-amber-700 dark:text-amber-300"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>{t.edit}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingEmployee(emp)}
                      className="inline-flex items-center justify-center rounded-xl bg-rose-500/10 px-3 py-2 text-rose-600 dark:text-rose-400"
                      aria-label={t.delete}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
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
            className="flex flex-col items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400"
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

      {/* Create / Edit Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="glass-card max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingEmployee ? t.editModalTitle : t.addModalTitle}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold">{t.matricule}</label>
                  <input
                    type="text"
                    required
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    placeholder="EMP-001"
                    className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">{t.hireDate}</label>
                  <input
                    type="date"
                    value={dateEmbauche}
                    onChange={(e) => setDateEmbauche(e.target.value)}
                    className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">{t.fullName}</label>
                <input
                  type="text"
                  required
                  value={nomComplet}
                  onChange={(e) => setNomComplet(e.target.value)}
                  className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold">{t.position}</label>
                  <input
                    type="text"
                    required
                    value={poste}
                    onChange={(e) => setPoste(e.target.value)}
                    className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">{t.department}</label>
                  <input
                    type="text"
                    required
                    value={departement}
                    onChange={(e) => setDepartement(e.target.value)}
                    className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-xs font-semibold sm:text-sm">
                <input
                  type="checkbox"
                  checked={actif}
                  onChange={(e) => setActif(e.target.checked)}
                  className="h-4 w-4 rounded accent-emerald-500"
                />
                <span>{t.active}</span>
              </label>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl border border-slate-300/60 px-4 py-2.5 text-xs font-bold dark:border-white/15 sm:text-sm"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-60 sm:text-sm"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{submitting ? t.saving : t.save}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="glass-card max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t.detailsModalTitle}</h2>
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/40 p-4 dark:bg-white/5">
                <div>
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedEmployee.matricule}
                  </span>
                  <h3 className="text-xl font-extrabold">{selectedEmployee.nomComplet}</h3>
                </div>
                {selectedEmployee.actif ? (
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {t.active}
                  </span>
                ) : (
                  <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-bold text-rose-700 dark:text-rose-300">
                    {t.inactive}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 sm:text-sm">
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/50 p-3 dark:border-white/10">
                  <Briefcase className="h-4 w-4 text-emerald-500" />
                  <span>
                    <strong>{t.position}:</strong> {selectedEmployee.poste}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/50 p-3 dark:border-white/10">
                  <Building2 className="h-4 w-4 text-cyan-500" />
                  <span>
                    <strong>{t.department}:</strong> {selectedEmployee.departement}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/50 p-3 dark:border-white/10">
                  <Calendar className="h-4 w-4 text-amber-500" />
                  <span>
                    <strong>{t.hireDate}:</strong>{' '}
                    {new Date(selectedEmployee.dateEmbauche).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/50 p-3 dark:border-white/10">
                  <Hash className="h-4 w-4 text-indigo-500" />
                  <span>
                    <strong>{t.totalPointagesCount}:</strong>{' '}
                    {selectedEmployee._count?.pointages ?? selectedEmployee.pointages?.length ?? 0}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <h4 className="mb-2.5 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  {t.recentPointages}
                </h4>
                {loadingDetails ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                  </div>
                ) : !selectedEmployee.pointages || selectedEmployee.pointages.length === 0 ? (
                  <p className="rounded-xl bg-white/30 p-3 text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400">
                    {t.noPointages}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedEmployee.pointages.map((pt) => (
                      <div
                        key={pt.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/50 px-3.5 py-2.5 text-xs dark:border-white/10"
                      >
                        <span className="font-semibold">
                          {new Date(pt.datePointage).toLocaleDateString()}
                        </span>
                        <span>
                          {t.entry}: <strong>{pt.heureEntree || '--:--'}</strong> • {t.exit}:{' '}
                          <strong>{pt.heureSortie || '--:--'}</strong>
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 font-bold ${
                            pt.estEnRetard
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {pt.estEnRetard ? `${pt.minutesRetard} ${t.lateMin}` : t.onTime}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-3xl p-6">
            <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400">
              {t.deleteModalTitle}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
              {t.deleteWarning}
            </p>
            <p className="mt-3 rounded-xl bg-white/40 px-3.5 py-2 text-xs font-bold dark:bg-white/5">
              {deletingEmployee.matricule} — {deletingEmployee.nomComplet}
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingEmployee(null)}
                className="rounded-xl border border-slate-300/60 px-4 py-2 text-xs font-bold dark:border-white/15"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/25 disabled:opacity-60"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{deleting ? t.deleting : t.confirmDelete}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}