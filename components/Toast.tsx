
import React, { useEffect } from 'react';
import { Notification } from '../types';
import { CheckCircleIcon, XMarkIcon } from './Icons';

interface ToastProps {
  notifications: Notification[];
  removeNotification: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map((notification) => (
        <ToastItem 
            key={notification.id} 
            notification={notification} 
            onClose={() => removeNotification(notification.id)} 
        />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
  useEffect(() => {
    // If it's a WARNING, do NOT auto-close (Persistent)
    if (notification.type === 'WARNING') return;

    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose, notification.type]);

  const bgColors = {
    SUCCESS: 'bg-slate-800 border-emerald-500/50 text-emerald-400',
    ERROR: 'bg-slate-800 border-red-500/50 text-red-400',
    INFO: 'bg-slate-800 border-indigo-500/50 text-indigo-400',
    WARNING: 'bg-slate-800 border-amber-500/50 text-amber-400',
  };

  return (
    <div className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl animate-slideInRight ${bgColors[notification.type]}`}>
      {notification.type === 'SUCCESS' && <CheckCircleIcon className="w-5 h-5" />}
      {notification.type === 'WARNING' && (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
        </svg>
      )}
      <span className="text-sm font-medium text-slate-200">{notification.message}</span>
      <button onClick={onClose} className="ml-2 hover:bg-white/10 rounded p-1">
        <XMarkIcon className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  );
};

export default Toast;
