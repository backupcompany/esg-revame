import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiPost } from '../services/api';

export type AppLanguage = 'ID' | 'EN';

interface LanguageContextType {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  toggleLang: () => void;
  isId: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ID',
  setLang: () => {},
  toggleLang: () => {},
  isId: true,
});

const STORAGE_KEY = 'siloam_esg_app_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { dbUser } = useAuth();
  const [lang, setLangState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'EN' ? 'EN' : 'ID';
  });

  useEffect(() => {
    if (dbUser?.preferredLang === 'EN' || dbUser?.preferredLang === 'ID') {
      setLangState(dbUser.preferredLang);
      try {
        localStorage.setItem(STORAGE_KEY, dbUser.preferredLang);
      } catch {
        /* ignore */
      }
    }
  }, [dbUser?.preferredLang]);

  const setLang = (newLang: AppLanguage) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch (e) {
      console.error('Failed to save language preference:', e);
    }
    if (dbUser) {
      void apiPost('/api/auth/preferences', { lang: newLang });
    }
  };

  const toggleLang = () => {
    setLang(lang === 'ID' ? 'EN' : 'ID');
  };

  const isId = lang === 'ID';

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, isId }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
