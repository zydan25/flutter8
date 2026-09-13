import React, { useState } from 'react';
import { X, User, Phone, MapPin, ShieldCheck, ArrowRight, LogOut } from 'lucide-react';
import type { User as UserType } from '../types';
import { ALL_GOVERNORATES } from '../data/governorates';
import { syncUserToFirestore } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  user: UserType | null;
  onClose: () => void;
  onLogin: (user: UserType) => void;
  onLogout: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  user,
  onClose,
  onLogin,
  onLogout,
  onShowToast,
}) => {
  if (!isOpen) return null;

  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [thirdName, setThirdName] = useState('');
  const [lastName, setLastName] = useState('');
  const [governorate, setGovernorate] = useState('أمانة العاصمة');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !firstName.trim()) {
      onShowToast('يرجى إدخال الاسم الأول ورقم الهاتف على الأقل', 'error');
      return;
    }

    setIsSubmitting(true);
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const isAdmin = cleanPhone.includes('782996982') || cleanPhone.includes('771053370');

    const newUser: UserType = {
      uid: `usr_${cleanPhone || Date.now()}`,
      phone: cleanPhone,
      firstName: firstName.trim(),
      secondName: secondName.trim() || undefined,
      thirdName: thirdName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      governorate,
      role: isAdmin ? 'admin' : 'customer',
      isAdmin,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    try {
      await syncUserToFirestore(newUser);
      onLogin(newUser);
      onClose();
      onShowToast(
        isAdmin ? 'مرحباً بك يا مدير المتجر بشير نجيب محرز التبالي 👑' : `أهلاً بك يا ${firstName}! تم تسجيلك بنجاح ✨`,
        'success'
      );
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء حفظ الحساب', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
      <div
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-purple-700 text-white">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <h3 className="font-extrabold text-sm sm:text-base">
              {user ? 'الملف الشخصي' : 'تسجيل الدخول / إنشاء حساب'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-purple-800 text-white/80">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-purple-50 p-4 rounded-2xl border border-purple-100">
                <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-lg">
                  {user.firstName ? user.firstName[0] : 'ع'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {user.firstName} {user.secondName || ''} {user.lastName || ''}
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">{user.phone}</span>
                  {user.isAdmin && (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full mt-1">
                      <ShieldCheck className="w-3 h-3" />
                      مدير المتجر
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>المحافظة:</span>
                  <span className="font-bold text-slate-800">{user.governorate || 'اليمن'}</span>
                </div>
                <div className="flex justify-between">
                  <span>نوع الحساب:</span>
                  <span className="font-bold text-slate-800">{user.isAdmin ? 'إدارة' : 'عميل'}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onLogout();
                  onClose();
                  onShowToast('تم تسجيل الخروج بنجاح', 'info');
                }}
                className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="text-xs text-slate-500 mb-2">
                أدخل بياناتك لتسجيل الدخول ومتابعة طلباتك والاستفادة من عروض التخفيض الصح
              </p>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="الاسم الأول *"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-purple-600"
                  required
                />
                <input
                  type="text"
                  placeholder="اسم الأب"
                  value={secondName}
                  onChange={(e) => setSecondName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="اسم الجد"
                  value={thirdName}
                  onChange={(e) => setThirdName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-purple-600"
                />
                <input
                  type="text"
                  placeholder="اللقب / العائلة"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-purple-600"
                />
              </div>

              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="tel"
                  placeholder="رقم الهاتف (مثال: 782996982) *"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-purple-600"
                  required
                />
              </div>

              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full text-xs pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-purple-600 appearance-none"
                >
                  {ALL_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'جاري التسجيل...' : 'دخول / تسجيل حساب'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
