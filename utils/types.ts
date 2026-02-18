// utils/types.ts

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

export interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: AuthError | string;
    message: string;
  };
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface UserSession {
  userId: string;
  email: string;
  accessToken: string;
  expiresIn: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

export interface TokenResponse {
  success: boolean;
  data?: TokenPair;
  error?: {
    code: string;
    message: string;
  };
}
