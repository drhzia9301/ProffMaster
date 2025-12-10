import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { deviceSessionService, DeviceSession } from '../services/deviceSessionService';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2, Stethoscope, Eye, EyeOff, WifiOff, RefreshCw } from 'lucide-react';
import DeviceConflictModal from './DeviceConflictModal';
import BannedUserModal from './BannedUserModal';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    
    // Device session conflict state
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [conflictSession, setConflictSession] = useState<DeviceSession | undefined>();
    const [violationCount, setViolationCount] = useState(0);
    const [pendingUserId, setPendingUserId] = useState<string | null>(null);
    
    // Banned user state
    const [showBannedModal, setShowBannedModal] = useState(false);
    const [banReason, setBanReason] = useState<string | undefined>();

    // Monitor network status
    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleContactSupport = () => {
        // Open email client with support address
        window.location.href = 'mailto:support@proffmaster.com?subject=Account%20Ban%20Appeal&body=User%20ID:%20' + pendingUserId;
    };

    const handleConflictContinue = async () => {
        setShowConflictModal(false);
        if (!pendingUserId) return;
        
        setLoading(true);
        try {
            // Register the new session (this will replace the old one)
            const result = await deviceSessionService.registerSession(pendingUserId);
            if (result.success) {
                navigate('/');
            } else {
                setError('Failed to register device. Please try again.');
            }
        } catch (err: any) {
            // Check if it's a network/connection error  
            if (err.message?.includes('Failed to fetch') || 
                err.message?.includes('NetworkError') || 
                err.message?.includes('fetch') ||
                err.name === 'TypeError' ||
                !navigator.onLine) {
                setError('No internet connection. Please check your network and try again.');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleConflictCancel = async () => {
        setShowConflictModal(false);
        setPendingUserId(null);
        // Sign out since user chose not to proceed
        await supabase.auth.signOut();
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                if (data.session && data.user) {
                    // Register device session for new user
                    await deviceSessionService.registerSession(data.user.id);
                    navigate('/');
                } else {
                    setMessage('Check your email for the confirmation link!');
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                
                if (!data.user) {
                    throw new Error('Login failed');
                }

                // Check if user is banned
                const banStatus = await deviceSessionService.checkBanStatus(data.user.id);
                if (banStatus.isBanned) {
                    setPendingUserId(data.user.id);
                    setBanReason(banStatus.reason);
                    setShowBannedModal(true);
                    await supabase.auth.signOut();
                    setLoading(false);
                    return;
                }

                // Validate device session
                const sessionResult = await deviceSessionService.validateSession(data.user.id);
                
                if (!sessionResult.isValid && !sessionResult.isNewDevice && sessionResult.existingSession) {
                    // Another device is already logged in - show conflict modal
                    setPendingUserId(data.user.id);
                    setConflictSession(sessionResult.existingSession);
                    
                    // Get violation count for warning display
                    const violations = await deviceSessionService.getViolationCount(data.user.id);
                    setViolationCount(violations);
                    
                    setShowConflictModal(true);
                    setLoading(false);
                    return;
                }

                // No conflict or new device - register session and proceed
                const registerResult = await deviceSessionService.registerSession(data.user.id);
                
                if (!registerResult.success) {
                    throw new Error('Failed to register device session');
                }

                navigate('/');
            }
        } catch (err: any) {
            // Check if it's a network/connection error
            if (err.message?.includes('Failed to fetch') || 
                err.message?.includes('NetworkError') || 
                err.message?.includes('fetch') ||
                err.name === 'TypeError' ||
                !navigator.onLine) {
                setError('No internet connection. Please check your network and try again.');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // Show offline screen when no internet connection
    if (isOffline) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <WifiOff size={40} className="text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No Internet Connection</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">
                        This app requires an active internet connection to sign in and sync your progress.
                        <br /><br />
                        Please check your Wi-Fi or mobile data and try again.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-medical-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-medical-500/20 hover:bg-medical-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={20} />
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 relative transition-colors">
                <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden transition-colors">
                    <div className="bg-gradient-to-r from-medical-600 to-medical-500 p-8 text-white text-center">
                        <div className="flex flex-col items-center gap-3 mb-6">
                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                                <Stethoscope size={32} className="text-white" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">ProffMaster</h1>
                        </div>

                        <p className="text-medical-100 text-sm">Sign in to sync your progress across devices.</p>
                    </div>

                    <div className="p-8">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm">
                                <AlertCircle size={20} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        {message && (
                            <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm">
                                <AlertCircle size={20} className="shrink-0" />
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:border-medical-500 dark:focus:border-medical-500 focus:ring-2 focus:ring-medical-100 dark:focus:ring-medical-900/30 outline-none transition-all"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:border-medical-500 dark:focus:border-medical-500 focus:ring-2 focus:ring-medical-100 dark:focus:ring-medical-900/30 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-medical-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-medical-500/20 hover:bg-medical-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        {isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-sm text-medical-600 font-bold hover:underline"
                            >
                                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Device Conflict Modal */}
            <DeviceConflictModal
                isOpen={showConflictModal}
                existingSession={conflictSession}
                violationCount={violationCount}
                onContinue={handleConflictContinue}
                onCancel={handleConflictCancel}
            />

            {/* Banned User Modal */}
            <BannedUserModal
                isOpen={showBannedModal}
                reason={banReason}
                onContactSupport={handleContactSupport}
            />
        </>
    );
};

export default Login;

