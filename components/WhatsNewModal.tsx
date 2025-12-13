import React, { useState, useEffect } from 'react';
import { APP_VERSION } from '../constants';
import { X, Sparkles, Zap, BookOpen, Bug, BrainCircuit } from 'lucide-react';

const STORAGE_KEY_WHATS_NEW = 'last_seen_whats_new_version';

export const WhatsNewModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const lastSeenVersion = localStorage.getItem(STORAGE_KEY_WHATS_NEW);
        if (lastSeenVersion !== APP_VERSION) {
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem(STORAGE_KEY_WHATS_NEW, APP_VERSION);
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-slate-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-medical-600 to-medical-500 p-6 text-white relative">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                            <Sparkles size={24} className="text-yellow-300" />
                        </span>
                        <h2 className="text-2xl font-bold">What's New</h2>
                    </div>
                    <p className="text-medical-100 font-medium">
                        Version {APP_VERSION} is here!
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">

                    {/* Highlight - Preproff Papers */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
                        <div className="flex gap-4 items-start">
                            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-2 rounded-lg text-white shrink-0 shadow-lg">
                                <Zap size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">🎉 56 Preproff Papers!</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Access preproff papers from <span className="font-semibold">2023, 2024 & 2025</span> across all blocks (J, K, L, M1, M2) from 9 colleges including KMC, KGMC, WMC, GMC, NWSM, AMC, RMC, KIMS, and NMC.
                                </p>
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                                    📚 4,000+ questions with detailed explanations!
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* NEW - Generate Similar Questions */}
                    <div className="flex gap-4 items-start">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0">
                            <BrainCircuit size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">🆕 Generate Similar Questions</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">After finishing a session, generate more questions on the same topics to strengthen your understanding!</p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">AI Questions (Up to 10!)</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Create custom quizzes with up to 10 questions per session using AI.</p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600 dark:text-purple-400 shrink-0">
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">AI Notes Generator</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Generate concise or detailed study notes from any question set.</p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg text-red-600 dark:text-red-400 shrink-0">
                            <Bug size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">10 New Preproff Papers Added!</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Added papers from AMC, RMC, KIMS, NMC plus new 2024 papers from GMC, KGMC, and WMC.</p>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 pt-2 border-t border-gray-100 dark:border-slate-700">
                    <button
                        onClick={handleClose}
                        className="w-full bg-medical-600 hover:bg-medical-700 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-medical-500/20"
                    >
                        Awesome, Let's Go!
                    </button>
                </div>
            </div>
        </div>
    );
};
