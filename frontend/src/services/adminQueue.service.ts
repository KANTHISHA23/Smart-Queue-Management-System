/**
 * Admin Queue Governance API
 * Used by admin dashboard to view all queues and activate/deactivate them.
 */
import api from '@/lib/api';

export const adminQueueService = {
  /** Get all queues (all statuses) with organization and location info */
  getAll: () => api.get('/admin/queues'),

  /** Activate a queue (set status = active) */
  activate: (id: number) => api.post(`/admin/queues/${id}/activate`),

  /** Deactivate a queue (set status = inactive) */
  deactivate: (id: number) => api.post(`/admin/queues/${id}/deactivate`),
};
