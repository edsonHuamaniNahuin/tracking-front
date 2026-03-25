import type { LoginResponse, LoginRequest } from '@/types/auth';
import api from './api';
import type { User } from '@/types/user';


export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  refreshToken: async (): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/refresh');
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await api.post<User>('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};