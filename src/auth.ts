import { auth } from './firebase';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://whats.alattab.site').replace(/\/$/, '');

export interface SendOtpResponse {
  success: boolean;
  phoneNumber: string;
  expiresInSeconds: number;
  retryAfterSeconds: number;
}

export interface VerifyOtpResponse {
  success: boolean;
  customToken: string;
  user: {
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
  };
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as T & { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(data.error || data.message || `HTTP ${response.status}`);
  }
  return data;
}

export async function sendWhatsAppOtp(payload: { phoneNumber: string }): Promise<{ data: SendOtpResponse }> {
  const data = await postJson<SendOtpResponse>('/takhfid/api/auth/send-otp', payload);
  return { data };
}

export async function verifyWhatsAppOtp(payload: {
  phoneNumber: string;
  otp: string;
  firstName: string;
  secondName?: string;
  thirdName?: string;
  lastName?: string;
  governorate: string;
}): Promise<{ data: VerifyOtpResponse }> {
  const data = await postJson<VerifyOtpResponse>('/takhfid/api/auth/verify-otp', payload);
  return { data };
}

void auth;
