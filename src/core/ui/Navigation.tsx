import React from 'react';
import { PrimaryTab } from '../types';
import { Home, ClipboardCheck, BookOpen, Compass, Award, User, ShieldCheck, Moon, Sun, Sparkles, Newspaper, Globe, Languages, FileText } from 'lucide-react';
import { LevelBadge } from './Badges';
import { BRAND_LOGO } from './assets';
import { useLanguage } from '../context/LanguageContext';

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

export const MobileBottomNav: React.FC<NavProps> = ({
  activeTab,
  onTabChange,
  isAdminMode,
  onNavigateToPublic
}) => {
  const { lang, isId } = useLanguage();
  if (isAdminMode) return null; // Admin mode uses custom header

  const navItems: { id: PrimaryTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: isId ? 'Beranda' : 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'declaration', label: isId ? 'Kode Etik' : 'Code of Conduct', icon: <FileText className="w-5 h-5" /> },
    { id: 'assessment', label: isId ? 'Asesmen' : 'Assessment', icon: <ClipboardCheck className="w-5 h-5" /> },
    { id: 'learn', label: isId ? 'Belajar' : 'Learn', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'actions', label: isId ? 'Aksi' : 'Actions', icon: <Compass className="w-5 h-5" /> },
    { id: 'impact', label: isId ? 'Dampak' : 'Impact', icon: <Award className="w-5 h-5" /> },
    { id: 'profile', label: isId ? 'Profil' : 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 md:hidden px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className={isActive ? 'p-1 bg-emerald-50 dark:bg-emerald-950/60 rounded-md' : ''}>
                {item.icon}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
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
  const { lang, setLang, toggleLang, isId } = useLanguage();

  const navItems: { id: PrimaryTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: isId ? 'Beranda' : 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'declaration', label: isId ? 'Kode Etik' : 'Code of Conduct', icon: <FileText className="w-4 h-4" /> },
    { id: 'assessment', label: isId ? 'Penilaian ESG' : 'Assessment', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'learn', label: isId ? 'Pembelajaran' : 'Learn', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'actions', label: isId ? 'Katalog Aksi' : 'Actions', icon: <Compass className="w-4 h-4" /> },
    { id: 'impact', label: isId ? 'Dompet Dampak' : 'My Impact', icon: <Award className="w-4 h-4" /> },
    { id: 'profile', label: isId ? 'Profil Vendor' : 'Profile', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => onTabChange('home')}>
          <img
            src={BRAND_LOGO}
            alt="Siloam Hospitals"
            className="h-10 w-auto bg-white p-1 rounded-xl shadow-xs object-contain"
          />
          <div className="text-left flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-slate-50">
                  ESG Together
                </span>
                <LevelBadge level={vendorLevel} size="sm" />
              </div>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase hidden sm:block">
                Siloam Supply Chain Sustainability
              </p>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Master Global Language Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 shadow-xs">
            <button
              onClick={() => setLang('ID')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                lang === 'ID'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Bahasa Indonesia (Aktif ke semua tab)"
            >
              <span>🇮🇩</span>
              <span>ID</span>
            </button>
            <button
              onClick={() => setLang('EN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                lang === 'EN'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="English (Active across all tabs)"
            >
              <span>🇬🇧</span>
              <span>EN</span>
            </button>
          </div>

          {/* Public Newsletter Portal Link */}
          {onNavigateToPublic && (
            <button
              onClick={onNavigateToPublic}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
              title={isId ? "Lihat Buletin & Landing Page Publik" : "View Public Newsletter & Portal"}
            >
              <Globe className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">{isId ? "Buletin Publik" : "Public Newsletter"}</span>
            </button>
          )}

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Toggle Light / Dark Mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Auth Account Button */}
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Cloud Account & Authorization"
            >
              <User className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Account</span>
            </button>
          )}

          {/* Orchestrator / Company Admin Mode Switcher - ONLY if authorized */}
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
      </div>

      {/* Secondary Navigation Bar (Tabs underneath for 100% breathing room and zero crowding) */}
      {!isAdminMode && (
        <div className="bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200/60 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-center sm:justify-start gap-1 overflow-x-auto">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
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
    </header>
  );
};

