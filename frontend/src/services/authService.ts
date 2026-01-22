import api from '../lib/api';
import { AuthResponse, LoginCredentials, RegisterData, User } from '../types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  async refreshToken(): Promise<{ accessToken: string }> {
    const response = await api.post<{ accessToken: string }>('/auth/refresh');
    return response.data;
  },
};
