// utils/tokenManager.ts
import { getEnv } from '@/utils/envValidator';
import { TokenPair, JWTPayload, TokenResponse } from './types';

let currentAccessToken: string | null = null;

function base64Decode(str: string): string {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    if (typeof atob !== 'undefined') return atob(padded);
    return Buffer.from(padded, 'base64').toString('utf-8');
  } catch (err) {
    console.error('Base64 decode failed:', err);
    return '';
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64Decode(parts[1])) as JWTPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp - 5 <= now;
}

export function setAccessToken(token: string): void { currentAccessToken = token; }
export function getAccessToken(): string | null {
  if (!currentAccessToken || isTokenExpired(currentAccessToken)) { currentAccessToken = null; return null; }
  return currentAccessToken;
}
export function clearAccessToken(): void { currentAccessToken = null; }

export async function refreshAccessToken(): Promise<TokenResponse> {
  try {
    const apiBaseUrl = getEnv('apiBaseUrl') as string;
    const res = await fetch(`${apiBaseUrl}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
    const data = (await res.json().catch(() => ({}))) as { accessToken?: string; expiresIn?: number; message?: string };
    if (!res.ok) return { success: false, error: { code: res.status === 401 ? 'TOKEN_EXPIRED' : 'REFRESH_FAILED', message: data.message || 'Failed to refresh token' } };
    if (data.accessToken) setAccessToken(data.accessToken);
    return { success: true, data: { accessToken: data.accessToken!, expiresIn: data.expiresIn } };
  } catch (err) {
    console.error('Token refresh error:', err);
    return { success: false, error: { code: 'NETWORK_ERROR', message: 'Network error during token refresh' } };
  }
}

export async function ensureValidToken(): Promise<boolean> {
  const token = getAccessToken();
  if (!token) return false;
  if (!isTokenExpired(token)) return true;
  const refresh = await refreshAccessToken();
  return refresh.success;
}

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const valid = await ensureValidToken();
  if (!valid) throw new Error('Not authenticated. Please login first.');
  const token = getAccessToken();
  if (!token) throw new Error('No access token available');

  const headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
  const res = await fetch(url, { ...options, headers, credentials: 'include' });
  if (res.status === 401) { clearAccessToken(); throw new Error('Authentication failed. Please login again.'); }
  return res;
}

export async function logout(): Promise<boolean> {
  try {
    const token = getAccessToken();
    const apiBaseUrl = getEnv('apiBaseUrl') as string;
    clearAccessToken();
    if (token) {
      await fetch(`${apiBaseUrl}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, credentials: 'include' }).catch(console.error);
    }
    return true;
  } catch (err) { console.error('Logout error:', err); return false; }
}

export function isAuthenticated(): boolean { const token = getAccessToken(); return token !== null && !isTokenExpired(token); }

export function getCurrentUser(): { userId: string; email: string } | null {
  const token = getAccessToken();
  if (!token || isTokenExpired(token)) return null;
  const payload = decodeToken(token);
  if (!payload) return null;
  return { userId: payload.userId, email: payload.email };
}
