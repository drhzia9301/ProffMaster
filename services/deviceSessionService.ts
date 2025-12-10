/**
 * Device Session Service
 * 
 * Manages single-device login enforcement to prevent account sharing.
 * Each user can only be logged in on ONE device at a time.
 * 
 * Features:
 * - Generates unique device fingerprint
 * - Registers device session on login
 * - Validates session on app launch
 * - Forces logout on other devices when new login occurs
 * - Tracks violations for potential banning
 * 
 * TEMPORARY: Device checks are DISABLED to allow multiple logins
 */

import { supabase } from './supabase';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

// ============================================
// TEMPORARY FLAG - SET TO TRUE TO DISABLE ALL DEVICE CHECKS
// This allows multiple devices to login simultaneously
// ============================================
const DISABLE_DEVICE_CHECKS = true;

// Storage key for local session token
const SESSION_TOKEN_KEY = 'proffmaster_device_session_token';
const DEVICE_ID_KEY = 'proffmaster_device_id';

export interface DeviceSession {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string | null;
  device_platform: string | null;
  ip_address: string | null;
  created_at: string;
  last_active_at: string;
  session_token: string;
}

export interface SessionValidationResult {
  isValid: boolean;
  isNewDevice: boolean;
  existingSession?: DeviceSession;
  error?: string;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: string;
}

class DeviceSessionService {
  private currentSessionToken: string | null = null;

  /**
   * Generate or retrieve a unique device ID
   * This ID persists across app restarts
   */
  async getDeviceId(): Promise<string> {
    // Check if we already have a stored device ID
    const storedId = localStorage.getItem(DEVICE_ID_KEY);
    if (storedId) {
      return storedId;
    }

    // Generate a new device ID
    let deviceId: string;

    if (Capacitor.isNativePlatform()) {
      try {
        const info = await Device.getId();
        deviceId = info.identifier;
      } catch (e) {
        // Fallback to random UUID
        deviceId = crypto.randomUUID();
      }
    } else {
      // For web, create a fingerprint based on browser characteristics
      deviceId = await this.generateWebFingerprint();
    }

    // Store it for future use
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
  }

  /**
   * Generate a web browser fingerprint
   * Combines various browser properties to create a semi-unique identifier
   */
  private async generateWebFingerprint(): Promise<string> {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown',
      // @ts-ignore
      navigator.deviceMemory || 'unknown',
    ];

    const fingerprint = components.join('|');
    
    // Create a hash of the fingerprint
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `web_${hashHex.substring(0, 32)}`;
  }

  /**
   * Get device information
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    const deviceId = await this.getDeviceId();
    let deviceName = 'Unknown Device';
    let platform = 'web';

    if (Capacitor.isNativePlatform()) {
      try {
        const info = await Device.getInfo();
        deviceName = `${info.manufacturer} ${info.model}`;
        platform = info.platform;
      } catch (e) {
        console.error('Failed to get device info:', e);
      }
    } else {
      // Web browser detection
      const ua = navigator.userAgent;
      if (ua.includes('Chrome')) deviceName = 'Chrome Browser';
      else if (ua.includes('Firefox')) deviceName = 'Firefox Browser';
      else if (ua.includes('Safari')) deviceName = 'Safari Browser';
      else if (ua.includes('Edge')) deviceName = 'Edge Browser';
      else deviceName = 'Web Browser';

      // Add OS info
      if (ua.includes('Windows')) deviceName += ' (Windows)';
      else if (ua.includes('Mac')) deviceName += ' (Mac)';
      else if (ua.includes('Linux')) deviceName += ' (Linux)';
      else if (ua.includes('Android')) deviceName += ' (Android)';
      else if (ua.includes('iOS')) deviceName += ' (iOS)';
    }

    return { deviceId, deviceName, platform };
  }

  /**
   * Generate a unique session token
   */
  private generateSessionToken(): string {
    return crypto.randomUUID();
  }

  /**
   * Get the stored session token
   */
  getStoredSessionToken(): string | null {
    return localStorage.getItem(SESSION_TOKEN_KEY) || this.currentSessionToken;
  }

  /**
   * Store session token locally
   */
  private storeSessionToken(token: string): void {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    this.currentSessionToken = token;
  }

  /**
   * Clear stored session token
   */
  clearSessionToken(): void {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    this.currentSessionToken = null;
  }

  /**
   * Check if the user is banned
   */
  async checkBanStatus(userId: string): Promise<{ isBanned: boolean; reason?: string }> {
    // TEMPORARY: Skip ban checks when device checks are disabled
    if (DISABLE_DEVICE_CHECKS) {
      console.log('[DeviceSession] Device checks DISABLED - skipping ban check');
      return { isBanned: false };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_banned, ban_reason')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        isBanned: data?.is_banned || false,
        reason: data?.ban_reason
      };
    } catch (e) {
      console.error('Failed to check ban status:', e);
      return { isBanned: false };
    }
  }

  /**
   * Register a new device session
   * This will REPLACE any existing session for this user
   * Returns info about any existing session that was replaced
   */
  async registerSession(userId: string): Promise<{
    success: boolean;
    replacedSession?: DeviceSession;
    sessionToken: string;
    error?: string;
  }> {
    // TEMPORARY: Skip device registration when checks are disabled
    if (DISABLE_DEVICE_CHECKS) {
      console.log('[DeviceSession] Device checks DISABLED - skipping registration');
      const sessionToken = this.generateSessionToken();
      this.storeSessionToken(sessionToken);
      return {
        success: true,
        sessionToken
      };
    }

    try {
      const deviceInfo = await this.getDeviceInfo();
      const sessionToken = this.generateSessionToken();

      // First, check if there's an existing session for this user
      const { data: existingSession, error: fetchError } = await supabase
        .from('device_sessions')
        .select('*')
        .eq('user_id', userId)
        .single();

      let replacedSession: DeviceSession | undefined;

      if (existingSession && !fetchError) {
        // Check if it's the same device
        if (existingSession.device_id === deviceInfo.deviceId) {
          // Same device - just update the session token
          // This is important: update the token so the device can continue working
          const { error: updateError } = await supabase
            .from('device_sessions')
            .update({
              session_token: sessionToken,
              last_active_at: new Date().toISOString(),
              device_name: deviceInfo.deviceName
            })
            .eq('id', existingSession.id);

          if (updateError) throw updateError;
        } else {
          // Different device! This is a potential sharing violation
          replacedSession = existingSession;

          // Log the violation
          await this.logViolation(userId, 'multiple_device_attempt', deviceInfo);

          // IMPORTANT: Update the existing session with new device info and token
          // This will trigger the realtime subscription on the old device
          // because the session_token changes but the row still exists
          const { error: updateError } = await supabase
            .from('device_sessions')
            .update({
              device_id: deviceInfo.deviceId,
              device_name: deviceInfo.deviceName,
              device_platform: deviceInfo.platform,
              session_token: sessionToken,
              last_active_at: new Date().toISOString()
            })
            .eq('id', existingSession.id);

          if (updateError) throw updateError;
        }
      } else {
        // No existing session - first login
        const { error: insertError } = await supabase
          .from('device_sessions')
          .insert({
            user_id: userId,
            device_id: deviceInfo.deviceId,
            device_name: deviceInfo.deviceName,
            device_platform: deviceInfo.platform,
            session_token: sessionToken
          });

        if (insertError) throw insertError;
      }

      // Store the session token locally
      this.storeSessionToken(sessionToken);

      return {
        success: true,
        replacedSession,
        sessionToken
      };
    } catch (e: any) {
      console.error('Failed to register session:', e);
      return {
        success: false,
        sessionToken: '',
        error: e.message
      };
    }
  }

  /**
   * Validate the current session
   * Returns false if session is invalid (user logged in elsewhere)
   */
  async validateSession(userId: string): Promise<SessionValidationResult> {
    // TEMPORARY: Skip all device validation when disabled
    if (DISABLE_DEVICE_CHECKS) {
      console.log('[DeviceSession] Device checks DISABLED - allowing login');
      return {
        isValid: true,
        isNewDevice: false
      };
    }

    try {
      const storedToken = this.getStoredSessionToken();
      const deviceInfo = await this.getDeviceInfo();

      // Get the active session for this user
      const { data: activeSession, error } = await supabase
        .from('device_sessions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No session exists in database - this is truly a new device/first login
          return {
            isValid: false,
            isNewDevice: true
          };
        }
        throw error;
      }

      if (!activeSession) {
        return {
          isValid: false,
          isNewDevice: true
        };
      }

      // An active session exists in the database
      // Check if the stored token matches the active session
      if (storedToken && activeSession.session_token === storedToken) {
        // Valid session - update last active timestamp
        await supabase
          .from('device_sessions')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', activeSession.id);

        return {
          isValid: true,
          isNewDevice: false
        };
      }

      // Check if this is the same device (by device_id) but different token
      // This can happen if app was reinstalled or local storage was cleared
      if (activeSession.device_id === deviceInfo.deviceId) {
        // Same device, just needs token refresh - allow it
        return {
          isValid: false,
          isNewDevice: true // Treat as new to allow re-registration
        };
      }

      // Different device AND session exists - THIS IS A CONFLICT!
      // User is trying to log in from a different device while another device has an active session
      return {
        isValid: false,
        isNewDevice: false,
        existingSession: activeSession
      };
    } catch (e: any) {
      console.error('Failed to validate session:', e);
      return {
        isValid: false,
        isNewDevice: true,
        error: e.message
      };
    }
  }

  /**
   * Log a session violation for ban tracking
   */
  async logViolation(
    userId: string,
    violationType: 'multiple_device_attempt' | 'forced_logout' | 'suspicious_activity',
    deviceInfo: DeviceInfo
  ): Promise<void> {
    try {
      await supabase
        .from('session_violations')
        .insert({
          user_id: userId,
          violation_type: violationType,
          device_id: deviceInfo.deviceId,
          device_name: deviceInfo.deviceName
        });
    } catch (e) {
      console.error('Failed to log violation:', e);
    }
  }

  /**
   * Get the user's violation count
   */
  async getViolationCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('violation_count')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.violation_count || 0;
    } catch (e) {
      console.error('Failed to get violation count:', e);
      return 0;
    }
  }

  /**
   * Clear session on logout
   */
  async clearSession(userId: string): Promise<void> {
    try {
      await supabase
        .from('device_sessions')
        .delete()
        .eq('user_id', userId);
      
      this.clearSessionToken();
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  }

  /**
   * Subscribe to session changes (for real-time logout detection)
   */
  subscribeToSessionChanges(userId: string, onSessionInvalidated: () => void): () => void {
    const storedToken = this.getStoredSessionToken();
    
    const channel = supabase
      .channel(`device_sessions_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_sessions',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          console.log('Device session change detected:', payload.eventType, payload);
          
          const currentToken = this.getStoredSessionToken();
          
          // Check if the session was deleted
          if (payload.eventType === 'DELETE') {
            // Session was deleted - user was logged out
            if (currentToken) {
              console.log('Session deleted - logging out this device');
              onSessionInvalidated();
            }
          } else if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            // Session was updated - check if token still matches
            const newSession = payload.new as DeviceSession;
            
            if (currentToken && newSession.session_token !== currentToken) {
              // Token changed - this device was logged out by another device
              console.log('Session token changed - logging out this device');
              console.log('Current token:', currentToken?.substring(0, 8) + '...');
              console.log('New token:', newSession.session_token?.substring(0, 8) + '...');
              onSessionInvalidated();
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    // Return unsubscribe function
    return () => {
      console.log('Unsubscribing from device session changes');
      supabase.removeChannel(channel);
    };
  }
}

export const deviceSessionService = new DeviceSessionService();
