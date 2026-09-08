import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleAuthProvider, microsoftAuthProvider } from '../../lib/firebase';
import { apiFetch } from '../services/api';

interface DbUser {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'vendor' | 'vendor_admin' | 'vendor_member';
  vendorId?: number;
  preferredLang?: 'ID' | 'EN';
}

interface VendorProfileServer {
  id: number;
  companyName: string;
  industry: string;
  employeeCount: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  verificationStatus: string;
  esgScore?: number;
  esgMaturityLevel?: string;
  onboardingCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  dbUser: DbUser | null;
  vendor: VendorProfileServer | null;
  vendorsList: VendorProfileServer[];
  allUsersList: DbUser[];
  loading: boolean;
  authGate: 'in' | 'out' | null;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInAsDemoSuperAdmin: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  verifyVendor: (vendorId: number, status: string) => Promise<void>;
  updateUserRole: (userId: number, role: string, vendorId?: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  vendor: null,
  vendorsList: [],
  allUsersList: [],
  loading: true,
  authGate: null,
  authError: null,
  signInWithGoogle: async () => {},
  signInWithMicrosoft: async () => {},
  signInWithPassword: async () => {},
  signInAsDemoSuperAdmin: async () => {},
  signOut: async () => {},
  refreshAuth: async () => {},
  verifyVendor: async () => {},
  updateUserRole: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [vendor, setVendor] = useState<VendorProfileServer | null>(null);
  const [vendorsList, setVendorsList] = useState<VendorProfileServer[]>([]);
  const [allUsersList, setAllUsersList] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [authGate, setAuthGate] = useState<'in' | 'out' | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const withAuthGate = async <T,>(kind: 'in' | 'out', fn: () => Promise<T>): Promise<T> => {
    setAuthGate(kind);
    const started = Date.now();
    try {
      return await fn();
    } finally {
      const wait = 400 - (Date.now() - started);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      setAuthGate(null);
    }
  };

  const fetchServerData = async (hold = false): Promise<string | null> => {
    try {
      const resMe = await apiFetch('/api/auth/me');
      if (resMe.status === 403) {
        const dataMe = await resMe.json().catch(() => ({}));
        const err = dataMe.error === 'not_invited' ? 'not_invited' : 'forbidden';
        setDbUser(null);
        setVendor(null);
        setVendorsList([]);
        setAllUsersList([]);
        setAuthError(err);
        return err;
      }
      if (!resMe.ok) {
        setDbUser(null);
        setVendor(null);
        return 'auth_failed';
      }
      const dataMe = await resMe.json();
      if (!dataMe?.user) {
        setDbUser(null);
        setVendor(null);
        setAuthError(null);
        return 'guest';
      }
      setDbUser(dataMe.user);
      setVendor(dataMe.vendor ?? null);
      setAuthError(null);
      const isSuperAdmin = dataMe?.user?.role === 'super_admin';

      const resVendors = await apiFetch('/api/vendors');
      if (resVendors.ok) {
        const dataVendors = await resVendors.json();
        if (dataVendors.vendors) {
          setVendorsList(dataVendors.vendors);
        }
      }

      if (isSuperAdmin) {
        const resAdmin = await apiFetch('/api/admin/vendors?limit=100&offset=0');
        if (resAdmin.ok) {
          const dataAdmin = await resAdmin.json();
          setVendorsList(dataAdmin.vendors || []);
          setAllUsersList(dataAdmin.users || []);
        }
      }
      return null;
    } catch (err) {
      console.error("Error syncing auth with server:", err);
      return 'auth_failed';
    } finally {
      if (!hold) setLoading(false);
    }
  };

  const signInAsDemoSuperAdmin = async () => {
    await withAuthGate('in', async () => {
      const res = await apiFetch('/api/public/auth/demo-admin', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Demo login off');
      }
      setLoading(true);
      const err = await fetchServerData();
      if (err === 'not_invited' || err === 'forbidden') throw new Error('not_invited');
      if (err) throw new Error('Login gagal');
    });
  };

  const signInWithPassword = async (email: string, password: string) => {
    await withAuthGate('in', async () => {
      const res = await apiFetch('/api/public/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Login gagal');
      }
      setLoading(true);
      const err = await fetchServerData();
      if (err === 'not_invited' || err === 'forbidden') throw new Error('not_invited');
      if (err) throw new Error('Login gagal');
    });
  };

  useEffect(() => {
    let unsub = () => {};
    let stop = false;
    void (async () => {
      const err = await fetchServerData(true);
      if (stop) return;
      if (err === null) {
        setLoading(false);
        return;
      }
      unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);
        if (firebaseUser) {
          setLoading(true);
          const next = await fetchServerData();
          if (next === 'not_invited' || next === 'forbidden') {
            await fbSignOut(auth).catch(() => {});
            setUser(null);
          }
        } else {
          setDbUser(null);
          setVendor(null);
          setVendorsList([]);
          setAllUsersList([]);
          setLoading(false);
        }
      });
    })();
    return () => {
      stop = true;
      unsub();
    };
  }, []);

  const finishSso = async () => {
    const err = await fetchServerData();
    if (err === 'not_invited' || err === 'forbidden') {
      await fbSignOut(auth).catch(() => {});
      setUser(null);
      throw new Error('not_invited');
    }
  };

  const signInWithGoogle = async () => {
    await withAuthGate('in', async () => {
      await signInWithPopup(auth, googleAuthProvider);
      await finishSso();
    });
  };

  const signInWithMicrosoft = async () => {
    await withAuthGate('in', async () => {
      await signInWithPopup(auth, microsoftAuthProvider);
      await finishSso();
    });
  };

  const signOut = async () => {
    await withAuthGate('out', async () => {
      localStorage.removeItem('demo_admin');
      localStorage.removeItem('demo_token');
      await apiFetch('/api/public/auth/logout', { method: 'POST' }).catch(() => {});
      await fbSignOut(auth).catch(() => {});
      setUser(null);
      setDbUser(null);
      setVendor(null);
      setVendorsList([]);
      setAllUsersList([]);
      setAuthError(null);
    });
  };

  const refreshAuth = async () => {
    await fetchServerData();
  };

  const verifyVendor = async (vendorId: number, status: string) => {
    const res = await apiFetch(`/api/admin/vendors/${vendorId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationStatus: status })
    });
    if (res.ok) {
      await refreshAuth();
    }
  };

  const updateUserRole = async (userId: number, role: string, vendorId?: number) => {
    const res = await apiFetch(`/api/admin/users/${userId}/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, vendorId })
    });
    if (res.ok) {
      await refreshAuth();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        vendor,
        vendorsList,
        allUsersList,
        loading,
        authGate,
        authError,
        signInWithGoogle,
        signInWithMicrosoft,
        signInWithPassword,
        signInAsDemoSuperAdmin,
        signOut,
        refreshAuth,
        verifyVendor,
        updateUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
