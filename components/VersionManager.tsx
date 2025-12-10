import React, { useEffect, useState } from 'react';
import { APP_VERSION, MINIMUM_REQUIRED_VERSION, isVersionAtLeast } from '../constants';
import { AlertTriangle, RefreshCw, CheckCircle2, Download } from 'lucide-react';
import { versionService } from '../services/versionService';

const STORAGE_KEY_VERSION = 'supersix_app_version';
const STORAGE_KEY_QUESTIONS_CACHE = 'questions_cache';

export const VersionManager: React.FC = () => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateStatus, setUpdateStatus] = useState<'idle' | 'updating' | 'complete' | 'force_update'>('idle');
    const [serverMinVersion, setServerMinVersion] = useState<string | null>(null);
    const [updateMessage, setUpdateMessage] = useState<string | null>(null);

    useEffect(() => {
        checkVersion();
    }, []);

    const checkVersion = async () => {
        const storedVersion = localStorage.getItem(STORAGE_KEY_VERSION);

        // First, check server-side minimum version (for APK users)
        try {
            const serverCheck = await versionService.checkVersion();
            if (serverCheck.needsUpdate) {
                console.log(`Server requires update: ${APP_VERSION} < ${serverCheck.minimumVersion}`);
                setServerMinVersion(serverCheck.minimumVersion);
                setUpdateMessage(serverCheck.message || null);
                setUpdateStatus('force_update');
                return;
            }
        } catch (e) {
            console.error('Server version check failed:', e);
            // Continue with local check if server check fails
        }

        // Local check: stored version vs current APP_VERSION
        if (storedVersion && !isVersionAtLeast(storedVersion, MINIMUM_REQUIRED_VERSION)) {
            console.log(`Force update required: ${storedVersion} < ${MINIMUM_REQUIRED_VERSION}`);
            setUpdateStatus('force_update');
            return;
        }

        if (storedVersion !== APP_VERSION) {
            console.log(`Version mismatch detected: ${storedVersion} -> ${APP_VERSION}`);
            performUpdate(storedVersion, APP_VERSION);
        }
    };

    const handleForceUpdate = () => {
        // Clear all caches and force reload
        console.log('Performing force update...');
        localStorage.removeItem(STORAGE_KEY_QUESTIONS_CACHE);
        localStorage.setItem(STORAGE_KEY_VERSION, APP_VERSION);
        
        // Clear service worker caches if available
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
        
        // Force hard reload
        window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
    };

    const performUpdate = (oldVersion: string | null, newVersion: string) => {
        setIsUpdating(true);
        setUpdateStatus('updating');

        // 1. Clear critical caches that might cause schema issues
        console.log('Clearing caches...');
        localStorage.removeItem(STORAGE_KEY_QUESTIONS_CACHE);

        // Note: We intentionally preserve 'supersix_attempts', 'supersix_bookmarks', etc.
        // to keep user progress safe.

        // 2. Update stored version
        localStorage.setItem(STORAGE_KEY_VERSION, newVersion);

        // 3. Simulate a short delay for UX (so user sees "Updating...")
        setTimeout(() => {
            setUpdateStatus('complete');

            // 4. Reload page to ensure fresh code is loaded
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }, 1000);
    };

    if (!isUpdating && updateStatus !== 'force_update') return null;

    return (
        <div className="fixed inset-0 bg-white/90 dark:bg-slate-900/95 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-8 max-w-sm w-full text-center animate-fade-in">

                {updateStatus === 'force_update' && (
                    <>
                        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Download size={32} className="text-orange-600 dark:text-orange-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Update Required</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                            {updateMessage || 'A new version of ProffMaster is available with important improvements and bug fixes.'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
                            Your version: {APP_VERSION}<br />
                            Required version: {serverMinVersion || MINIMUM_REQUIRED_VERSION}
                        </p>
                        <button
                            onClick={handleForceUpdate}
                            className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Download size={20} />
                            Update Now
                        </button>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                            Your progress and data will be preserved
                        </p>
                    </>
                )}

                {updateStatus === 'updating' && (
                    <>
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <RefreshCw size={32} className="text-blue-600 animate-spin" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Updating App...</h2>
                        <p className="text-gray-500 text-sm">
                            Optimizing your experience and clearing old data.
                            <br />Your progress is safe.
                        </p>
                    </>
                )}

                {updateStatus === 'complete' && (
                    <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={32} className="text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Update Complete!</h2>
                        <p className="text-gray-500 text-sm">
                            Restarting...
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};
