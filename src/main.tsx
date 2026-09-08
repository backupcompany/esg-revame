import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { getInitialTheme, setTheme } from './core/ui/theme';
import { LanguageProvider } from './core/context/LanguageContext';
import { AuthProvider } from './core/context/AuthContext';

const KEEP_LS = new Set(['esg_together_theme', 'siloam_esg_app_language']);

function wipeClientStores() {
  try {
    indexedDB.deleteDatabase('esg-together-db');
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem('demo_admin');
    localStorage.removeItem('demo_token');
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !KEEP_LS.has(k)) keys.push(k);
    }
    for (const k of keys) {
      if (k.startsWith('ecopartner_') || k.startsWith('esg_together_onboarding')) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    /* ignore */
  }
}

wipeClientStores();
setTheme(getInitialTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </AuthProvider>
  </StrictMode>,
);

