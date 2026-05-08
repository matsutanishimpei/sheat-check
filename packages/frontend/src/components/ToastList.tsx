import React from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface ToastListProps {
  toasts: ToastMessage[];
}

export const ToastList: React.FC<ToastListProps> = React.memo(({ toasts }) => {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-message">{t.message}</span>
        </div>
      ))}
    </div>
  );
});

ToastList.displayName = 'ToastList';
