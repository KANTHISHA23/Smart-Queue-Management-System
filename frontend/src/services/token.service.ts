/**
 * Token / booking API
 */
import api from '@/lib/api';

export const tokenService = {
  book: (data: { queue_id: number; notes?: string; priority_level?: string }) => api.post('/tokens/book', data),

  getMyTokens: () => api.get('/tokens/my'),

  getHistory: (params?: { page?: number; limit?: number }) =>
    api.get('/tokens/history', { params }),

  cancel: (id: number) => api.put(`/tokens/${id}/cancel`),

  getQueueTokens: (queueId: number, status?: string) =>
    api.get(`/tokens/queue/${queueId}`, { params: { status } }),

  callNext: (queueId: number) => api.put(`/tokens/call-next/${queueId}`),

  callToken: (id: number) => api.put(`/tokens/${id}/call`),

  serveToken: (id: number) => api.put(`/tokens/${id}/serve`),

  completeToken: (id: number) => api.put(`/tokens/${id}/complete`),

  skipToken: (id: number) => api.put(`/tokens/${id}/skip`),

  markMissed: (id: number) => api.put(`/tokens/${id}/miss`),

  rejoin: (id: number) => api.post(`/tokens/${id}/rejoin`),

  recall: (id: number) => api.post(`/tokens/${id}/recall`),

  setPriority: (id: number, data: { is_priority: boolean; priority_reason?: string }) =>
    api.put(`/tokens/${id}/priority`, data),
};
