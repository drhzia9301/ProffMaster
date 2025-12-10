/**
 * Version Block Service
 * 
 * Handles checking if a user's app version is blocked and updating their version.
 */

import { supabase } from './supabase';
import { APP_VERSION, isVersionAtLeast } from '../constants';

export interface VersionBlockResult {
    isBlocked: boolean;
    minimumVersion: string;
    message?: string;
    blockReason?: string;
}

class VersionBlockService {
    /**
     * Update the user's app version in their profile and unban if they were banned for old version
     */
    async updateUserAppVersion(userId: string): Promise<boolean> {
        try {
            // First, get the minimum version to check if user should be unbanned
            const { data: configData } = await supabase
                .from('app_config')
                .select('value')
                .eq('key', 'minimum_version')
                .single();

            const minimumVersion = configData?.value || '1.0.0';

            // Check if current app version meets minimum requirement
            const meetsRequirement = isVersionAtLeast(APP_VERSION, minimumVersion);

            // Update app_version and unban if version is now valid
            const updateData: any = {
                app_version: APP_VERSION,
                last_version_check: new Date().toISOString()
            };

            // If user meets version requirement, unban them (they may have been banned for old version)
            if (meetsRequirement) {
                // Check if they were banned for version reasons
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('is_banned, ban_reason')
                    .eq('id', userId)
                    .single();

                // If banned with version-related reason, unban them
                if (profileData?.is_banned && profileData?.ban_reason?.toLowerCase().includes('update')) {
                    updateData.is_banned = false;
                    updateData.ban_reason = null;
                    console.log('User unbanned after updating to valid version');
                }
            }

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', userId);

            if (error) {
                console.error('Failed to update app version:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error updating app version:', error);
            return false;
        }
    }

    /**
     * Check if user's app version is blocked
     */
    async checkVersionBlock(userId: string): Promise<VersionBlockResult> {
        try {
            // Get minimum version from app_config
            const { data: configData, error: configError } = await supabase
                .from('app_config')
                .select('value')
                .eq('key', 'minimum_version')
                .single();

            if (configError) {
                console.error('Failed to fetch minimum version:', configError);
                return {
                    isBlocked: false,
                    minimumVersion: APP_VERSION
                };
            }

            const minimumVersion = configData?.value || APP_VERSION;

            // Get user's current app version
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('app_version')
                .eq('id', userId)
                .single();

            if (profileError) {
                console.error('Failed to fetch user profile version:', profileError);
                return {
                    isBlocked: false,
                    minimumVersion
                };
            }

            const userVersion = profileData?.app_version || '1.0.0';
            const isBlocked = !isVersionAtLeast(userVersion, minimumVersion);

            if (isBlocked) {
                // Get the block message
                const { data: messageData } = await supabase
                    .from('app_config')
                    .select('value')
                    .eq('key', 'force_update_message')
                    .single();

                return {
                    isBlocked: true,
                    minimumVersion,
                    message: messageData?.value,
                    blockReason: `Your app version ${userVersion} is outdated. Minimum required: ${minimumVersion}`
                };
            }

            return {
                isBlocked: false,
                minimumVersion,
                message: undefined
            };
        } catch (error) {
            console.error('Error checking version block:', error);
            return {
                isBlocked: false,
                minimumVersion: APP_VERSION
            };
        }
    }
}

export const versionBlockService = new VersionBlockService();
