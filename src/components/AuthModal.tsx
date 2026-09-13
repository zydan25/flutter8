import React, { useEffect, useState } from 'react';
import { X, User, Phone, MapPin, ShieldCheck, ArrowRight, LogOut, RefreshCw } from 'lucide-react';
import type { User as UserType } from '../types';
import { ALL_GOVERNORATES } from '../data/governorates';
import { sendWhatsAppOtp, verifyWhatsAppOtp } from '../auth';

interface AuthModalProps {
  isOpen: boolean;
  user: UserType | null;
  onClose: () => void;
  onLogin: (user: UserType) => void;
  onLogout: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

function normalizePhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `967${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith('7')) digits = `967${digits}`;
  return digits;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, user, onClose, onLogin, onLogout, onShowToast }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [thirdName, setThirdName] = useState('');
  const [lastName, setLastName] = useState('');
  const [governorate, setGovernorate] = useState('أمانة العاصمة');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!isOpen) {
      setStep('phone');
      setOtp('');
      setCooldown(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const requestOtp = async () => {
    const normalized = normalizePhone(phone);
    if (!/^\d{8,15}$/.test(normalized)) {
      onShowToast('رقم الهاتف غير صالح. استخدم الرقم الدولي أو الرقم اليمني المحلي.', 'error');
      return;
    }
    setBusy(true);
    try {
      const result = await sendWhatsAppOtp({ phoneNumber: normalized });
      setPhone(normalized);
      setStep('otp');
      setCooldown(result.data.retryAfterSeconds || 60);
      onShowToast('تم إرسال رمز التحقق عبر واتساب ✅', 'success');
    } catch (error: any) {
      console.error('OTP send failed:', error);
      onShowToast(error?.message || 'تعذر إرسال رمز التحقق عبر واتساب', 'error');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      onShowToast('رمز التحقق يجب أن يتكون من 6 أرقام', 'error');
      return;
    }
    if (!firstName.trim()) {
      onShowToast('أدخل الاسم الأول', 'error');
      return;
    }
    setBusy(true);
    try {
      const result = await verifyWhatsAppOtp({
        phoneNumber: phone,
        otp,
        firstName: firstName.trim(),
        secondName: secondName.trim() || undefined,
        thirdName: thirdName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        governorate,
      });
      onLogin(result.data.user as UserType);
      onClose();
      onShowToast(result.data.user.isAdmin ? 'تم تسجيل الدخول إلى الإدارة بنجاح 👑' : `أهلًا بك يا ${result.data.user.firstName || firstName}!`, 'success');
    } catch (error: any) {
      console.error('OTP verification failed:', error);
      onShowToast(error?.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 bg-purple-700 text-white">
          <div className="flex items-center gap-2"><User className="w-5 h-5" /><h3 className="font-extrabold">{user ? 'الملف الشخصي' : 'الدخول برقم الهاتف'}</h3></div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-purple-800"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-purple-50 p-4 rounded-2xl border border-purple-100">
                <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-lg">{user.firstName?.[0] || 'ع'}</div>
                <div>
                  <h4 className="font-bold text-slate-800">{user.firstName} {user.secondName || ''} {user.lastName || ''}</h4>
                  <span className="text-xs text-slate-500 font-mono">{user.phone}</span>
                  {user.isAdmin && <div className="inline-flex items-center gap-1 text-[10px] text-amber-800 mt-1"><ShieldCheck className="w-3 h-3" /> مدير المتجر</div>}
                </div>
              </div>
              <button onClick={onLogout} className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold flex items-center justify-center gap-2"><LogOut className="w-4 h-4" />تسجيل الخروج</button>
            </div>
          ) : step === 'phone' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">سيتم إرسال رمز تحقق من 6 أرقام إلى واتساب.</p>
              <div className="relative"><Phone className="absolute right-3 top-3 w-4 h-4 text-slate-400" /><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="رقم الهاتف" className="w-full p-3 pr-9 rounded-xl border border-slate-200 text-sm" /></div>
              <button disabled={busy} onClick={requestOtp} className="w-full py-3 rounded-xl bg-purple-600 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2">{busy ? 'جاري إرسال الرمز...' : 'إرسال رمز واتساب'} <ArrowRight className="w-4 h-4" /></button>
            </div>
          ) : (
            <form onSubmit={verify} className="space-y-3">
              <div className="text-xs text-slate-500">أدخل الرمز الذي وصل إلى {phone}</div>
              <input inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full text-center tracking-[0.4em] text-xl font-black p-3 rounded-xl border border-purple-200 bg-purple-50" placeholder="000000" />
              <div className="grid grid-cols-2 gap-2"><input required value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="الاسم الأول *" className="p-2.5 rounded-xl border border-slate-200 text-xs" /><input value={secondName} onChange={(event) => setSecondName(event.target.value)} placeholder="اسم الأب" className="p-2.5 rounded-xl border border-slate-200 text-xs" /></div>
              <div className="grid grid-cols-2 gap-2"><input value={thirdName} onChange={(event) => setThirdName(event.target.value)} placeholder="اسم الجد" className="p-2.5 rounded-xl border border-slate-200 text-xs" /><input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="العائلة" className="p-2.5 rounded-xl border border-slate-200 text-xs" /></div>
              <div className="relative"><MapPin className="absolute right-3 top-3 w-4 h-4 text-slate-400" /><select value={governorate} onChange={(event) => setGovernorate(event.target.value)} className="w-full p-2.5 pr-9 rounded-xl border border-slate-200 text-xs bg-white">{ALL_GOVERNORATES.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
              <button disabled={busy} className="w-full py-3 rounded-xl bg-purple-600 disabled:opacity-50 text-white font-bold text-sm">{busy ? 'جاري التحقق...' : 'تحقق وتسجيل الدخول'}</button>
              <button type="button" disabled={cooldown > 0 || busy} onClick={requestOtp} className="w-full py-2 rounded-xl border border-slate-200 text-xs font-bold flex items-center justify-center gap-2"><RefreshCw className="w-3.5 h-3.5" />{cooldown > 0 ? `إعادة الإرسال بعد ${cooldown}ث` : 'إعادة إرسال الرمز'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
