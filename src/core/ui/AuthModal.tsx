import React, { useEffect, useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiFetch } from '../services/api';
import { ShieldCheck, Building2, LogOut } from 'lucide-react';

type Actor = { email: string; name: string; role: string; company: string };

const roleLabel: Record<string, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  vendor_admin: 'PIC vendor',
  vendor_member: 'Staf vendor',
  vendor: 'Vendor',
};

function ssoErrorMessage(err: unknown): string {
  const code = err instanceof FirebaseError ? err.code : '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Login dibatalkan.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'Email ini sudah login lewat SSO lain. Pakai provider yang sama.';
  }
  if (err instanceof Error && err.message === 'not_invited') {
    return 'Email ini tidak ada di undangan VOB. Hubungi tim ESG Siloam.';
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Login gagal. Pakai email yang terdaftar di VOB.';
}

export const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { isId } = useLanguage();
  const { dbUser, vendor, signInWithGoogle, signInWithMicrosoft, signInWithPassword, signInAsDemoSuperAdmin, signInAsActor, signOut, authError } = useAuth();
  const [ssoError, setSsoError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [actors, setActors] = useState<Actor[]>([]);
  const [actor, setActor] = useState('');
  const signedIn = Boolean(dbUser);

  useEffect(() => {
    if (!isOpen || signedIn) return;
    void apiFetch('/api/public/auth/actors')
      .then(async (res) => (res.ok ? res.json() : { actors: [] }))
      .then((data) => setActors(Array.isArray(data.actors) ? data.actors : []))
      .catch(() => setActors([]));
  }, [isOpen, signedIn]);

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const runAuth = async (fn: () => Promise<void>) => {
    setSsoError(null);
    try {
      await fn();
      onClose();
    } catch (err) {
      setSsoError(ssoErrorMessage(err));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${signedIn ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400' : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'}`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {signedIn
                  ? (isId ? 'Sesi akun' : 'Account session')
                  : (isId ? 'Masuk ke Portal Mitra' : 'Sign in to Partner Portal')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {signedIn
                  ? (isId ? 'Anda sudah masuk. Keluar akan mengakhiri sesi ini.' : 'You are signed in. Sign out ends this session.')
                  : (isId ? 'Pakai email undangan VOB · Google / Microsoft / password UAT' : 'Use your VOB invite email · Google / Microsoft / UAT password')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1"
          >
            ✕
          </button>
        </div>

        {signedIn ? (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Signed in as</span>
                <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full capitalize">
                  {dbUser?.role ? dbUser.role.replace('_', ' ') : 'Vendor Member'}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{dbUser?.name || dbUser?.email}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{dbUser?.email}</p>
            </div>

            {vendor ? (
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-950 space-y-1">
                <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
                  <Building2 className="w-4 h-4" />
                  <span>{vendor.companyName}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Industry: {vendor.industry} • Employees: {vendor.employeeCount}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500">Verification Status:</span>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                    vendor.verificationStatus === 'Verified' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' :
                    vendor.verificationStatus === 'Needs Review' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                  }`}>
                    {vendor.verificationStatus || 'Pending'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                Email ini belum terdaftar di roster vendor (VOB). Portal hanya untuk email yang sudah diundang. Hubungi tim ESG Siloam.
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 font-semibold rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
              <span>{isId ? 'Keluar' : 'Sign Out'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Masuk dengan Google atau Microsoft. Email harus sama persis dengan undangan VOB.
            </p>
            {(ssoError || authError === 'not_invited') && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
                {ssoError || 'Email ini tidak ada di undangan VOB. Hubungi tim ESG Siloam.'}
              </p>
            )}
            {actors.length > 0 && (
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (actor) void runAuth(() => signInAsActor(actor));
                }}
              >
                <label className="block text-xs font-semibold text-slate-500">
                  {isId ? 'Masuk sebagai (uji, tanpa password)' : 'Sign in as (test, no password)'}
                </label>
                <select
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                  className="w-full min-h-12 px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  required
                >
                  <option value="">{isId ? 'Pilih akun di database' : 'Pick a database account'}</option>
                  {actors.map((a) => (
                    <option key={a.email} value={a.email}>
                      {(roleLabel[a.role] || a.role)} · {a.name || a.email}{a.company ? ` · ${a.company}` : ''}
                    </option>
                  ))}
                </select>
                <button type="submit" className="w-full min-h-12 py-3 px-4 bg-slate-900 text-white font-semibold rounded-xl text-sm">
                  {isId ? 'Masuk' : 'Sign in'}
                </button>
              </form>
            )}
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                void runAuth(() => signInWithPassword(email, password));
              }}
            >
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full min-h-12 px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base"
                required
              />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full min-h-12 px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base"
                required
              />
              <button
                type="submit"
                className="w-full min-h-12 py-3 px-4 bg-[#0f5238] hover:bg-emerald-900 text-white font-semibold rounded-xl text-base"
              >
                Masuk dengan email
              </button>
            </form>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-400">
              <span className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              SSO
              <span className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void runAuth(signInWithGoogle)}
                className="min-h-12 py-3 px-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl"
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => void runAuth(signInWithMicrosoft)}
                className="min-h-12 py-3 px-3 bg-white hover:bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
              >
                Microsoft
              </button>
            </div>
            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={() => void runAuth(signInAsDemoSuperAdmin)}
                className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 py-2"
              >
                Demo super admin (local only)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
