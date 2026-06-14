/**
 * Organization-scoped queue management API
 * Providers can create, edit, delete, reset — but NOT activate/deactivate.
 */
import api from '@/lib/api';

export const orgQueueService = {
  listMine: () => api.get('/org/queues'),
  create: (data: Record<string, unknown>) => api.post('/org/queues', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/org/queues/${id}`, data),
  delete: (id: number) => api.delete(`/org/queues/${id}`),
  reset: (id: number) => api.put(`/org/queues/${id}/reset`),
};
