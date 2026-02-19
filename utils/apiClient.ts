/**
 * API Client - Utility for making authenticated HTTP requests
 * 
 * Automatically includes access token in Authorization header
 * Handles 401 errors by refreshing token and retrying
 * 
 * @usage
 * import { apiClient } from '@/utils/apiClient';
 * 
 * // GET request
 * const users = await apiClient.get('/api/users');
 * 
 * // POST request
 * const post = await apiClient.post('/api/posts', { caption: 'Hello' });
 * 
 * // DELETE with auth
 * await apiClient.delete('/api/admin/users/123');
 */

import { storage } from './storage';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  onUnauthorized?: () => Promise<void>;
  onForbidden?: () => void;
}

class APIClient {
  private baseUrl: string;
  private timeout: number;
  private onUnauthorized?: () => Promise<void>;
  private onForbidden?: () => void;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || '';
    this.timeout = config.timeout || 30000;
    this.onUnauthorized = config.onUnauthorized;
    this.onForbidden = config.onForbidden;
  }

  /**
   * Get access token from storage
   */
  private async getAccessToken(): Promise<string | null> {
    return await storage.getItem('accessToken');
  }

  /**
   * Set access token in storage
   */
  private async setAccessToken(token: string): Promise<void> {
    await storage.setItem('accessToken', token);
  }

  /**
   * Clear access token
   */
  private async clearAccessToken(): Promise<void> {
    await storage.removeItem('accessToken');
  }

  /**
   * Make HTTP request with auth token
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    options?: {
      body?: any;
      headers?: Record<string, string>;
      retry?: boolean;
    }
  ): Promise<ApiResponse<T>> {
    const token = await this.getAccessToken();
    const url = this.baseUrl + path;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const requestOptions: RequestInit = {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(this.timeout),
    };

    try {
      const response = await fetch(url, requestOptions);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        if (this.onUnauthorized && options?.retry !== false) {
          // Try to refresh token
          await this.onUnauthorized();
          // Retry with new token
          return this.request<T>(method, path, { ...options, retry: false });
        }
        await this.clearAccessToken();
        throw new Error('Unauthorized');
      }

      // Handle 403 Forbidden
      if (response.status === 403) {
        if (this.onForbidden) {
          this.onForbidden();
        }
        throw new Error('Forbidden: Insufficient permissions');
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      // Parse response
      const data = await response.json();
      return data as ApiResponse<T>;
    } catch (error: any) {
      // Handle network errors
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(path: string, headers?: Record<string, string>): Promise<T> {
    const response = await this.request<T>('GET', path, { headers });
    if (!response.success) {
      throw new Error(response.error?.message || 'Request failed');
    }
    return response.data as T;
  }

  /**
   * POST request
   */
  async post<T>(
    path: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const response = await this.request<T>('POST', path, { body, headers });
    if (!response.success) {
      throw new Error(response.error?.message || 'Request failed');
    }
    return response.data as T;
  }

  /**
   * PUT request
   */
  async put<T>(
    path: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const response = await this.request<T>('PUT', path, { body, headers });
    if (!response.success) {
      throw new Error(response.error?.message || 'Request failed');
    }
    return response.data as T;
  }

  /**
   * PATCH request
   */
  async patch<T>(
    path: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const response = await this.request<T>('PATCH', path, { body, headers });
    if (!response.success) {
      throw new Error(response.error?.message || 'Request failed');
    }
    return response.data as T;
  }

  /**
   * DELETE request
   */
  async delete<T>(path: string, headers?: Record<string, string>): Promise<T> {
    const response = await this.request<T>('DELETE', path, { headers });
    if (!response.success) {
      throw new Error(response.error?.message || 'Request failed');
    }
    return response.data as T;
  }

  /**
   * Set custom unauthorized handler
   */
  setUnauthorizedHandler(handler: () => Promise<void>): void {
    this.onUnauthorized = handler;
  }

  /**
   * Set custom forbidden handler
   */
  setForbiddenHandler(handler: () => void): void {
    this.onForbidden = handler;
  }
}

// Export singleton instance
export const apiClient = new APIClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
});

export type { ApiResponse, ApiClientConfig };
