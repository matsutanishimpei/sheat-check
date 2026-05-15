import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// ── Types ────────────────────────────────────────────────────────────
export type Toast = {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
};

interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
}

// ── Context ──────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast }}>
      {children}
    </ToastContext.Provider>
  );
};

// ── Hook ─────────────────────────────────────────────────────────────
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}
