/**
 * Auth API — registration, login, profile
 */
import api from '@/lib/api';

export const authService = {
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) => api.post('/auth/login', data),

  getProfile: () => api.get('/auth/me'),

  updateProfile: (data: { name?: string; phone?: string }) => api.put('/auth/profile', data),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post('/auth/profile/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
