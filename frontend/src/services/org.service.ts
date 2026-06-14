/**
 * Organization (Service Provider) API
 */
import api from '@/lib/api';

export const orgService = {
  register: (data: { name: string; email: string; password: string; type?: string }) =>
    api.post('/org/register', data),

  login: (data: { email: string; password: string }) => api.post('/org/login', data),
};

