'use client';

import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type Toast = {
  id: number;
  message: string;
  variant: 'error' | 'warning';
};

type ToastOptions = {
  durationMs?: number;
  variant?: Toast['variant'];
};

type ToastContextValue = {
  pushToast: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef(new Map<number, number>());

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    (message: string, options?: ToastOptions) => {
      const id = (idRef.current += 1);
      const durationMs = options?.durationMs ?? 2400;
      const variant = options?.variant ?? 'error';
      setToasts((prev) => [...prev, { id, message, variant }]);
      const timer = window.setTimeout(() => removeToast(id), durationMs);
      timersRef.current.set(id, timer);
    },
    [removeToast],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div
        className="pointer-events-none fixed left-1/2 top-20 z-[999] w-full max-w-[600px] -translate-x-1/2 px-2.5"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-end gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto animate-fade-in rounded-2xl border px-3 py-2 text-[13px] shadow-[0_8px_24px_rgba(0,0,0,0.15)] ${
                toast.variant === 'warning'
                  ? 'border-[#e6cf8b] bg-[#fff2c8] text-[#8a6a00]'
                  : 'border-[#e3b7b7] bg-[#f3d7d7] text-[#b14a4a]'
              }`}
            >
              <div className="flex min-w-[240px] max-w-[360px] items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      toast.variant === 'warning' ? 'border-[#8a6a00]' : 'border-[#b14a4a]'
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={toast.variant === 'warning' ? '#8a6a00' : '#b14a4a'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M7.5 7.5l9 9" />
                    </svg>
                  </span>
                  <span className="font-semibold">
                    {toast.variant === 'warning' ? 'Warning:' : 'Error:'}
                  </span>
                  <span
                    className={toast.variant === 'warning' ? 'text-[#8a6a00]' : 'text-[#b14a4a]'}
                  >
                    {toast.message}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className={`pointer-events-auto opacity-70 transition hover:opacity-100 ${
                    toast.variant === 'warning' ? 'text-[#8a6a00]' : 'text-[#b14a4a]'
                  }`}
                  aria-label="닫기"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M6 6l12 12M18 6l-12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
