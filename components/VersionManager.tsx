import React, { useEffect, useState } from 'react';
import { APP_VERSION } from '../constants';
import { AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY_VERSION = 'supersix_app_version';
const STORAGE_KEY_QUESTIONS_CACHE = 'questions_cache';

export const VersionManager: React.FC = () => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateStatus, setUpdateStatus] = useState<'idle' | 'updating' | 'complete'>('idle');

    useEffect(() => {
        checkVersion();
    }, []);

    const checkVersion = () => {
        const storedVersion = localStorage.getItem(STORAGE_KEY_VERSION);

        if (storedVersion !== APP_VERSION) {
            console.log(`Version mismatch detected: ${storedVersion} -> ${APP_VERSION}`);
            performUpdate(storedVersion, APP_VERSION);
        }
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

    if (!isUpdating) return null;

    return (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-sm w-full text-center animate-fade-in">

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
