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
  LogOut,
} from 'lucide-react';
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

export const AccountButton: React.FC<{ onClick: () => void; className?: string; alwaysShowLabel?: boolean; primary?: boolean }> = ({
  onClick,
  className = 'px-3 py-2',
  alwaysShowLabel = false,
  primary = false,
}) => {
  const { isId } = useLanguage();
  const { dbUser } = useAuth();
  const signedIn = Boolean(dbUser);
  const label = signedIn ? (isId ? 'Akun' : 'Account') : (isId ? 'Masuk' : 'Sign in');
  const tone = signedIn
    ? 'text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
    : primary
      ? 'text-white bg-[#0f5238] border-[#0f5238] hover:bg-[#0c4230]'
      : 'text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer min-h-10 ${className} ${tone}`}
      title={label}
    >
      <User className={`w-3.5 h-3.5 ${signedIn ? 'text-emerald-600' : primary ? 'text-white' : 'text-slate-400'}`} />
      <span className={alwaysShowLabel ? 'inline' : 'hidden sm:inline'}>{label}</span>
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
  // ponytail: 5 primary tabs for thumb UX; CoC + Impact reachable from Home journey path.
  return [
    { id: 'home', label: isId ? 'Beranda' : 'Home', short: isId ? 'Beranda' : 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'assessment', label: isId ? 'Asesmen' : 'Assessment', short: isId ? 'Asesmen' : 'Assess', icon: <ClipboardCheck className="w-5 h-5" /> },
    { id: 'learn', label: isId ? 'Belajar' : 'Learn', short: isId ? 'Belajar' : 'Learn', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'actions', label: isId ? 'Aksi' : 'Actions', short: isId ? 'Aksi' : 'Actions', icon: <Compass className="w-5 h-5" /> },
    { id: 'profile', label: isId ? 'Profil' : 'Profile', short: isId ? 'Profil' : 'Profile', icon: <User className="w-5 h-5" /> },
  ];
}

function desktopNavItems(isId: boolean): { id: PrimaryTab; label: string; icon: React.ReactNode }[] {
  return [
    { id: 'home', label: isId ? 'Beranda' : 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'declaration', label: isId ? 'Kode Etik' : 'Code of Conduct', icon: <FileText className="w-4 h-4" /> },
    { id: 'assessment', label: isId ? 'Penilaian ESG' : 'Assessment', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'learn', label: isId ? 'Pembelajaran' : 'Learn', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'actions', label: isId ? 'Katalog Aksi' : 'Actions', icon: <Compass className="w-4 h-4" /> },
    { id: 'impact', label: isId ? 'Dompet Dampak' : 'My Impact', icon: <Award className="w-4 h-4" /> },
    { id: 'profile', label: isId ? 'Profil Vendor' : 'Profile', icon: <User className="w-4 h-4" /> },
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
  const highlight =
    activeTab === 'declaration' || activeTab === 'impact' ? 'home' : activeTab;

  return (
    <nav className="no-print fixed bottom-0 left-0 right-0 z-40 bg-slate-200/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-300 dark:border-slate-800 md:hidden shadow-lg pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around px-1 py-1 max-w-lg mx-auto">
        {navItems.map(item => {
          const isActive = highlight === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 min-h-14 py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}
            >
              <div className={isActive ? 'p-1.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg' : 'p-1.5'}>
                {item.icon}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 leading-none">{item.short}</span>
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
  const { dbUser, signOut } = useAuth();
  // ponytail: mobile drawer only; desktop chrome unchanged. Split MobileAppBar if admin needs own shell.
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

  const primary = [
    { id: 'home' as PrimaryTab, label: isId ? 'Beranda' : 'Home' },
    { id: 'assessment' as PrimaryTab, label: isId ? 'Asesmen' : 'Assessment' },
    { id: 'actions' as PrimaryTab, label: isId ? 'Aksi' : 'Actions' },
    { id: 'learn' as PrimaryTab, label: isId ? 'Belajar' : 'Learn' },
  ];
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="no-print sticky top-0 z-40 w-full bg-slate-200/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-300 dark:border-slate-800 shadow-xs">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => onTabChange('home')}>
          <img
            src={BRAND_LOGO}
            alt="Siloam Hospitals"
            className="h-8 w-32 rounded-md object-cover object-center shrink-0"
          />
          <span className="font-semibold text-base tracking-tight text-slate-900 dark:text-slate-50 truncate">
            ESG Together
          </span>
          <span className="hidden sm:inline text-xs font-semibold tracking-wide" style={{ color: vendorLevel === 'Bronze' ? '#C9844A' : vendorLevel === 'Silver' ? '#A3ADB8' : vendorLevel === 'Gold' ? '#C9A84C' : '#34D399' }}>
            {vendorLevel}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {!isAdminMode && primary.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`px-3 py-2 rounded-full text-sm font-semibold cursor-pointer ${
                activeTab === item.id ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
          {dbUser && (
            <button
              type="button"
              onClick={() => void signOut()}
              className="ml-1 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              {isId ? 'Keluar' : 'Sign out'}
            </button>
          )}
          <button
            type="button"
            className="ml-1 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label={isId ? 'Menu lain' : 'More'}
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen(o => !o)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile: primary Masuk + menu */}
        <div className="md:hidden flex items-center gap-1.5 shrink-0">
          {onOpenAuth && (
            <AccountButton
              onClick={onOpenAuth}
              alwaysShowLabel
              primary
              className="px-3 py-2"
            />
          )}
          <button
            type="button"
            className="p-2.5 min-h-11 min-w-11 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={mobileMenuOpen ? (isId ? 'Tutup menu' : 'Close menu') : (isId ? 'Buka menu' : 'Open menu')}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(o => !o)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div className={`nav-drop hidden md:grid ${moreOpen ? 'open' : ''}`}>
        <div className="nav-drop-inner border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center gap-2">
            {!isAdminMode && (
              <>
                <button type="button" onClick={() => { setMoreOpen(false); onTabChange('declaration'); }} className="px-3 py-2 rounded-full text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">{isId ? 'Kode etik' : 'Code of conduct'}</button>
                <button type="button" onClick={() => { setMoreOpen(false); onTabChange('impact'); }} className="px-3 py-2 rounded-full text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">{isId ? 'Dampak' : 'Impact'}</button>
                <button type="button" onClick={() => { setMoreOpen(false); onTabChange('profile'); }} className="px-3 py-2 rounded-full text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">{isId ? 'Profil' : 'Profile'}</button>
              </>
            )}
            <LanguageToggle />
            <button type="button" onClick={onToggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" title={isId ? 'Ganti tema' : 'Toggle theme'}>
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            {onNavigateToPublic && (
              <button type="button" onClick={() => { setMoreOpen(false); onNavigateToPublic(); }} className="px-3 py-2 rounded-full text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                {isId ? 'Buletin' : 'Bulletin'}
              </button>
            )}
            {onOpenAuth && <AccountButton onClick={() => { setMoreOpen(false); onOpenAuth(); }} className="px-3 py-1.5" />}
            {canAccessAdmin && (
              <button type="button" onClick={() => { setMoreOpen(false); onToggleAdminMode(); }} className="px-3 py-2 rounded-full text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 cursor-pointer">
                {isAdminMode ? (isId ? 'Keluar admin' : 'Exit admin') : 'Admin'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3 shadow-lg">
          {!isAdminMode && (
            <nav className="flex flex-col gap-1">
              <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isId ? 'Menu lain' : 'More'}
              </p>
              {[
                { id: 'declaration' as PrimaryTab, label: isId ? 'Kode Etik Pemasok' : 'Code of Conduct', icon: <FileText className="w-4 h-4" /> },
                { id: 'impact' as PrimaryTab, label: isId ? 'Dompet Dampak' : 'My Impact', icon: <Award className="w-4 h-4" /> },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    closeMenu();
                    onTabChange(item.id);
                  }}
                  className="w-full min-h-12 px-3 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 cursor-pointer text-left"
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <LanguageToggle />
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2.5 min-h-11 min-w-11 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isId ? 'Ganti tema' : 'Toggle theme'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {onNavigateToPublic && (
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  onNavigateToPublic();
                }}
                className="w-full min-h-12 px-4 py-3 rounded-xl text-sm font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4 text-emerald-600" />
                {isId ? 'Buletin Publik' : 'Public Newsletter'}
              </button>
            )}
            {dbUser && (
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  void signOut();
                }}
                className="w-full min-h-12 px-4 py-3 rounded-xl text-sm font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                {isId ? 'Keluar' : 'Sign out'}
              </button>
            )}
            {canAccessAdmin && (
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  onToggleAdminMode();
                }}
                className={`w-full min-h-12 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer border ${
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
