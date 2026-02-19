import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Storage utility that works on both native and web.
 * Uses expo-secure-store on native for security, and localStorage on web.
 */
export const storage = {
    async setItem(key: string, value: string): Promise<void> {
        if (Platform.OS === 'web') {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, value);
            }
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    },

    async getItem(key: string): Promise<string | null> {
        if (Platform.OS === 'web') {
            if (typeof localStorage !== 'undefined') {
                return localStorage.getItem(key);
            }
            return null;
        } else {
            return await SecureStore.getItemAsync(key);
        }
    },

    async removeItem(key: string): Promise<void> {
        if (Platform.OS === 'web') {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(key);
            }
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    },

    // Synchronous versions for web only (use with caution or avoid)
    getItemSync(key: string): string | null {
        if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
            return localStorage.getItem(key);
        }
        // Note: SecureStore doesn't have a sync getter that's reliable across platforms
        return null;
    }
};
