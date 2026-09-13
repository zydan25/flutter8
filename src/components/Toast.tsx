import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl bg-slate-900/95 text-white backdrop-blur-md text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-bottom-4 duration-300 border border-slate-700/50">
      {type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
      {type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
      {type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
      <span>{message}</span>
      <button
        onClick={onClose}
        className="mr-1 p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
