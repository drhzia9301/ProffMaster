import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { syncAttempts } from '../services/storageService';
import { deviceSessionService, DeviceSession } from '../services/deviceSessionService';
import { versionBlockService } from '../services/versionBlockService';
import { APP_VERSION } from '../constants';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    connectionError: boolean;
    signOut: () => Promise<void>;
    // Device session state
    isSessionValid: boolean;
    isBanned: boolean;
    banReason?: string;
    sessionInvalidated: boolean;
    setSessionInvalidated: (value: boolean) => void;
    // Version block state
    isVersionBlocked: boolean;
    versionBlockMessage?: string;
    requiredVersion?: string;
    // Device session actions
    validateDeviceSession: () => Promise<boolean>;
    registerDeviceSession: () => Promise<{ success: boolean; replacedSession?: DeviceSession }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [connectionError, setConnectionError] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    
    // Device session state
    const [isSessionValid, setIsSessionValid] = useState(true);
    const [isBanned, setIsBanned] = useState(false);
    const [banReason, setBanReason] = useState<string | undefined>();
    const [sessionInvalidated, setSessionInvalidated] = useState(false);
    
    // Version block state
    const [isVersionBlocked, setIsVersionBlocked] = useState(false);
    const [versionBlockMessage, setVersionBlockMessage] = useState<string | undefined>();
    const [requiredVersion, setRequiredVersion] = useState<string | undefined>();

    // Update app version in profile and check for version blocks
    const updateAndCheckVersion = useCallback(async (userId: string): Promise<boolean> => {
        try {
            // First, update app_version in profile (this is how we track version)
            await versionBlockService.updateUserAppVersion(userId);

            // Then check if user's version is blocked based on minimum_version in app_config
            const blockResult = await versionBlockService.checkVersionBlock(userId);

            if (blockResult.isBlocked) {
                setIsVersionBlocked(true);
                setVersionBlockMessage(blockResult.message || 'Your app version is outdated. Please update to continue.');
                setRequiredVersion(blockResult.minimumVersion);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error checking version:', error);
            return true; // Don't block on error
        }
    }, []);

    // Validate the device session
    const validateDeviceSession = useCallback(async (): Promise<boolean> => {
        if (!user) return false;

        // First check if user is banned
        const banStatus = await deviceSessionService.checkBanStatus(user.id);
        if (banStatus.isBanned) {
            setIsBanned(true);
            setBanReason(banStatus.reason);
            return false;
        }

        // Then validate the session
        const result = await deviceSessionService.validateSession(user.id);
        setIsSessionValid(result.isValid);
        return result.isValid;
    }, [user]);

    // Register a new device session
    const registerDeviceSession = useCallback(async (): Promise<{ success: boolean; replacedSession?: DeviceSession }> => {
        if (!user) return { success: false };

        const result = await deviceSessionService.registerSession(user.id);
        if (result.success) {
            setIsSessionValid(true);
        }
        return {
            success: result.success,
            replacedSession: result.replacedSession
        };
    }, [user]);

    useEffect(() => {
        let mounted = true;
        let unsubscribeFromSessionChanges: (() => void) | null = null;

        // Skip re-initialization if already loaded
        if (initialLoadComplete && session) {
            return;
        }

        // Timeout to detect offline/blocking
        const timeoutId = setTimeout(() => {
            if (mounted && loading) {
                console.warn('Supabase connection timed out - assuming offline');
                setConnectionError(true);
                setLoading(false);
                setInitialLoadComplete(true);
            }
        }, 5000); // 5 seconds timeout

        // Check active sessions and sets the user
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!mounted) return;
            clearTimeout(timeoutId);

            setSession(session);
            setUser(session?.user ?? null);
            setConnectionError(false); // Connection successful

            if (session?.user) {
                // FIRST: Update app version (this will also unban users who update)
                // This must happen before ban check so updated users get unbanned
                const versionOk = await updateAndCheckVersion(session.user.id);
                if (!versionOk) {
                    // User is version blocked
                    setLoading(false);
                    setInitialLoadComplete(true);
                    return;
                }

                // THEN: Check ban status (after version update, so auto-unban works)
                const banStatus = await deviceSessionService.checkBanStatus(session.user.id);
                if (banStatus.isBanned) {
                    setIsBanned(true);
                    setBanReason(banStatus.reason);
                    setLoading(false);
                    setInitialLoadComplete(true);
                    return;
                }

                // Validate device session
                const sessionResult = await deviceSessionService.validateSession(session.user.id);
                setIsSessionValid(sessionResult.isValid);

                // Subscribe to real-time session changes
                unsubscribeFromSessionChanges = deviceSessionService.subscribeToSessionChanges(
                    session.user.id,
                    () => {
                        // Session was invalidated by another device logging in
                        console.log('Session invalidated callback triggered!');
                        setSessionInvalidated(true);
                        setIsSessionValid(false);
                    }
                );

                // Also set up a periodic check as fallback in case realtime fails
                const checkSessionInterval = setInterval(async () => {
                    if (!session?.user) return;
                    const result = await deviceSessionService.validateSession(session.user.id);
                    if (!result.isValid && !result.isNewDevice) {
                        console.log('Session validation failed in periodic check');
                        setSessionInvalidated(true);
                        setIsSessionValid(false);
                        clearInterval(checkSessionInterval);
                    }
                }, 30000); // Check every 30 seconds

                // Store interval ID for cleanup
                (window as any).__sessionCheckInterval = checkSessionInterval;

                // Set loading false immediately, sync attempts in background
                setLoading(false);
                setInitialLoadComplete(true);
                
                // Sync attempts in background (non-blocking)
                syncAttempts().catch(err => {
                    console.warn('Background sync failed:', err);
                });
            } else {
                setLoading(false);
                setInitialLoadComplete(true);
            }
        }).catch(err => {
            console.error('Supabase session check failed:', err);
            if (mounted) {
                setConnectionError(true);
                setLoading(false);
                setInitialLoadComplete(true);
            }
        });

        // Listen for changes on auth state (sign in, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;
            setSession(session);
            setUser(session?.user ?? null);

            if (event === 'SIGNED_IN' && session) {
                setLoading(true);
                
                // ===== Clear previous user's data if a DIFFERENT user logs in =====
                const STORAGE_KEY_LAST_USER = 'supersix_last_user_id';
                const lastUserId = localStorage.getItem(STORAGE_KEY_LAST_USER);
                
                if (lastUserId && lastUserId !== session.user.id) {
                    console.log(`Different user detected (${lastUserId} -> ${session.user.id}), clearing previous user data`);
                    
                    // Preserve non-user-specific settings
                    const geminiKey = localStorage.getItem('gemini_api_key');
                    const theme = localStorage.getItem('theme');
                    const hapticsEnabled = localStorage.getItem('supersix_haptics_enabled');
                    const appVersion = localStorage.getItem('supersix_app_version');
                    
                    // Clear ALL localStorage
                    localStorage.clear();
                    
                    // Restore non-user-specific settings
                    if (geminiKey) localStorage.setItem('gemini_api_key', geminiKey);
                    if (theme) localStorage.setItem('theme', theme);
                    if (hapticsEnabled) localStorage.setItem('supersix_haptics_enabled', hapticsEnabled);
                    if (appVersion) localStorage.setItem('supersix_app_version', appVersion);
                } else if (lastUserId === session.user.id) {
                    console.log('Same user logging in, preserving localStorage data');
                }
                
                // Store current user ID for future comparison
                localStorage.setItem(STORAGE_KEY_LAST_USER, session.user.id);
                
                // Reset states on new sign in
                setIsBanned(false);
                setBanReason(undefined);
                setSessionInvalidated(false);

                // FIRST: Update app version (this will also unban users who update)
                await updateAndCheckVersion(session.user.id);

                // THEN: Check ban status (after version update, so auto-unban works)
                const banStatus = await deviceSessionService.checkBanStatus(session.user.id);
                if (banStatus.isBanned) {
                    setIsBanned(true);
                    setBanReason(banStatus.reason);
                    setLoading(false);
                    setInitialLoadComplete(true);
                    return;
                }

                // Subscribe to session changes for this user
                if (unsubscribeFromSessionChanges) {
                    unsubscribeFromSessionChanges();
                }
                unsubscribeFromSessionChanges = deviceSessionService.subscribeToSessionChanges(
                    session.user.id,
                    () => {
                        setSessionInvalidated(true);
                        setIsSessionValid(false);
                    }
                );

                // Set loading false immediately
                setLoading(false);
                setInitialLoadComplete(true);
                
                // Sync in background
                syncAttempts().catch(err => {
                    console.warn('Background sync failed:', err);
                });
            } else if (event === 'SIGNED_OUT') {
                // Clean up session subscription
                if (unsubscribeFromSessionChanges) {
                    unsubscribeFromSessionChanges();
                    unsubscribeFromSessionChanges = null;
                }
                // Clear the periodic session check interval
                if ((window as any).__sessionCheckInterval) {
                    clearInterval((window as any).__sessionCheckInterval);
                    (window as any).__sessionCheckInterval = null;
                }
                // Reset device session states
                setIsSessionValid(true);
                setIsBanned(false);
                setBanReason(undefined);
                setSessionInvalidated(false);
                setInitialLoadComplete(false);
                deviceSessionService.clearSessionToken();
                setLoading(false);
            } else if (event === 'TOKEN_REFRESHED') {
                // Token refresh shouldn't trigger loading state
                // Just update session silently
            } else {
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
            if (unsubscribeFromSessionChanges) {
                unsubscribeFromSessionChanges();
            }
            // Clear the periodic session check interval
            if ((window as any).__sessionCheckInterval) {
                clearInterval((window as any).__sessionCheckInterval);
            }
        };
    }, [initialLoadComplete]);

    const signOut = async () => {
        try {
            // Clear the periodic session check interval first
            if ((window as any).__sessionCheckInterval) {
                clearInterval((window as any).__sessionCheckInterval);
                (window as any).__sessionCheckInterval = null;
            }
            
            // Clear device session before signing out (don't await to avoid blocking)
            if (user) {
                deviceSessionService.clearSession(user.id).catch(err => {
                    console.warn('Failed to clear device session:', err);
                });
            }
            
            // Clear local session token immediately
            deviceSessionService.clearSessionToken();
            
            // Clear local state immediately for faster UI response
            setUser(null);
            setSession(null);
            setIsSessionValid(true);
            setIsBanned(false);
            setBanReason(undefined);
            setSessionInvalidated(false);
            setInitialLoadComplete(false);
            
            // NOTE: We do NOT clear localStorage on logout anymore.
            // We only clear it when a DIFFERENT user logs in (handled by clearPreviousUserData).
            // This preserves the user's AI-generated content and notes if they log back in.
            
            console.log('User signed out - localStorage preserved for potential re-login');
            
            // Sign out from Supabase
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Sign out error:', error);
            // Even if there's an error, clear local state
            setUser(null);
            setSession(null);
            deviceSessionService.clearSessionToken();
        }
    };

    const value = {
        session,
        user,
        loading,
        connectionError,
        signOut,
        // Device session state
        isSessionValid,
        isBanned,
        banReason,
        sessionInvalidated,
        setSessionInvalidated,
        // Version block state
        isVersionBlocked,
        versionBlockMessage,
        requiredVersion,
        // Device session actions
        validateDeviceSession,
        registerDeviceSession,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
