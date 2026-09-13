import { createHash, randomInt } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';

initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });
const db = getFirestore('ai-studio-3cbe8e72-8545-44eb-90af-bac8612b6c5c');
const auth = getAuth();
const WHATSAPP_SEND_URL = defineSecret('WHATSAPP_SEND_URL');
const OTP_HASH_SECRET = defineSecret('OTP_HASH_SECRET');
const ADMIN_PHONES = defineSecret('ADMIN_PHONES');

function normalizePhone(value: string): string { let digits = String(value || '').replace(/\D/g, ''); if (digits.startsWith('00')) digits = digits.slice(2); if (digits.startsWith('0')) digits = `967${digits.slice(1)}`; if (digits.length === 9 && digits.startsWith('7')) digits = `967${digits}`; return digits; }
function otpHash(phone: string, otp: string, secret: string): string { return createHash('sha256').update(`${phone}:${otp}:${secret}`).digest('hex'); }
function phoneDocId(phone: string): string { return createHash('sha256').update(phone).digest('hex').slice(0, 32); }

export const sendWhatsAppOtp = onCall({ secrets: [WHATSAPP_SEND_URL, OTP_HASH_SECRET] }, async (request) => {
  const phone = normalizePhone(request.data?.phoneNumber); if (!/^\d{8,15}$/.test(phone)) throw new HttpsError('invalid-argument', 'رقم الهاتف غير صالح');
  const ref = db.collection('otp_requests').doc(phoneDocId(phone)); const now = Date.now(); const old = await ref.get();
  if (old.exists && now - Number(old.data()?.sentAtMs || 0) < 60_000) throw new HttpsError('resource-exhausted', 'انتظر قبل إعادة الإرسال');
  const otp = String(randomInt(100000, 1000000));
  await ref.set({ phone, hash: otpHash(phone, otp, OTP_HASH_SECRET.value()), sentAtMs: now, expiresAtMs: now + 300_000, attempts: 0 });
  const form = new FormData(); form.append('phoneNumber', phone); form.append('message', `رمز الدخول إلى التخفيض الصح: ${otp}\nصالح لمدة 5 دقائق. لا تشاركه مع أي شخص.`);
  try { const response = await fetch(WHATSAPP_SEND_URL.value(), { method: 'POST', body: form }); if (!response.ok) { await ref.delete(); throw new HttpsError('unavailable', 'تعذر إرسال رمز التحقق عبر واتساب'); } }
  catch (error) { await ref.delete().catch(() => undefined); if (error instanceof HttpsError) throw error; logger.error('WhatsApp OTP gateway failed', error); throw new HttpsError('unavailable', 'خدمة واتساب غير متاحة حاليًا'); }
  return { success: true, phoneNumber: phone, expiresInSeconds: 300, retryAfterSeconds: 60 };
});

export const verifyWhatsAppOtp = onCall({ secrets: [OTP_HASH_SECRET, ADMIN_PHONES] }, async (request) => {
  const phone = normalizePhone(request.data?.phoneNumber); const otp = String(request.data?.otp || '').trim(); if (!/^\d{8,15}$/.test(phone) || !/^\d{6}$/.test(otp)) throw new HttpsError('invalid-argument', 'بيانات التحقق غير صالحة');
  const ref = db.collection('otp_requests').doc(phoneDocId(phone)); const snapshot = await ref.get(); if (!snapshot.exists) throw new HttpsError('failed-precondition', 'لا يوجد رمز تحقق نشط');
  const record = snapshot.data()!; if (Date.now() > Number(record.expiresAtMs || 0)) { await ref.delete(); throw new HttpsError('deadline-exceeded', 'انتهت صلاحية الرمز'); }
  const attempts = Number(record.attempts || 0); if (attempts >= 5) { await ref.delete(); throw new HttpsError('resource-exhausted', 'تم تجاوز عدد المحاولات'); }
  if (otpHash(phone, otp, OTP_HASH_SECRET.value()) !== record.hash) { await ref.update({ attempts: FieldValue.increment(1) }); throw new HttpsError('permission-denied', 'رمز التحقق غير صحيح'); }
  const uid = `usr_${phone}`; const adminPhones = ADMIN_PHONES.value().split(',').map(normalizePhone).filter(Boolean); const isAdmin = adminPhones.includes(phone); const now = new Date().toISOString();
  try {
    try { await auth.getUser(uid); } catch (error: any) { if (error?.code === 'auth/user-not-found') await auth.createUser({ uid, phoneNumber: `+${phone}` }); else throw error; }
    await auth.setCustomUserClaims(uid, { admin: isAdmin, role: isAdmin ? 'admin' : 'customer' });
    const userRef = db.collection('users').doc(uid); const old = (await userRef.get()).data() || {};
    const user = { uid, phone, firstName: String(request.data?.firstName || old.firstName || ''), secondName: String(request.data?.secondName || old.secondName || ''), thirdName: String(request.data?.thirdName || old.thirdName || ''), lastName: String(request.data?.lastName || old.lastName || ''), governorate: String(request.data?.governorate || old.governorate || 'أمانة العاصمة'), role: isAdmin ? 'admin' : 'customer', isAdmin, createdAt: String(old.createdAt || now), lastLoginAt: now, updatedAt: now };
    await userRef.set(user, { merge: true }); const customToken = await auth.createCustomToken(uid, { admin: isAdmin, role: user.role }); await ref.delete(); return { success: true, customToken, user };
  } catch (error) { logger.error('OTP finalization failed', error); throw new HttpsError('internal', 'تعذر إكمال تسجيل الدخول'); }
});

type OrderItemPayload = { productId: string; productName: string; quantity: number; price: number; image: string; color?: string; size?: string; };
export const createOrder = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول قبل إنشاء الطلب');
  const items = Array.isArray(request.data?.items) ? request.data.items : []; if (!items.length || items.length > 100) throw new HttpsError('invalid-argument', 'السلة غير صالحة');
  const snapshots = await Promise.all(items.map((item: any) => db.collection('products').doc(String(item.productId)).get()));
  const orderItems: OrderItemPayload[] = items.map((item: any, index: number) => { const snapshot = snapshots[index]; if (!snapshot.exists) throw new HttpsError('not-found', 'أحد المنتجات غير موجود'); const product = snapshot.data() || {}; const quantity = Math.max(1, Math.min(99, Number(item.quantity) || 1)); return { productId: snapshot.id, productName: String(product.name || 'منتج'), quantity, price: Number(product.price ?? product.discountPrice ?? product.originalPrice ?? 0), image: String(product.image || ''), color: item.color ? String(item.color) : undefined, size: item.size ? String(item.size) : undefined }; });
  const profile = (await db.collection('users').doc(request.auth.uid).get()).data() || {};
  const subtotal = orderItems.reduce((sum: number, item: OrderItemPayload) => sum + item.price * item.quantity, 0); const currency = request.data?.currency === 'SAR' ? 'SAR' : 'YER'; const shippingFee = currency === 'SAR' ? 18 : 2500;
  const paymentMethod = ['cash_on_delivery', 'kuraimi', 'jawali', 'one_cash'].includes(request.data?.paymentMethod) ? request.data.paymentMethod : 'cash_on_delivery';
  const status = paymentMethod === 'cash_on_delivery' ? 'preparing' : 'awaiting_payment';
  const orderRef = db.collection('orders').doc(); const order = { id: orderRef.id, customerId: request.auth.uid, orderNumber: `TK-${randomInt(100000, 1000000)}`, customerName: String(request.data?.customerName || profile.firstName || 'عميل').trim(), customerPhone: String(profile.phone || ''), governorate: String(request.data?.governorate || profile.governorate || 'أمانة العاصمة'), address: String(request.data?.address || '').trim(), items: orderItems, subtotal, shippingFee, discount: 0, total: subtotal + shippingFee, currency, status, paymentMethod, createdAt: new Date().toISOString(), isPaid: false };
  await orderRef.set(order); await db.collection('chats').doc(orderRef.id).set({ id: orderRef.id, orderId: orderRef.id, customerId: request.auth.uid, orderNumber: order.orderNumber, total: order.total, currency, paymentMethod, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { merge: true });
  await db.collection('chats').doc(orderRef.id).collection('messages').add({ id: randomInt(100000, 1000000).toString(), orderId: orderRef.id, senderId: request.auth.uid, senderRole: 'customer', type: 'order_snapshot', text: `تم إنشاء الطلب ${order.orderNumber} والإجمالي ${order.total} ${currency}.`, orderSnapshot: order, createdAt: new Date().toISOString() });
  return { success: true, order };
});
