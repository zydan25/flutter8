import React from 'react';
import { X, MessageCircle, Phone, Clock, ShieldCheck } from 'lucide-react';

interface CustomerChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerChatModal: React.FC<CustomerChatModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
      <div
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-purple-700 text-white">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <h3 className="font-bold text-sm">خدمة العملاء والدعم الفني</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-purple-800 text-white/80">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Phone className="w-7 h-7" />
          </div>

          <div>
            <h4 className="font-extrabold text-slate-800 text-base">متجر التخفيض الصح</h4>
            <p className="text-xs text-slate-500 mt-1">
              فريقنا متواجد لخدمتكم والإجابة على كافة استفساراتكم ومتابعة طلباتكم
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">رقم الواتساب والاتصال:</span>
              <span className="font-mono font-bold text-purple-700">782996982</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">الرقم الإضافي:</span>
              <span className="font-mono font-bold text-purple-700">771053370</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> أوقات العمل:
              </span>
              <span>9:00 ص - 11:00 م</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <a
              href="https://wa.me/967782996982"
              target="_blank"
              rel="noreferrer"
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>محادثة واتساب فورية</span>
            </a>
            <a
              href="tel:782996982"
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              <span>اتصال هاتفي مباشر</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
