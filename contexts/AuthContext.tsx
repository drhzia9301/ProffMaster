import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { syncAttempts } from '../services/storageService';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    connectionError: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [connectionError, setConnectionError] = useState(false);

    useEffect(() => {
        let mounted = true;

        // Timeout to detect offline/blocking
        const timeoutId = setTimeout(() => {
            if (mounted && loading) {
                console.warn('Supabase connection timed out - assuming offline');
                setConnectionError(true);
                setLoading(false);
            }
        }, 5000); // 5 seconds timeout

        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return;
            clearTimeout(timeoutId);

            setSession(session);
            setUser(session?.user ?? null);
            setConnectionError(false); // Connection successful

            if (session?.user) {
                syncAttempts().then(() => {
                    if (mounted) setLoading(false);
                });
            } else {
                setLoading(false);
            }
        }).catch(err => {
            console.error('Supabase session check failed:', err);
            if (mounted) {
                setConnectionError(true);
                setLoading(false);
            }
        });

        // Listen for changes on auth state (sign in, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted) return;
            setSession(session);
            setUser(session?.user ?? null);

            if (event === 'SIGNED_IN' && session) {
                setLoading(true);
                syncAttempts().then(() => {
                    if (mounted) setLoading(false);
                });
            } else if (event === 'SIGNED_OUT') {
                setLoading(false);
            } else {
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const value = {
        session,
        user,
        loading,
        connectionError,
        signOut,
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
