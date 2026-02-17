/**
 * Environment variable validation utility
 * Ensures required environment variables are set at app startup
 */

interface EnvironmentVariables {
  supabaseUrl: string;
  supabaseAnonKey: string;
  jwtSecret: string;
  apiBaseUrl: string;
  apiTimeout: number;
  nodeEnv: 'development' | 'staging' | 'production';
}

class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private env: EnvironmentVariables | null = null;
  private validationErrors: string[] = [];

  private constructor() {}

  static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  /**
   * Validates all required environment variables
   * Throws an error if any required variables are missing or invalid
   */
  validate(): EnvironmentVariables {
    if (this.env) {
      return this.env;
    }

    this.validationErrors = [];
    const errors: string[] = [];

    // Check Supabase URL
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your_supabase')) {
      errors.push(
        'EXPO_PUBLIC_SUPABASE_URL is not configured. Please set it in your .env file.'
      );
    }

    // Check Supabase Anon Key
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseAnonKey || supabaseAnonKey.includes('your_supabase')) {
      errors.push(
        'EXPO_PUBLIC_SUPABASE_ANON_KEY is not configured. Please set it in your .env file.'
      );
    }

    // Check JWT Secret
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.includes('your_jwt_secret')) {
      errors.push(
        'JWT_SECRET is not configured. Please set it in your .env file. Generate a secure random string.'
      );
    }

    // Check API Base URL
    const apiBaseUrl = process.env.API_BASE_URL;
    if (!apiBaseUrl) {
      errors.push('API_BASE_URL is not configured. Please set it in your .env file.');
    }

    // Check Node Environment
    const nodeEnv = (process.env.NODE_ENV || 'development') as any;
    if (!['development', 'staging', 'production'].includes(nodeEnv)) {
      errors.push(
        `NODE_ENV must be one of: development, staging, production. Got: ${nodeEnv}`
      );
    }

    if (errors.length > 0) {
      this.validationErrors = errors;
      const errorMessage =
        'Environment Configuration Error:\n\n' +
        errors.map((e) => `• ${e}`).join('\n') +
        '\n\nPlease check your .env file and ensure all required variables are set.';

      throw new Error(errorMessage);
    }

    // Parse timeout as a number
    const apiTimeout = parseInt(process.env.API_TIMEOUT || '30000', 10);

    this.env = {
      supabaseUrl: supabaseUrl!,
      supabaseAnonKey: supabaseAnonKey!,
      jwtSecret: jwtSecret!,
      apiBaseUrl: apiBaseUrl!,
      apiTimeout,
      nodeEnv: nodeEnv as any,
    };

    return this.env;
  }

  /**
   * Gets a validated environment variable
   * Returns null if the variable is not available
   */
  get(key: keyof EnvironmentVariables): string | number | null {
    if (!this.env) {
      this.validate();
    }
    return this.env?.[key] ?? null;
  }

  /**
   * Gets all validated environment variables
   */
  getAll(): EnvironmentVariables {
    if (!this.env) {
      this.validate();
    }
    return this.env!;
  }

  /**
   * Checks if running in production environment
   */
  isProduction(): boolean {
    return this.get('nodeEnv') === 'production';
  }

  /**
   * Checks if running in development environment
   */
  isDevelopment(): boolean {
    return this.get('nodeEnv') === 'development';
  }
}

export const envValidator = EnvironmentValidator.getInstance();

/**
 * Helper function to get environment variables
 * Usage: const supabaseUrl = getEnv('supabaseUrl')
 */
export function getEnv(key: keyof EnvironmentVariables): string | number {
  const value = envValidator.get(key);
  if (value === null) {
    throw new Error(`Environment variable ${key} is not available`);
  }
  return value;
}

export default envValidator;
