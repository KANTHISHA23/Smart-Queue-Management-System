/**
 * Organization-scoped analytics API (provider's queues only).
 */
import api from '@/lib/api';

export const orgAnalyticsService = {
  getDashboard: () => api.get('/org/analytics/dashboard'),

  getDaily: (days?: number) => api.get('/org/analytics/daily', { params: { days } }),

  getWaitTimes: () => api.get('/org/analytics/wait-times'),

  getHourly: () => api.get('/org/analytics/hourly'),
};
