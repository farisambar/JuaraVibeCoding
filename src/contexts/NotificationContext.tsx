import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Bell, BellOff, Info, CheckCircle, AlertTriangle, Sparkles, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'reminder';
  duration?: number;
}

interface NotificationContextValue {
  hasNotificationSupport: boolean;
  permission: NotificationPermission | 'unsupported' | 'sandboxed';
  requestPermission: () => Promise<boolean>;
  sendNotification: (title: string, body: string, type?: ToastMessage['type']) => void;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported' | 'sandboxed'>('default');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const hasNotificationSupport = typeof window !== 'undefined' && 'Notification' in window;

  // Initialize permission state
  useEffect(() => {
    if (!hasNotificationSupport) {
      setPermission('unsupported');
      return;
    }

    try {
      // Check current browser permission status
      setPermission(Notification.permission);
    } catch (e) {
      // The browser might block permission checks inside sandboxed frames
      setPermission('sandboxed');
    }
  }, [hasNotificationSupport]);

  // Request browser Notification permissions
  const requestPermission = async (): Promise<boolean> => {
    if (!hasNotificationSupport) {
      addLocalToast('Browser Tidak Mendukung', 'Web Notification API tidak didukung di browser ini.', 'warning');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        addLocalToast('Notifikasi Diaktifkan!', 'Kamu akan menerima update deadline melalui notifikasi browser.', 'success');
        return true;
      } else {
        addLocalToast('Izin Ditolak', 'Izin notifikasi tidak diberikan oleh browser.', 'warning');
        return false;
      }
    } catch (error) {
      console.warn("Notification request permission blocked inside iframe/sandbox:", error);
      setPermission('sandboxed');
      addLocalToast(
        'Sandbox Mode Active', 
        'Browser membatasi notifikasi native di dalam iframe. Tenang, notifikasi in-app tetap aktif!', 
        'info'
      );
      return false;
    }
  };

  // Helper to add in-app toast
  const addLocalToast = (title: string, body: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, title, body, type };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 6000);
  };

  // Dismiss a specific toast
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Main notification sender
  const sendNotification = (title: string, body: string, type: ToastMessage['type'] = 'info') => {
    // 1. Try sending Native Browser Notification
    let nativeSent = false;
    if (hasNotificationSupport && permission === 'granted') {
      try {
        const options = {
          body,
          icon: '/favicon.ico',
          tag: 'time-deadline-reminder',
        };
        new Notification(title, options);
        nativeSent = true;
      } catch (err) {
        console.error("Failed to trigger native notification (maybe sandboxed):", err);
      }
    }

    // 2. Always show elegant in-app toast notification as part of rich UX
    addLocalToast(title, body, type);
  };

  return (
    <NotificationContext.Provider
      value={{
        hasNotificationSupport,
        permission,
        requestPermission,
        sendNotification,
        toasts,
        dismissToast,
      }}
    >
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-[120] flex flex-col gap-3 max-w-sm w-full pointer-events-none p-4">
        {toasts.map((toast) => {
          // Icon selector
          const Icon = {
            info: Info,
            success: CheckCircle,
            warning: AlertTriangle,
            reminder: Bell,
          }[toast.type];

          // Colors
          const colorClasses = {
            info: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
            success: 'bg-green-500/10 border-green-500/20 text-green-500',
            warning: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
            reminder: 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400',
          }[toast.type];

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-xl border bg-card/95 backdrop-blur-md shadow-2xl pointer-events-auto transform animate-in slide-in-from-bottom-5 duration-200 border-border ${colorClasses}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                <Icon className="w-5 h-5 shrink-0" />
              </div>
              <div className="flex-1 space-y-0.5">
                <h4 className="text-xs font-bold text-foreground leading-none">{toast.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-tight">{toast.body}</p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-muted-foreground hover:text-foreground transition-all ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
