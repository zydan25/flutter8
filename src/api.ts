const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://whats.alattab.site').replace(/\/$/, '');
const TOKEN_KEY = 'takhfid_access_token';

export function getAccessToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setAccessToken(token: string): void { localStorage.setItem(TOKEN_KEY, token); }
export function clearAccessToken(): void { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } }

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string; message?: string };
  if (!response.ok) throw new Error(data.error || data.message || `HTTP ${response.status}`);
  return data;
}

export interface ApiUser {
  uid: string;
  phone: string;
  firstName?: string;
  secondName?: string;
  thirdName?: string;
  lastName?: string;
  governorate?: string;
  role?: 'admin' | 'customer';
  isAdmin?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  updatedAt?: string;
}

export interface VerifySessionResponse {
  success: boolean;
  accessToken: string;
  tokenType: 'Bearer';
  expiresAt: string;
  user: ApiUser;
}

export async function fetchCurrentUser(): Promise<ApiUser | null> {
  if (!getAccessToken()) return null;
  try {
    const result = await apiFetch<{ success: boolean; user: ApiUser }>('/takhfid/api/v2/auth/me');
    return result.user;
  } catch {
    clearAccessToken();
    return null;
  }
}

export async function logoutApi(): Promise<void> {
  try { await apiFetch('/takhfid/api/v2/auth/logout', { method: 'POST' }); }
  finally { clearAccessToken(); }
}

export async function sendOtpApi(phoneNumber: string): Promise<{ success: boolean; expiresInSeconds: number; retryAfterSeconds: number; phoneNumber: string }> {
  return apiFetch('/takhfid/api/v2/auth/send-otp', { method: 'POST', body: JSON.stringify({ phoneNumber }) });
}

export async function verifyOtpApi(payload: {
  phoneNumber: string;
  otp: string;
  firstName: string;
  secondName?: string;
  thirdName?: string;
  lastName?: string;
  governorate: string;
}): Promise<VerifySessionResponse> {
  const result = await apiFetch<VerifySessionResponse>('/takhfid/api/v2/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setAccessToken(result.accessToken);
  return result;
}

export async function mirrorProductsToFlask(products: unknown[]): Promise<void> {
  if (!getAccessToken()) return;
  await apiFetch('/takhfid/api/v2/products/bulk', { method: 'POST', body: JSON.stringify({ products }) });
}

export async function getFlaskProducts<T>(): Promise<T[]> {
  const result = await apiFetch<{ success: boolean; products: T[] }>('/takhfid/api/v2/products');
  return result.products || [];
}

export async function saveFlaskProduct(product: unknown): Promise<void> {
  await apiFetch('/takhfid/api/v2/products', { method: 'POST', body: JSON.stringify(product) });
}

export async function deleteFlaskProduct(productId: string): Promise<void> {
  await apiFetch(`/takhfid/api/v2/products/${encodeURIComponent(productId)}`, { method: 'DELETE' });
}
