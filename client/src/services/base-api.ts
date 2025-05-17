import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getMockToken } from '@/lib/auth-utils';

/**
 * Base class for API services
 */
export class BaseApi {
  protected api: AxiosInstance;
  
  constructor() {
    // Create Axios instance with base URL
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    });
    
    // Add request interceptor to include auth token
    this.api.interceptors.request.use((config) => {
      const token = getMockToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    });
  }
}