/**
 * Authentication Utilities
 * Handles user registration and login with secure password handling
 * 
 * IMPORTANT: This is designed to work with a backend API.
 * Password hashing must happen on the server, not the client.
 */

import { getEnv } from '@/utils/envValidator';

/**
 * Authentication error codes for consistent error handling
 */
export enum AuthError {
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  USER_EXISTS = 'USER_EXISTS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  WRONG_PASSWORD = 'WRONG_PASSWORD',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  INVALID_SESSION = 'INVALID_SESSION',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
}

/**
 * Authentication response structure
 * Maintains consistent API format
 */
export interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: AuthError;
    message: string;
  };
}

/**
 * User authentication data (for login/registration)
 */
export interface AuthCredentials {
  email: string;
  password: string;
}

/**
 * User session data (login response)
 * 
 * After login:
 * - accessToken: Stored in memory, used for API requests (15 min expiry)
 * - refreshToken: Stored in HTTP-only cookies by backend (7 day expiry)
 * - userId: User identifier
 * - email: User email address
 */
export interface UserSession {
  userId: string;
  email: string;
  accessToken: string;        // Short-lived (15m), send in Authorization header
  expiresIn: number;          // Token lifetime in seconds (usually 900 = 15m)
  // Note: refreshToken NOT returned to client (stored in httpOnly cookie)
}

/**
 * Validate email format
 * 
 * @param email - Email to validate
 * @returns boolean - True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password requirements
 * 
 * @param password - Password to validate
 * @returns object with validation result and errors
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password || password.length === 0) {
    errors.push('Password is required');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  } else if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Register a new user
 * 
 * IMPORTANT: This function sends the password over HTTPS to the server.
 * The server MUST hash the password using argon2 before storing.
 * Never store plain text passwords.
 * 
 * @param credentials - Email and password
 * @returns Promise with auth response
 * 
 * @example
 * const response = await register({ email: 'user@example.com', password: 'SecurePass123!' });
 * if (response.success) {
 *   console.log('User registered:', response.data.userId);
 * } else {
 *   console.error('Registration failed:', response.error.message);
 * }
 */
export async function register(
  credentials: AuthCredentials
): Promise<AuthResponse<{ userId: string; email: string }>> {
  try {
    // Validate inputs
    if (!credentials.email || !credentials.password) {
      return {
        success: false,
        error: {
          code: AuthError.INVALID_EMAIL,
          message: 'Email and password are required',
        },
      };
    }

    // Validate email format
    if (!isValidEmail(credentials.email)) {
      return {
        success: false,
        error: {
          code: AuthError.INVALID_EMAIL,
          message: 'Please enter a valid email address',
        },
      };
    }

    // Validate password
    const passwordValidation = validatePassword(credentials.password);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: {
          code: AuthError.WEAK_PASSWORD,
          message: passwordValidation.errors[0],
        },
      };
    }

    // Send registration request to server
    const apiBaseUrl = getEnv('apiBaseUrl') as string;
    const response = await fetch(`${apiBaseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
      }),
    });

    // Handle network errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle specific error codes from server
      if (response.status === 409) {
        return {
          success: false,
          error: {
            code: AuthError.USER_EXISTS,
            message: 'This email is already registered',
          },
        };
      }

      if (response.status === 400) {
        return {
          success: false,
          error: {
            code: AuthError.INVALID_PASSWORD,
            message: errorData.message || 'Invalid registration data',
          },
        };
      }

      if (response.status >= 500) {
        return {
          success: false,
          error: {
            code: AuthError.SERVER_ERROR,
            message: 'Server error. Please try again later',
          },
        };
      }

      return {
        success: false,
        error: {
          code: AuthError.SERVER_ERROR,
          message: errorData.message || 'Registration failed',
        },
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        userId: data.userId,
        email: data.email,
      },
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: {
        code: AuthError.NETWORK_ERROR,
        message: 'Network error. Please check your connection',
      },
    };
  }
}

/**
 * Log in a user
 * 
 * IMPORTANT: This function sends the password over HTTPS to the server.
 * The server verifies the password against the stored hash using argon2.
 * 
 * @param credentials - Email and password
 * @returns Promise with auth response including session token
 * 
 * @example
 * const response = await login({ email: 'user@example.com', password: 'SecurePass123!' });
 * if (response.success) {
 *   localStorage.setItem('token', response.data.token);
 * } else {
 *   console.error('Login failed:', response.error.message);
 * }
 */
export async function login(
  credentials: AuthCredentials
): Promise<AuthResponse<UserSession>> {
  try {
    // Validate inputs
    if (!credentials.email || !credentials.password) {
      return {
        success: false,
        error: {
          code: AuthError.INVALID_EMAIL,
          message: 'Email and password are required',
        },
      };
    }

    // Validate email format
    if (!isValidEmail(credentials.email)) {
      return {
        success: false,
        error: {
          code: AuthError.INVALID_EMAIL,
          message: 'Please enter a valid email address',
        },
      };
    }

    // Send login request to server
    const apiBaseUrl = getEnv('apiBaseUrl') as string;
    const response = await fetch(`${apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
      }),
    });

    // Handle network errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle specific error codes from server
      if (response.status === 401) {
        return {
          success: false,
          error: {
            code: AuthError.WRONG_PASSWORD,
            message: 'Invalid email or password',
          },
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          error: {
            code: AuthError.USER_NOT_FOUND,
            message: 'User not found',
          },
        };
      }

      if (response.status >= 500) {
        return {
          success: false,
          error: {
            code: AuthError.SERVER_ERROR,
            message: 'Server error. Please try again later',
          },
        };
      }

      return {
        success: false,
        error: {
          code: AuthError.SERVER_ERROR,
          message: errorData.message || 'Login failed',
        },
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        userId: data.userId,
        email: data.email,
        accessToken: data.accessToken,  // Short-lived JWT (15 min)
        expiresIn: data.expiresIn,      // Token lifetime in seconds
        // Note: refreshToken is in httpOnly cookie (not accessible to client)
      },
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: {
        code: AuthError.NETWORK_ERROR,
        message: 'Network error. Please check your connection',
      },
    };
  }
}

/**
 * Log out user and revoke tokens
 * 
 * FLOW:
 * 1. POST /auth/logout with current access token
 * 2. Server: Add tokens to revocation blacklist
 * 3. Server: Clear httpOnly refresh token cookie
 * 4. Client: Clear access token from memory
 * 
 * @param accessToken - Current access token
 * @returns Promise with logout result
 * 
 * @example
 * const response = await logout(getAccessToken());
 * if (response.success) {
 *   removeAuthState();
 *   navigate('/login');
 * }
 */
export async function logout(accessToken: string): Promise<AuthResponse<void>> {
  try {
    if (!accessToken) {
      return {
        success: false,
        error: {
          code: AuthError.INVALID_SESSION,
          message: 'No session to log out from',
        },
      };
    }

    const apiBaseUrl = getEnv('apiBaseUrl') as string;
    
    try {
      // Notify server to revoke tokens
      await fetch(`${apiBaseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include', // Include cookies (for refresh token)
      });
    } catch (error) {
      console.error('Server logout error:', error);
      // Continue with local logout even if server fails
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: {
        code: AuthError.SERVER_ERROR,
        message: 'Logout failed',
      },
    };
  }
}

/**
 * Verify a JWT access token is still valid
 * Calls /auth/verify endpoint to validate server-side
 * 
 * @param accessToken - JWT access token to verify
 * @returns Promise with verification result
 */
export async function verifyToken(accessToken: string): Promise<AuthResponse<{ userId: string }>> {
  try {
    if (!accessToken) {
      return {
        success: false,
        error: {
          code: AuthError.INVALID_SESSION,
          message: 'No session token found',
        },
      };
    }

    const apiBaseUrl = getEnv('apiBaseUrl') as string;
    const response = await fetch(`${apiBaseUrl}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: {
            code: AuthError.TOKEN_EXPIRED,
            message: 'Session expired. Please log in again',
          },
        };
      }

      return {
        success: false,
        error: {
          code: AuthError.INVALID_SESSION,
          message: 'Invalid session',
        },
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        userId: data.userId,
      },
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return {
      success: false,
      error: {
        code: AuthError.NETWORK_ERROR,
        message: 'Network error',
      },
    };
  }
}

/**
 * IMPORTANT SECURITY NOTES
 * 
 * 1. Password Transmission:
 *    - Passwords are sent over HTTPS only
 *    - Server must use TLS 1.2 or higher
 *    - Never send passwords in query parameters
 *    - Use POST with JSON body for password data
 * 
 * 2. Server-side Requirements:
 *    - Hash passwords with argon2 before storing
 *    - Never log plain text passwords
 *    - Verify passwords using argon2.verify()
 *    - Implement rate limiting (e.g., 5 attempts per 15 minutes)
 *    - Add account lockout after failed attempts
 * 
 * 3. Token Management:
 *    - Use JWT with expiration times
 *    - Store tokens securely on client
 *    - Implement token refresh mechanism
 *    - Clear tokens on logout
 * 
 * 4. Client-side Best Practices:
 *    - Never store passwords in state or local storage
 *    - Clear password fields after submission
 *    - Use HTTPS for all API calls
 *    - Validate input before sending
 *    - Implement retry logic with exponential backoff
 * 
 * 5. Error Messages:
 *    - Don't reveal whether email exists (prevents account enumeration)
 *    - Use generic "Invalid email or password" message
 *    - Log actual error details on server for debugging
 */
