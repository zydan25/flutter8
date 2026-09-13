import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

const functions = getFunctions(app, 'us-central1');

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

export const sendWhatsAppOtp = httpsCallable<{ phoneNumber: string }, SendOtpResponse>(functions, 'sendWhatsAppOtp');
export const verifyWhatsAppOtp = httpsCallable<
  {
    phoneNumber: string;
    otp: string;
    firstName: string;
    secondName?: string;
    thirdName?: string;
    lastName?: string;
    governorate: string;
  },
  VerifyOtpResponse
>(functions, 'verifyWhatsAppOtp');
