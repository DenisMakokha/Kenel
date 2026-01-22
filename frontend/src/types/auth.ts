export enum UserRole {
  ADMIN = 'ADMIN',
  CREDIT_OFFICER = 'CREDIT_OFFICER',
  FINANCE_OFFICER = 'FINANCE_OFFICER',
  CLIENT = 'CLIENT',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePhoto?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}
