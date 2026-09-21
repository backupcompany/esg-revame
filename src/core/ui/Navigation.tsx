import React, { useEffect, useState } from 'react';
import { PrimaryTab } from '../types';
import {
  Home,
  ClipboardCheck,
  BookOpen,
  Compass,
  Award,
  User,
  ShieldCheck,
  Moon,
  Sun,
  Globe,
  FileText,
  Menu,
  X,
} from 'lucide-react';
import { LevelBadge } from './Badges';
import { BRAND_LOGO } from './assets';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const LanguageToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { lang, setLang } = useLanguage();
  return (
    <div className={`flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 shadow-xs ${className}`}>
      <button
        type="button"
        onClick={() => setLang('ID')}
        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
          lang === 'ID'
            ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        title="Bahasa Indonesia"
      >
        <span>ID</span>
      </button>
      <button
        type="button"
        onClick={() => setLang('EN')}
        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
          lang === 'EN'
            ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        title="English"
      >
        <span>EN</span>
      </button>
    </div>
  );
};

export const AccountButton: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className = 'px-3 py-2' }) => {
  const { isId } = useLanguage();
  const { dbUser } = useAuth();
  const signedIn = Boolean(dbUser);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${className} ${
        signedIn
          ? 'text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
          : 'text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
      title={signedIn ? (isId ? 'Akun' : 'Account') : (isId ? 'Masuk' : 'Sign in')}
    >
      <User className={`w-3.5 h-3.5 ${signedIn ? 'text-emerald-600' : 'text-slate-400'}`} />
      <span className="hidden sm:inline">{signedIn ? (isId ? 'Akun' : 'Account') : (isId ? 'Masuk' : 'Sign in')}</span>
    </button>
  );
};

interface NavProps {
  activeTab: PrimaryTab;
  onTabChange: (tab: PrimaryTab) => void;
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  vendorLevel?: any;
  onNavigateToPublic?: () => void;
  onOpenAuth?: () => void;
  canAccessAdmin?: boolean;
}

function vendorNavItems(isId: boolean): { id: PrimaryTab; label: string; short: string; icon: React.ReactNode }[] {
  return [
    { id: 'home', label: isId ? 'Beranda' : 'Home', short: isId ? 'Home' : 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'declaration', label: isId ? 'Kode Etik' : 'Code of Conduct', short: 'CoC', icon: <FileText className="w-5 h-5" /> },
    { id: 'assessment', label: isId ? 'Asesmen' : 'Assessment', short: isId ? 'Asesmen' : 'Assess', icon: <ClipboardCheck className="w-5 h-5" /> },
    { id: 'learn', label: isId ? 'Belajar' : 'Learn', short: isId ? 'Belajar' : 'Learn', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'actions', label: isId ? 'Aksi' : 'Actions', short: isId ? 'Aksi' : 'Actions', icon: <Compass className="w-5 h-5" /> },
    { id: 'impact', label: isId ? 'Dampak' : 'Impact', short: isId ? 'Dampak' : 'Impact', icon: <Award className="w-5 h-5" /> },
    { id: 'profile', label: isId ? 'Profil' : 'Profile', short: isId ? 'Profil' : 'Profile', icon: <User className="w-5 h-5" /> },
  ];
}

export const MobileBottomNav: React.FC<NavProps> = ({
  activeTab,
  onTabChange,
  isAdminMode,
}) => {
  const { isId } = useLanguage();
  if (isAdminMode) return null;

  const navItems = vendorNavItems(isId);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 md:hidden shadow-lg pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-between gap-0.5 px-1 py-1 overflow-x-auto scrollbar-none">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center min-w-[3.25rem] flex-1 py-1.5 px-1 rounded-lg transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}
            >
              <div className={isActive ? 'p-1 bg-emerald-50 dark:bg-emerald-950/60 rounded-md' : 'p-1'}>
                {item.icon}
              </div>
              <span className="text-[9px] tracking-tight mt-0.5 leading-none">{item.short}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export const DesktopHeader: React.FC<NavProps> = ({
  activeTab,
  onTabChange,
  isAdminMode,
  onToggleAdminMode,
  theme,
  onToggleTheme,
  vendorLevel = 'Starter',
  onNavigateToPublic,
  onOpenAuth,
  canAccessAdmin = false
}) => {
  const { isId } = useLanguage();
  // ponytail: mobile drawer only; desktop chrome unchanged. Split MobileAppBar if admin needs own shell.
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

  const navItems = vendorNavItems(isId).map(i => ({
    id: i.id,
    label: i.id === 'assessment' ? (isId ? 'Penilaian ESG' : 'Assessment')
      : i.id === 'learn' ? (isId ? 'Pembelajaran' : 'Learn')
      : i.id === 'actions' ? (isId ? 'Katalog Aksi' : 'Actions')
      : i.id === 'impact' ? (isId ? 'Dompet Dampak' : 'My Impact')
      : i.id === 'profile' ? (isId ? 'Profil Vendor' : 'Profile')
      : i.label,
    icon: React.cloneElement(i.icon as React.ReactElement<{ className?: string }>, { className: 'w-4 h-4' }),
  }));

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2.5 md:gap-3.5 min-w-0 cursor-pointer" onClick={() => onTabChange('home')}>
          <img
            src={BRAND_LOGO}
            alt="Siloam Hospitals"
            className="h-9 md:h-10 w-auto bg-white p-1 rounded-xl shadow-xs object-contain shrink-0"
          />
          <div className="text-left min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-slate-50 truncate">
                ESG Together
              </span>
              <span className="hidden sm:inline-flex">
                <LevelBadge level={vendorLevel} size="sm" />
              </span>
            </div>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase hidden md:block">
              Siloam Supply Chain Sustainability
            </p>
          </div>
        </div>

        {/* Desktop actions — unchanged */}
        <div className="hidden md:flex items-center gap-2">
          <LanguageToggle />

          {onNavigateToPublic && (
            <button
              onClick={onNavigateToPublic}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
              title={isId ? 'Lihat Buletin & Landing Page Publik' : 'View Public Newsletter & Portal'}
            >
              <Globe className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">{isId ? 'Buletin Publik' : 'Public Newsletter'}</span>
            </button>
          )}

          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isId ? 'Ganti tema terang / gelap' : 'Toggle light / dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {onOpenAuth && <AccountButton onClick={onOpenAuth} className="px-3 py-1.5" />}

          {canAccessAdmin && (
            <button
              onClick={onToggleAdminMode}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                isAdminMode
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
              }`}
              title="Switch between Vendor View and Orchestrator Admin View"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">{isAdminMode ? (isId ? 'Keluar Admin CMS' : 'Exit Admin / CMS') : (isId ? 'Admin & CMS Siloam' : 'Admin & CMS')}</span>
            </button>
          )}
        </div>

        {/* Mobile: hamburger only */}
        <button
          type="button"
          className="md:hidden p-2.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          aria-label={mobileMenuOpen ? (isId ? 'Tutup menu' : 'Close menu') : (isId ? 'Buka menu' : 'Open menu')}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(o => !o)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Desktop secondary tabs */}
      {!isAdminMode && (
        <div className="hidden md:block bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200/60 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-center sm:justify-start gap-1 overflow-x-auto">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3 shadow-lg">
          <div className="flex flex-wrap items-center gap-2">
            <LanguageToggle />
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isId ? 'Ganti tema' : 'Toggle theme'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            {onOpenAuth && (
              <AccountButton
                onClick={() => {
                  closeMenu();
                  onOpenAuth();
                }}
                className="px-3 py-1.5"
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            {onNavigateToPublic && (
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  onNavigateToPublic();
                }}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4 text-emerald-600" />
                {isId ? 'Buletin Publik' : 'Public Newsletter'}
              </button>
            )}
            {canAccessAdmin && (
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  onToggleAdminMode();
                }}
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer border ${
                  isAdminMode
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                {isAdminMode
                  ? (isId ? 'Keluar Admin CMS' : 'Exit Admin / CMS')
                  : (isId ? 'Admin & CMS Siloam' : 'Admin & CMS')}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
