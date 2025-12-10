import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    getGeminiApiKey, 
    setGeminiApiKey, 
    removeGeminiApiKey, 
    hasCustomGeminiKey
} from '../services/apiKeyService';
import { resetProgress } from '../services/storageService';
import { subscriptionService } from '../services/subscriptionService';
import { useTheme } from '../contexts/ThemeContext';
import { hapticsService } from '../services/hapticsService';
import { Eye, EyeOff, CheckCircle2, AlertCircle, ExternalLink, Sparkles, HelpCircle, Trash2, Moon, Sun, Palette, Smartphone, Shield, ArrowRight, Zap, Bot } from 'lucide-react';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    
    // API Key states
    const [apiKey, setApiKeyInput] = useState('');
    const [hasCustomKey, setHasCustomKey] = useState(false);
    
    const [showApiKey, setShowApiKey] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [showConfirmReset, setShowConfirmReset] = useState(false);
    const [hapticsEnabled, setHapticsEnabled] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        setHasCustomKey(hasCustomGeminiKey());
        
        if (hasCustomGeminiKey()) {
            setApiKeyInput(getGeminiApiKey());
        }
        
        setHapticsEnabled(hapticsService.getEnabled());
        subscriptionService.isAdmin().then(setIsAdmin);
    }, []);

    const toggleHaptics = () => {
        const newState = !hapticsEnabled;
        setHapticsEnabled(newState);
        hapticsService.toggle(newState);
    };

    const handleSaveApiKey = () => {
        if (!apiKey.trim()) {
            setMessage({ type: 'error', text: 'API key cannot be empty' });
            return;
        }
        const success = setGeminiApiKey(apiKey);
        if (success) {
            setHasCustomKey(true);
            setMessage({ type: 'success', text: 'Gemini API key saved!' });
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ type: 'error', text: 'Failed to save API key' });
        }
    };

    const handleRemoveApiKey = () => {
        removeGeminiApiKey();
        setApiKeyInput('');
        setHasCustomKey(false);
        setShowConfirmDelete(false);
        setMessage({ type: 'success', text: 'API key removed.' });
        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="pb-24 space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Configure your AI features and preferences</p>
            </div>

            {/* Appearance Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Palette size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Appearance</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Customize your reading experience</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setTheme('light')}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${theme === 'light'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-100 hover:border-gray-200 text-gray-600'
                                }`}
                        >
                            <Sun size={24} />
                            <span className="font-semibold text-sm">Light</span>
                        </button>

                        <button
                            onClick={() => setTheme('dark')}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${theme === 'dark'
                                ? 'border-slate-500 bg-slate-800 text-white'
                                : 'border-gray-100 hover:border-gray-200 text-gray-600'
                                }`}
                        >
                            <Moon size={24} />
                            <span className="font-semibold text-sm">Dark</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Haptics Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Smartphone size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Haptics</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Vibration feedback</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleHaptics}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hapticsEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-600'}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hapticsEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enable premium haptic feedback for interactions, correct answers, and mistakes.
                    </p>
                </div>
            </div>

            {/* AI Provider Configuration */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Bot size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">AI Provider</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Configure Google Gemini API for AI features</p>
                        </div>
                    </div>

                    {/* API Key Required Notice */}
                    {!hasCustomKey ? (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4">
                            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                                ⚠️ API Key Required! Add your Gemini API key below to enable AI features (explanations, hints, quiz generation).
                            </p>
                        </div>
                    ) : (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 mb-4">
                            <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                                ✅ AI features are active!
                            </p>
                        </div>
                    )}

                    {/* OpenRouter API Key */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Zap size={16} className="text-purple-500" />
                                <span className="font-medium text-gray-900 dark:text-white text-sm">Gemini API Key</span>
                            </div>
                            {hasCustomKey ? (
                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg font-medium">✓ Active</span>
                            ) : (
                                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-lg font-medium">Required</span>
                            )}
                        </div>
                        <div className="relative mb-2">
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                placeholder="Enter your Gemini API key"
                                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/30 outline-none transition-all font-mono text-sm"
                            />
                            <button
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveApiKey}
                                className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition-colors text-sm"
                            >
                                {hasCustomKey ? 'Update' : 'Save'}
                            </button>
                            {hasCustomKey && (
                                <button
                                    onClick={() => setShowConfirmDelete(true)}
                                    className="px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline mt-2"
                        >
                            <ExternalLink size={12} />
                            Get free Gemini API key
                        </a>
                    </div>
                </div>

                {/* Security Notice */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800">
                    <div className="flex gap-3">
                        <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 dark:text-amber-300">
                            API keys are stored locally on your device. They never leave your phone.
                        </p>
                    </div>
                </div>
            </div>

            {/* AI Features Status */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">AI-Powered Features</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasCustomKey ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                                <Sparkles size={16} />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white text-sm">AI Explanations</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Get detailed analysis after answering</p>
                            </div>
                            <div className={`text-xs font-semibold px-2 py-1 rounded ${hasCustomKey ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                {hasCustomKey ? 'Active' : 'Inactive'}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasCustomKey ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                                <HelpCircle size={16} />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white text-sm">AI Hints</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Get subtle hints during quizzes</p>
                            </div>
                            <div className={`text-xs font-semibold px-2 py-1 rounded ${hasCustomKey ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                {hasCustomKey ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success/Error Messages */}
            {
                message && (
                    <div className={`fixed bottom-24 left-4 right-4 p-4 rounded-xl shadow-lg animate-fade-in ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}>
                        <div className="flex items-center gap-3">
                            {message.type === 'success' ? (
                                <CheckCircle2 size={20} className="text-green-600" />
                            ) : (
                                <AlertCircle size={20} className="text-red-600" />
                            )}
                            <p className={`font-medium text-sm ${message.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                                {message.text}
                            </p>
                        </div>
                    </div>
                )
            }

            {/* Confirm Delete Modal */}
            {
                showConfirmDelete && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl animate-fade-in">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">
                                Remove Gemini API Key?
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                                This will remove your API key and disable all AI features.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmDelete(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRemoveApiKey}
                                    className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Reset Progress */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6">
                    <h3 className="font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                        <Trash2 size={20} /> Danger Zone
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Resetting your progress will delete all your stats, attempts, and bookmarks. This action cannot be undone.
                    </p>
                    <button
                        onClick={() => setShowConfirmReset(true)}
                        className="w-full py-3 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        Reset All Progress
                    </button>
                </div>
            </div>

            {/* Admin Dashboard Link - Only visible to admins */}
            {isAdmin && (
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl shadow-lg overflow-hidden">
                    <button
                        onClick={() => navigate('/admin')}
                        className="w-full p-6 text-left flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                <Shield size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">Admin Dashboard</h3>
                                <p className="text-slate-300 text-sm">Manage users and subscriptions</p>
                            </div>
                        </div>
                        <ArrowRight size={24} className="text-slate-400 group-hover:text-white transition-colors" />
                    </button>
                </div>
            )}

            {/* Confirm Reset Modal */}
            {
                showConfirmReset && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-fade-in">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={24} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Reset All Progress?</h3>
                            <p className="text-sm text-gray-600 text-center mb-6">
                                Are you sure? This will permanently delete all your quiz history and stats from this device and the cloud.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmReset(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        const success = await resetProgress();
                                        if (success) {
                                            setMessage({ type: 'success', text: 'Progress reset successfully' });
                                            setShowConfirmReset(false);
                                            setTimeout(() => window.location.reload(), 1500);
                                        } else {
                                            setMessage({ type: 'error', text: 'Failed to reset progress' });
                                        }
                                    }}
                                    className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                                >
                                    Yes, Reset
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Settings;
