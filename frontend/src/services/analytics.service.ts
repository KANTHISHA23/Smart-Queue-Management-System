/**
 * Analytics API
 */
import api from '@/lib/api';

export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard'),

  getDaily: (days?: number) => api.get('/analytics/daily', { params: { days } }),

  getWaitTimes: () => api.get('/analytics/wait-times'),

  getHourly: () => api.get('/analytics/hourly'),

  getMlInsights: () => api.get('/analytics/ml-model'),
};
