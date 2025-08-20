'use client';

import { Snackbar, Alert, AlertTitle } from '@mui/material';
import { create } from 'zustand';

interface Toast {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    
    // Auto remove after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, toast.duration || 5000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export function Toaster() {
  const { toasts, removeToast } = useToast();

  return (
    <>
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open={true}
          autoHideDuration={toast.duration || 5000}
          onClose={() => removeToast(toast.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          style={{ bottom: `${(index * 80) + 24}px` }}
        >
          <Alert
            onClose={() => removeToast(toast.id)}
            severity={toast.type}
            sx={{ width: '100%' }}
          >
            {toast.title && <AlertTitle>{toast.title}</AlertTitle>}
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
}