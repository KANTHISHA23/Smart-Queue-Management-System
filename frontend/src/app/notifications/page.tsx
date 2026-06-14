'use client';

/**
 * Notifications Page
 */
import React, { useState, useEffect } from 'react';
import { notificationService } from '@/services/notification.service';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Bell, CheckCheck, Check, Info, AlertTriangle, Ticket, Radio } from 'lucide-react';
import { format } from 'date-fns';

const typeIcons: Record<string, React.ReactNode> = {
  success: <Ticket size={18} className="text-green-600" />,
  info: <Info size={18} className="text-blue-600" />,
  warning: <AlertTriangle size={18} className="text-amber-600" />,
  turn_approaching: <Radio size={18} className="text-orange-600" />,
  turn_called: <Bell size={18} className="text-green-600" />,
  queue_update: <Radio size={18} className="text-blue-600" />,
};

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getAll({ page: 1 });
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchNotifications();
  }, [isAuthenticated]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (error) { /* ignore */ }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (error) { /* ignore */ }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
          <Link href="/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-light)] pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--secondary)]">Notifications</h1>
            <p className="text-sm text-[var(--text-muted)]">{unreadCount} unread</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn-secondary text-sm !py-2">
              <CheckCheck size={16} /> Mark All Read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-20" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="card-static text-center py-16">
            <Bell size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[var(--secondary)]">No Notifications</h3>
            <p className="text-[var(--text-secondary)]">You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`card-static flex items-start gap-3 !py-4 cursor-pointer transition-colors ${
                  !n.is_read ? 'bg-blue-50/50 border-blue-100' : ''
                }`}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
              >
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                  {typeIcons[n.type] || <Info size={18} className="text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-[var(--secondary)]">{n.title}</h3>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">{n.message}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {format(new Date(n.created_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
