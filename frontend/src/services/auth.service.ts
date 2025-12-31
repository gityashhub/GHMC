import apiClient, { ApiResponse } from '@/lib/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

/**
 * Authentication Service
 */
class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    return response.data.data;
  }

  /**
   * Get current user
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data.data.user;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await apiClient.put<ApiResponse<{ user: User }>>('/auth/profile', data);
    return response.data.data.user;
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    await apiClient.put<ApiResponse<void>>('/auth/password', data);
  }

  /**
   * Logout (client-side only - token removal)
   */
  async logout(): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/auth/logout');
  }

  /**
   * Store token and user in localStorage
   */
  setAuth(token: string, user: User): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Get stored user
   */
  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Clear auth data
   */
  clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export default new AuthService();

