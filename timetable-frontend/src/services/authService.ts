/* authService.ts — Service for handling user authentication endpoints */

import api from './api';

export interface LoginRequest {
  username: string;
  password?: string;
}

export interface RegisterRequest {
  fullName: string;
  username: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'HOD' | 'FACULTY' | 'STUDENT';
  departmentId?: number | null;
}

export interface UpdateUserRequest {
  username: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'HOD' | 'FACULTY' | 'STUDENT';
  departmentId?: number | null;
  isActive: boolean;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  fullName: string;
  username: string;
  role: 'ADMIN' | 'HOD' | 'FACULTY' | 'STUDENT';
  departmentId: number | null;
}

export interface UserProfile {
  id: number;
  fullName: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'HOD' | 'FACULTY' | 'STUDENT';
  departmentId: number | null;
  isActive: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
}

const authService = {
  login: async (request: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', request);
    return response.data.data;
  },

  register: async (request: RegisterRequest): Promise<UserProfile> => {
    const response = await api.post('/auth/register', request);
    return response.data.data;
  },

  getMe: async (): Promise<UserProfile> => {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  getUsers: async (deptId?: number): Promise<UserProfile[]> => {
    const response = await api.get('/auth/users', { params: { deptId } });
    return response.data.data;
  },

  updateUser: async (id: number, request: UpdateUserRequest): Promise<UserProfile> => {
    const response = await api.put(`/auth/users/${id}`, request);
    return response.data.data;
  },

  changePassword: async (request: ChangePasswordRequest): Promise<void> => {
    await api.put('/auth/change-password', request);
  },
};

export default authService;
