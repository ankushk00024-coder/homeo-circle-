import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X, HelpCircle } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

type ConfirmFn = (message: string, options?: { confirmLabel?: string; danger?: boolean }) => Promise<boolean>;
const ConfirmContext = createContext<ConfirmFn | null>(null);

interface PendingConfirm {
  message: string;
  confirmLabel: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
}

const STYLES: Record<ToastKind, { ring: string; icon: React.ElementType; iconClass: string }> = {
  success: { ring: 'ring-teal-200', icon: CheckCircle2, iconClass: 'text-teal-600' },
  error: { ring: 'ring-rose-200', icon: AlertCircle, iconClass: 'text-rose-600' },
  info: { ring: 'ring-sky-200', icon: Info, iconClass: 'text-sky-600' },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const nextId = useRef(1);

  const confirm: ConfirmFn = useCallback((message, options) => {
    return new Promise<boolean>((resolve) => {
      setPending({
        message,
        confirmLabel: options?.confirmLabel ?? 'Confirm',
        danger: options?.danger ?? false,
        resolve,
      });
    });
  }, []);

  const settle = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        pending.resolve(false);
        setPending(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending]);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-3), { id, kind, message }]);
    window.setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 4000);
  }, [dismiss]);

  // Safety net: any failed request that a page didn't handle still tells the user.
  useEffect(() => {
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : 'Something went wrong. Please try again.';
      push('error', message);
    };
    window.addEventListener('unhandledrejection', onRejection);
    return () => window.removeEventListener('unhandledrejection', onRejection);
  }, [push]);

  const api: ToastApi = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  };

  return (
    <ToastContext.Provider value={api}>
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs animate-fade-in" onClick={() => settle(false)} />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-message"
            className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-elevated ring-1 ring-brand-border animate-scale-in space-y-5"
          >
            <div className="flex items-start gap-3">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${pending.danger ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-700'}`}>
                <HelpCircle className="w-5 h-5" />
              </span>
              <p id="confirm-message" className="text-sm text-brand-navy leading-relaxed pt-2">{pending.message}</p>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => settle(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">
                Cancel
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => settle(true)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition active:scale-[.98] ${pending.danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-brand-teal hover:bg-brand-teal-hover'}`}
              >
                {pending.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        className="fixed z-[100] bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:w-96 flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        role="status"
      >
        {toasts.map((toast) => {
          const style = STYLES[toast.kind];
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-white/95 backdrop-blur shadow-elevated ring-1 ${style.ring} animate-fade-up`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${style.iconClass}`} />
              <p className="flex-1 text-sm text-brand-navy leading-snug">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="p-0.5 rounded-md text-slate-400 hover:text-slate-700 transition"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

export const useConfirm = (): ConfirmFn => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ToastProvider');
  return ctx;
};
