import { auth } from '../../lib/firebase';

export async function authHeaders(extra: Record<string, string> = {}): Promise<HeadersInit> {
  const headers: Record<string, string> = { ...extra };
  const user = auth.currentUser;
  if (user) {
    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }
  return headers;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  let extra: Record<string, string> = {};
  if (init.headers && !(init.headers instanceof Headers) && !Array.isArray(init.headers)) {
    extra = init.headers as Record<string, string>;
  }
  const { headers: _ignored, ...rest } = init;
  return fetch(path, { ...rest, credentials: 'include', headers: await authHeaders(extra) });
}

export async function publicGet<T>(path: string): Promise<T | null> {
  const res = await fetch(path, { credentials: 'include' });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export async function publicPost<T>(path: string, body: unknown): Promise<T | null> {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export async function apiDownload(path: string, filename: string): Promise<boolean> {
  const res = await apiFetch(path);
  if (!res.ok) return false;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

export async function apiGet<T>(path: string): Promise<T | null> {
  const res = await apiFetch(path);
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T | null> {
  const res = await apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export async function apiDelete<T>(path: string): Promise<T | null> {
  const res = await apiFetch(path, { method: 'DELETE' });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export async function apiPostForm<T>(path: string, form: FormData): Promise<T | null> {
  const res = await apiFetch(path, { method: 'POST', body: form });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

const blobCache = new Map<string, string>();

export async function authObjectUrl(path: string): Promise<string | null> {
  if (blobCache.has(path)) return blobCache.get(path)!;
  const res = await apiFetch(path);
  if (!res.ok) return null;
  const url = URL.createObjectURL(await res.blob());
  blobCache.set(path, url);
  return url;
}
