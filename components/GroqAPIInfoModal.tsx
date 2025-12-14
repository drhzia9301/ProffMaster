import React, { useState, useEffect } from 'react';
import { X, Zap, Key, Settings, Sparkles } from 'lucide-react';

const STORAGE_KEY_GROQ_INFO = 'groq_api_info_shown';

export const GroqAPIInfoModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const hasSeenModal = localStorage.getItem(STORAGE_KEY_GROQ_INFO);
        if (!hasSeenModal) {
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem(STORAGE_KEY_GROQ_INFO, 'true');
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-slate-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white relative">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                            <Zap size={24} className="text-yellow-300" />
                        </span>
                        <h2 className="text-2xl font-bold">New AI Setup</h2>
                    </div>
                    <p className="text-orange-100 font-medium">
                        Important changes to AI features!
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Groq API for Questions */}
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-700">
                        <div className="flex gap-4 items-start">
                            <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-2 rounded-lg text-white shrink-0 shadow-lg">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">AI Question Generation</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Now uses <span className="font-semibold text-orange-600 dark:text-orange-400">Groq API</span> for faster, more reliable question generation.
                                </p>
                                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium">
                                    ⚡ Set up your Groq API key in Settings
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Gemini for Hints */}
                    <div className="flex gap-4 items-start">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                            <Key size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Gemini for Hints & Explanations</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Your Gemini API key will now be used exclusively for AI hints and detailed explanations.
                            </p>
                        </div>
                    </div>

                    {/* How to set up */}
                    <div className="flex gap-4 items-start">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0">
                            <Settings size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">How to Set Up</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Go to <span className="font-semibold">Settings → API Keys</span> and add your Groq API key. Get a free key from <span className="text-blue-500">console.groq.com</span>
                            </p>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            💡 Groq provides faster responses with generous free tier limits
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-2 border-t border-gray-100 dark:border-slate-700">
                    <button
                        onClick={handleClose}
                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
};
