const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://whats.alattab.site').replace(/\/$/, '');
const TOKEN_KEY = 'takhfid_access_token';

export function getAccessToken(): string | null { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
export function setAccessToken(token: string): void { localStorage.setItem(TOKEN_KEY, token); }
export function clearAccessToken(): void { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } }

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set('Accept', 'application/json');
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string; message?: string };
  if (!response.ok) throw new Error(data.error || data.message || `HTTP ${response.status}`);
  return data;
}

export interface ApiUser { uid: string; phone: string; firstName?: string; secondName?: string; thirdName?: string; lastName?: string; governorate?: string; role?: 'admin' | 'customer'; isAdmin?: boolean; createdAt?: string; lastLoginAt?: string; updatedAt?: string; }
export interface VerifySessionResponse { success: boolean; accessToken: string; tokenType: 'Bearer'; expiresAt: string; user: ApiUser; }
export interface FlaskContent { categories: any[]; banners: any[]; campaigns: any[]; }

export async function fetchCurrentUser(): Promise<ApiUser | null> {
  if (!getAccessToken()) return null;
  try { const result = await apiFetch<{ success: boolean; user: ApiUser }>('/takhfid/api/v2/auth/me'); return result.user; }
  catch { clearAccessToken(); return null; }
}
export async function logoutApi(): Promise<void> { try { await apiFetch('/takhfid/api/v2/auth/logout', { method: 'POST' }); } finally { clearAccessToken(); } }
export async function sendOtpApi(phoneNumber: string) { return apiFetch<{ success: boolean; expiresInSeconds: number; retryAfterSeconds: number; phoneNumber: string }>('/takhfid/api/v2/auth/send-otp', { method: 'POST', body: JSON.stringify({ phoneNumber }) }); }
export async function verifyOtpApi(payload: { phoneNumber: string; otp: string; firstName: string; secondName?: string; thirdName?: string; lastName?: string; governorate: string; }): Promise<VerifySessionResponse> { const result = await apiFetch<VerifySessionResponse>('/takhfid/api/v2/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) }); setAccessToken(result.accessToken); return result; }
export async function getMyProfileApi(): Promise<ApiUser> { const result = await apiFetch<{ success: boolean; user: ApiUser }>('/takhfid/api/v2/me/profile'); return result.user; }
export async function updateMyProfileApi(payload: Partial<Omit<ApiUser, 'uid' | 'phone' | 'role' | 'isAdmin' | 'createdAt' | 'lastLoginAt' | 'updatedAt'>>): Promise<ApiUser> { const result = await apiFetch<{ success: boolean; user: ApiUser }>('/takhfid/api/v2/me/profile', { method: 'PUT', body: JSON.stringify(payload) }); return result.user; }
export async function getFlaskCustomers(): Promise<ApiUser[]> { const result = await apiFetch<{ success: boolean; customers: ApiUser[] }>('/takhfid/api/v2/admin/customers'); return result.customers || []; }
export async function mirrorCustomersToFlask(customers: unknown[]): Promise<void> { if (!getAccessToken()) return; await apiFetch('/takhfid/api/v2/admin/customers/bulk', { method: 'POST', body: JSON.stringify({ customers }) }); }
export async function deleteFlaskCustomer(uid: string): Promise<void> { await apiFetch(`/takhfid/api/v2/admin/customers/${encodeURIComponent(uid)}`, { method: 'DELETE' }); }
export async function mirrorProductsToFlask(products: unknown[]): Promise<void> { if (!getAccessToken()) return; await apiFetch('/takhfid/api/v2/products/bulk', { method: 'POST', body: JSON.stringify({ products }) }); }
export async function getFlaskProducts<T>(): Promise<T[]> { const result = await apiFetch<{ success: boolean; products: T[] }>('/takhfid/api/v2/products'); return result.products || []; }
export async function saveFlaskProduct(product: unknown): Promise<void> { await apiFetch('/takhfid/api/v2/products', { method: 'POST', body: JSON.stringify(product) }); }
export async function deleteFlaskProduct(productId: string): Promise<void> { await apiFetch(`/takhfid/api/v2/products/${encodeURIComponent(productId)}`, { method: 'DELETE' }); }
export async function createFlaskOrder(input: unknown) { return apiFetch<{ success: boolean; order: any }>('/takhfid/api/v2/orders', { method: 'POST', body: JSON.stringify(input) }); }
export async function getFlaskOrders() { return apiFetch<{ success: boolean; orders: any[] }>('/takhfid/api/v2/orders'); }
export async function updateFlaskOrderStatus(orderId: string, status: string, isPaid?: boolean) { return apiFetch<{ success: boolean; order: any }>(`/takhfid/api/v2/orders/${encodeURIComponent(orderId)}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...(typeof isPaid === 'boolean' ? { isPaid } : {}) }) }); }
export async function getOrderChat(orderId: string) { return apiFetch<{ success: boolean; messages: any[] }>(`/takhfid/api/v2/orders/${encodeURIComponent(orderId)}/chat`); }
export async function sendOrderChatMessageApi(orderId: string, message: { type: string; text?: string; imageUrl?: string }) { return apiFetch<{ success: boolean; message: any }>(`/takhfid/api/v2/orders/${encodeURIComponent(orderId)}/chat/messages`, { method: 'POST', body: JSON.stringify(message) }); }
export async function uploadPaymentProofApi(orderId: string, file: File, note = '') { const form = new FormData(); form.append('file', file); form.append('note', note); return apiFetch<{ success: boolean; order: any; message: any; url: string }>(`/takhfid/api/v2/orders/${encodeURIComponent(orderId)}/payment-proof/upload`, { method: 'POST', body: form }); }
export async function getFlaskContent(): Promise<FlaskContent> { const result = await apiFetch<{ success: boolean; content: FlaskContent }>('/takhfid/admin/api/content'); return result.content || { categories: [], banners: [], campaigns: [] }; }
export async function saveFlaskContent(content: Partial<FlaskContent>): Promise<FlaskContent> { const result = await apiFetch<{ success: boolean; content: FlaskContent }>('/takhfid/admin/api/content', { method: 'PUT', body: JSON.stringify(content) }); return result.content; }
export { API_BASE_URL };
