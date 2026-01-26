'use client';

import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type Toast = {
  id: number;
  message: string;
};

type ToastOptions = {
  durationMs?: number;
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
      setToasts((prev) => [...prev, { id, message }]);
      const timer = window.setTimeout(() => removeToast(id), durationMs);
      timersRef.current.set(id, timer);
    },
    [removeToast],
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[999] flex justify-center"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto animate-fade-in rounded-full bg-[var(--color-bg-toast)] px-4 py-2 text-sm text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
            >
              {toast.message}
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
