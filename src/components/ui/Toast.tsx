import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

const config = {
  success: { icon: CheckCircle2, bg: 'bg-brand-50', border: 'border-brand-200', text: 'text-brand-800' },
  error: { icon: AlertCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
};

export function Toast({ toasts, onDismiss }: ToastProps) {
  useEffect(() => {
    const timers = toasts.map((t) =>
      setTimeout(() => onDismiss(t.id), 4000),
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => {
        const c = config[toast.type];
        const Icon = c.icon;
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 ${c.bg} ${c.border} ${c.text} border rounded-xl px-4 py-3 shadow-lg animate-slide-up`}
          >
            <Icon size={20} className="flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
