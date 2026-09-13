import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore('ai-studio-3cbe8e72-8545-44eb-90af-bac8612b6c5c');
const auth = getAuth();
const app = express();
const port = Number(process.env.PORT || 8080);

app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: '1mb' }));

interface IntegrationSettings {
  whatsappSendUrl?: string;
  whatsappApiKey?: string;
  whatsappApiKeyHeader?: string;
  whatsappApiKeyPrefix?: string;
  otpHashSecret?: string;
  adminPhones?: string[];
}

function normalizePhone(value: unknown): string {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `967${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith('7')) digits = `967${digits}`;
  return digits;
}

function phoneDocId(phone: string): string {
  return crypto.createHash('sha256').update(phone).digest('hex').slice(0, 32);
}

function otpHash(phone: string, otp: string, secret: string): string {
  return crypto.createHash('sha256').update(`${phone}:${otp}:${secret}`).digest('hex');
}

async function getSettings(): Promise<IntegrationSettings> {
  const snapshot = await db.collection('app_settings').doc('integrations').get();
  if (!snapshot.exists) throw new Error('إعدادات التكامل غير موجودة');
  return snapshot.data() as IntegrationSettings;
}

function adminPhoneSet(settings: IntegrationSettings): Set<string> {
  return new Set((settings.adminPhones || []).map(normalizePhone).filter(Boolean));
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'takhfid-server' }));

app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phoneNumber);
    if (!/^\d{8,15}$/.test(phone)) return res.status(400).json({ error: 'رقم الهاتف غير صالح' });
    const settings = await getSettings();
    if (!settings.whatsappSendUrl || !settings.otpHashSecret) return res.status(503).json({ error: 'إعدادات OTP غير مكتملة من لوحة الإدارة' });
    const ref = db.collection('otp_requests').doc(phoneDocId(phone));
    const now = Date.now();
    const old = await ref.get();
    if (old.exists && now - Number(old.data()?.sentAtMs || 0) < 60_000) return res.status(429).json({ error: 'انتظر قبل إعادة الإرسال' });
    const otp = String(crypto.randomInt(100000, 1000000));
    await ref.set({ phone, hash: otpHash(phone, otp, settings.otpHashSecret), sentAtMs: now, expiresAtMs: now + 300_000, attempts: 0 });
    const form = new FormData();
    form.append('phoneNumber', phone);
    form.append('message', `رمز الدخول إلى التخفيض الصح: ${otp}\nصالح لمدة 5 دقائق. لا تشاركه مع أي شخص.`);
    const headers: Record<string, string> = {};
    if (settings.whatsappApiKey) headers[settings.whatsappApiKeyHeader || 'Authorization'] = `${settings.whatsappApiKeyPrefix ?? 'Bearer '}${settings.whatsappApiKey}`;
    const response = await fetch(settings.whatsappSendUrl, { method: 'POST', body: form, headers });
    if (!response.ok) {
      await ref.delete();
      return res.status(502).json({ error: 'تعذر إرسال رمز التحقق عبر واتساب' });
    }
    return res.json({ success: true, phoneNumber: phone, expiresInSeconds: 300, retryAfterSeconds: 60 });
  } catch (error) {
    console.error('send-otp failed', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء إرسال رمز التحقق' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phoneNumber);
    const otp = String(req.body?.otp || '').trim();
    if (!/^\d{8,15}$/.test(phone) || !/^\d{6}$/.test(otp)) return res.status(400).json({ error: 'بيانات التحقق غير صالحة' });
    const settings = await getSettings();
    if (!settings.otpHashSecret) return res.status(503).json({ error: 'سر OTP غير مضبوط' });
    const ref = db.collection('otp_requests').doc(phoneDocId(phone));
    const snapshot = await ref.get();
    if (!snapshot.exists) return res.status(400).json({ error: 'لا يوجد رمز تحقق نشط' });
    const record = snapshot.data()!;
    if (Date.now() > Number(record.expiresAtMs || 0)) { await ref.delete(); return res.status(400).json({ error: 'انتهت صلاحية الرمز' }); }
    const attempts = Number(record.attempts || 0);
    if (attempts >= 5) { await ref.delete(); return res.status(429).json({ error: 'تم تجاوز عدد المحاولات' }); }
    if (otpHash(phone, otp, settings.otpHashSecret) !== record.hash) { await ref.update({ attempts: FieldValue.increment(1) }); return res.status(403).json({ error: 'رمز التحقق غير صحيح' }); }

    const uid = `usr_${phone}`;
    const isAdmin = adminPhoneSet(settings).has(phone);
    const now = new Date().toISOString();
    try { await auth.getUser(uid); } catch (error: any) { if (error?.code === 'auth/user-not-found') await auth.createUser({ uid, phoneNumber: `+${phone}` }); else throw error; }
    await auth.setCustomUserClaims(uid, { admin: isAdmin, role: isAdmin ? 'admin' : 'customer' });
    const userRef = db.collection('users').doc(uid);
    const old = (await userRef.get()).data() || {};
    const user = {
      uid,
      phone,
      firstName: String(req.body?.firstName || old.firstName || ''),
      secondName: String(req.body?.secondName || old.secondName || ''),
      thirdName: String(req.body?.thirdName || old.thirdName || ''),
      lastName: String(req.body?.lastName || old.lastName || ''),
      governorate: String(req.body?.governorate || old.governorate || 'أمانة العاصمة'),
      role: isAdmin ? 'admin' : 'customer',
      isAdmin,
      createdAt: String(old.createdAt || now),
      lastLoginAt: now,
      updatedAt: now,
    };
    await userRef.set(user, { merge: true });
    const customToken = await auth.createCustomToken(uid, { admin: isAdmin, role: user.role });
    await ref.delete();
    return res.json({ success: true, customToken, user });
  } catch (error) {
    console.error('verify-otp failed', error);
    return res.status(500).json({ error: 'تعذر إكمال تسجيل الدخول' });
  }
});

app.listen(port, () => console.log(`takhfid-server listening on ${port}`));
