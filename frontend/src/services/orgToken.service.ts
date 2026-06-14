/**
 * Organization-scoped token management API
 */
import api from '@/lib/api';

export const orgTokenService = {
  getQueueTokens: (queueId: number, status?: string) =>
    api.get(`/org/queues/${queueId}/tokens`, { params: { status } }),

  callNext: (queueId: number) => api.put(`/org/queues/${queueId}/call-next`),

  skip: (tokenId: number) => api.put(`/org/tokens/${tokenId}/skip`),

  complete: (tokenId: number) => api.put(`/org/tokens/${tokenId}/complete`),

  setPriority: (tokenId: number, priority_level: string, priority_reason?: string) =>
    api.put(`/org/tokens/${tokenId}/priority`, { priority_level, priority_reason }),

  getUsers: () => api.get('/org/users'),
};

