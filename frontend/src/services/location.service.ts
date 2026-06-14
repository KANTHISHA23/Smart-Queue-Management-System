/**
 * Locations API
 */
import api from '@/lib/api';

export const locationService = {
  getAll: (params?: { type?: string; city?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/locations', { params }),

  getById: (id: number) => api.get(`/locations/${id}`),

  create: (data: Record<string, unknown>) => api.post('/locations', data),

  update: (id: number, data: Record<string, unknown>) => api.put(`/locations/${id}`, data),

  delete: (id: number) => api.delete(`/locations/${id}`),
};
