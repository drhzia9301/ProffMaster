/**
 * Version Service
 * 
 * Checks app version against server-side minimum version requirement.
 * This enables forcing updates for APK users who wouldn't get automatic updates.
 */

import { supabase } from './supabase';
import { APP_VERSION, isVersionAtLeast } from '../constants';

export interface VersionCheckResult {
    needsUpdate: boolean;
    minimumVersion: string;
    currentVersion: string;
    message?: string;
}

class VersionService {
    private cachedMinVersion: string | null = null;
    private lastCheck: number = 0;
    private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    /**
     * Check if the current app version meets the minimum requirement from the server
     */
    async checkVersion(): Promise<VersionCheckResult> {
        try {
            // Use cached value if recent
            const now = Date.now();
            if (this.cachedMinVersion && (now - this.lastCheck) < this.CACHE_DURATION) {
                return this.buildResult(this.cachedMinVersion);
            }

            // Fetch minimum version from Supabase
            const { data, error } = await supabase
                .from('app_config')
                .select('key, value')
                .in('key', ['minimum_version', 'force_update_message']);

            if (error) {
                console.error('Failed to fetch version config:', error);
                // On error, don't block the user - return no update needed
                return {
                    needsUpdate: false,
                    minimumVersion: APP_VERSION,
                    currentVersion: APP_VERSION
                };
            }

            const config: Record<string, string> = {};
            data?.forEach(row => {
                config[row.key] = row.value;
            });

            const minimumVersion = config['minimum_version'] || APP_VERSION;
            const message = config['force_update_message'];

            // Cache the result
            this.cachedMinVersion = minimumVersion;
            this.lastCheck = now;

            return this.buildResult(minimumVersion, message);
        } catch (e) {
            console.error('Version check error:', e);
            return {
                needsUpdate: false,
                minimumVersion: APP_VERSION,
                currentVersion: APP_VERSION
            };
        }
    }

    private buildResult(minimumVersion: string, message?: string): VersionCheckResult {
        const needsUpdate = !isVersionAtLeast(APP_VERSION, minimumVersion);
        
        return {
            needsUpdate,
            minimumVersion,
            currentVersion: APP_VERSION,
            message: needsUpdate ? message : undefined
        };
    }

    /**
     * Clear cached version to force a fresh check
     */
    clearCache() {
        this.cachedMinVersion = null;
        this.lastCheck = 0;
    }
}

export const versionService = new VersionService();
