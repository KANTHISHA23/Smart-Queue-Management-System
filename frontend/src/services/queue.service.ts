/**
 * Queue API
 */
import api from '@/lib/api';

export const queueService = {
  /** Get all active queues (user-facing — only status = 'active') */
  getActive: () => api.get('/queues'),

  getById: (id: number) => api.get(`/queues/${id}`),

  create: (data: Record<string, unknown>) => api.post('/queues', data),

  update: (id: number, data: Record<string, unknown>) => api.put(`/queues/${id}`, data),

  delete: (id: number) => api.delete(`/queues/${id}`),

  reset: (id: number) => api.put(`/queues/${id}/reset`),
};
