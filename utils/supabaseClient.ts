/**
 * Supabase client configuration
 * Initializes Supabase with environment variables
 */

import { createClient } from '@supabase/supabase-js';
import { envValidator } from '@/utils/envValidator';

let supabaseInstance: ReturnType<typeof createClient> | null = null;

/**
 * Initializes and returns the Supabase client
 * Environment variables are validated at initialization time
 */
export function initSupabase() {
  if (!supabaseInstance) {
    try {
      const supabaseUrl = envValidator.get('supabaseUrl') as string;
      const supabaseAnonKey = envValidator.get('supabaseAnonKey') as string;

      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });

      console.log('✓ Supabase client initialized successfully');
    } catch (error) {
      console.error('✗ Failed to initialize Supabase client:', error);
      throw error;
    }
  }

  return supabaseInstance;
}

/**
 * Gets the Supabase client instance
 * Make sure to call initSupabase() first
 */
export function getSupabaseClient() {
  if (!supabaseInstance) {
    throw new Error(
      'Supabase client not initialized. Call initSupabase() during app startup.'
    );
  }
  return supabaseInstance;
}

export default {
  initSupabase,
  getSupabaseClient,
};
