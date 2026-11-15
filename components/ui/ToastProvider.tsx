'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

type ToastOptions = {
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

type Toast = {
  id: number;
  message: string;
  type: ToastType;
  action?: ToastOptions['action'];
};

type ToastContextValue = {
  notify: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toastStyles = {
  success: {
    Icon: CheckCircle2,
    icon: 'text-emerald-600',
  },
  error: {
    Icon: AlertCircle,
    icon: 'text-rose-600',
  },
  info: {
    Icon: Info,
    icon: 'text-sky-600',
  },
} satisfies Record<ToastType, { Icon: typeof Info; icon: string }>;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message: string, options: ToastOptions = {}) => {
    const id = ++nextId.current;
    const type = options.type ?? 'info';
    setToasts((current) => [...current, { id, message, type, action: options.action }]);

    if (options.duration !== 0) {
      const timer = window.setTimeout(() => dismiss(id), options.duration ?? 4_500);
      timers.current.set(id, timer);
    }
  }, [dismiss]);

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    },
    []
  );

  const contextValue = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        aria-label="Thông báo"
        className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+4.5rem)] z-[100] flex w-auto max-w-none flex-col gap-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-[calc(100vw-2rem)] sm:max-w-sm"
      >
        {toasts.map((toast) => {
          const { Icon, icon } = toastStyles[toast.type];

          return (
            <div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-xl shadow-slate-950/10"
            >
              <Icon size={20} className={`mt-0.5 shrink-0 ${icon}`} />
              <p className="min-w-0 flex-1 leading-5">{toast.message}</p>
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    dismiss(toast.id);
                    toast.action?.onClick();
                  }}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  {toast.action.label}
                </button>
              )}
              <button
                type="button"
                aria-label="Đóng thông báo"
                onClick={() => dismiss(toast.id)}
                className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast phải được dùng bên trong ToastProvider.');
  return context.notify;
}
