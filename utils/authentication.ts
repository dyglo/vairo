// utils/authentication.ts
import { getEnv } from '@/utils/envValidator';
import { AuthError, AuthResponse, AuthCredentials, UserSession } from './types';

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!password || password.length === 0) errors.push('Password is required');
  else if (password.length < 8) errors.push('Password must be at least 8 characters');
  else if (password.length > 128) errors.push('Password must not exceed 128 characters');

  return { isValid: errors.length === 0, errors };
}

/**
 * Register user
 */
export async function register(
  credentials: AuthCredentials
): Promise<AuthResponse<{ userId: string; email: string }>> {
  try {
    if (!credentials.email || !credentials.password) {
      return { success: false, error: { code: AuthError.INVALID_EMAIL, message: 'Email and password are required' } };
    }

    if (!isValidEmail(credentials.email)) {
      return { success: false, error: { code: AuthError.INVALID_EMAIL, message: 'Invalid email address' } };
    }

    const pwdValidation = validatePassword(credentials.password);
    if (!pwdValidation.isValid) {
      return { success: false, error: { code: AuthError.WEAK_PASSWORD, message: pwdValidation.errors[0] } };
    }

    const apiBaseUrl = getEnv('apiBaseUrl') as string;
    const response = await fetch(`${apiBaseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as any;

    if (!response.ok) {
      if (response.status === 409) return { success: false, error: { code: AuthError.USER_EXISTS, message: 'Email already registered' } };
      if (response.status === 400) return { success: false, error: { code: AuthError.INVALID_PASSWORD, message: data.message || 'Invalid registration data' } };
      return { success: false, error: { code: AuthError.SERVER_ERROR, message: data.message || 'Registration failed' } };
    }

    return { success: true, data: { userId: data.userId, email: data.email } };
  } catch (err) {
    console.error('Registration error:', err);
    return { success: false, error: { code: AuthError.NETWORK_ERROR, message: 'Network error' } };
  }
}

/**
 * Login user
 */
export async function login(credentials: AuthCredentials): Promise<AuthResponse<UserSession>> {
  try {
    if (!credentials.email || !credentials.password) {
      return { success: false, error: { code: AuthError.INVALID_EMAIL, message: 'Email and password required' } };
    }

    if (!isValidEmail(credentials.email)) {
      return { success: false, error: { code: AuthError.INVALID_EMAIL, message: 'Invalid email address' } };
    }

    const apiBaseUrl = getEnv('apiBaseUrl') as string;
    const response = await fetch(`${apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: credentials.email.toLowerCase().trim(), password: credentials.password }),
    });

    const data = (await response.json().catch(() => ({}))) as any;

    if (!response.ok) {
      if (response.status === 401) return { success: false, error: { code: AuthError.WRONG_PASSWORD, message: 'Invalid email or password' } };
      if (response.status === 404) return { success: false, error: { code: AuthError.USER_NOT_FOUND, message: 'User not found' } };
      return { success: false, error: { code: AuthError.SERVER_ERROR, message: data.message || 'Login failed' } };
    }

    return {
      success: true,
      data: {
        userId: data.userId,
        email: data.email,
        accessToken: data.accessToken,
        expiresIn: data.expiresIn,
      },
    };
  } catch (err) {
    console.error('Login error:', err);
    return { success: false, error: { code: AuthError.NETWORK_ERROR, message: 'Network error' } };
  }
}

export { AuthError, AuthResponse, AuthCredentials, UserSession };
