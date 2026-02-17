/**
 * App Initialization
 * This module should be imported at the very start of your app
 * to ensure environment variables are loaded and validated
 */

import 'dotenv/config';
import { envValidator } from '@/utils/envValidator';

/**
 * Initialize the app
 * Validates environment variables and logs initialization status
 */
export function initializeApp() {
  try {
    console.log('🚀 Initializing app...');

    // Validate environment variables
    const env = envValidator.validate();

    console.log('✓ Environment variables validated');
    console.log(`✓ Running in ${env.nodeEnv} mode`);

    // Log initialization summary
    if (envValidator.isDevelopment()) {
      console.log('📝 Development mode - Additional logging enabled');
    } else if (envValidator.isProduction()) {
      console.log('🔒 Production mode - Strict error handling enabled');
    }

    console.log('✓ App initialization complete\n');

    return true;
  } catch (error) {
    console.error('✗ App initialization failed:\n', error);

    // In production, you might want to show an error screen
    if (!__DEV__) {
      // Return false to indicate failure
      return false;
    }

    // In development, allow app to continue but with warnings
    console.warn('⚠️  Continuing in development mode despite configuration issues');
    return true;
  }
}

/**
 * Optional: Check if app is properly initialized
 */
export function isAppInitialized(): boolean {
  try {
    envValidator.validate();
    return true;
  } catch {
    return false;
  }
}
