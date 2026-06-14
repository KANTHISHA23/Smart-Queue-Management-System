/**
 * In-app / push notification API
 */
import api from '@/lib/api';

export const notificationService = {
  getAll: (params?: { page?: number; unread_only?: string }) =>
    api.get('/notifications', { params }),

  markAsRead: (id: number) => api.put(`/notifications/${id}/read`),

  markAllAsRead: () => api.put('/notifications/read-all'),

  subscribe: (subscription: unknown) => api.post('/notifications/subscribe', { subscription }),
};
