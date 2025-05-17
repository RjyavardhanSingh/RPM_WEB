import { BaseApi } from './base-api';

// Types for auth requests/responses
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'DOCTOR' | 'PATIENT' | 'USER';
  };
}

export class AuthService extends BaseApi {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/login', data);
    
    // Store tokens in localStorage
    localStorage.setItem('jwt_token', response.data.accessToken);
    localStorage.setItem('refresh_token', response.data.refreshToken);
    
    return response.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/register', data);
    
    // Store tokens in localStorage
    localStorage.setItem('jwt_token', response.data.accessToken);
    localStorage.setItem('refresh_token', response.data.refreshToken);
    
    return response.data;
  }

  async logout(): Promise<void> {
    // Optional: Call logout endpoint if your backend requires it
    try {
      await this.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Remove tokens from localStorage
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('refresh_token');
    }
  }

  async getCurrentUser(): Promise<AuthResponse['user'] | null> {
    try {
      const response = await this.get<{user: AuthResponse['user']}>('/auth/me');
      return response.data.user;
    } catch (error) {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('jwt_token');
  }
}

// Create singleton instance
export const authService = new AuthService();