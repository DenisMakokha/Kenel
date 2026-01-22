import api from '../lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'ADMIN' | 'CREDIT_OFFICER' | 'FINANCE_OFFICER' | 'CLIENT';
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: User['role'];
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: User['role'];
  isActive?: boolean;
}

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  async getUser(id: string): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  async updateUserStatus(id: string, isActive: boolean): Promise<User> {
    const response = await api.patch<User>(`/users/${id}/status`, { isActive });
    return response.data;
  },

  async createUser(data: CreateUserDto): Promise<User> {
    // Uses the register endpoint for creating new users
    const response = await api.post<{ user: User }>('/auth/register', data);
    return response.data.user;
  },

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    const response = await api.patch<User>(`/users/${id}`, data);
    return response.data;
  },
};
