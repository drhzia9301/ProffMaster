import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, CheckCircle2, AlertCircle, ExternalLink, Sparkles, HelpCircle, Trash2 } from 'lucide-react';
import { getApiKey, setApiKey, removeApiKey, hasApiKey } from '../services/apiKeyService';
import { resetProgress } from '../services/storageService';

const Settings: React.FC = () => {
    const [apiKey, setApiKeyInput] = useState('');
    const [isConfigured, setIsConfigured] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [showConfirmReset, setShowConfirmReset] = useState(false);

    useEffect(() => {
        const configured = hasApiKey();
        setIsConfigured(configured);
        if (configured) {
            const key = getApiKey();
            setApiKeyInput(key || '');
        }
    }, []);

    const handleSave = () => {
        if (!apiKey.trim()) {
            setMessage({ type: 'error', text: 'API key cannot be empty' });
            return;
        }

        const success = setApiKey(apiKey);
        if (success) {
            setIsConfigured(true);
            setMessage({ type: 'success', text: 'API key saved successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ type: 'error', text: 'Failed to save API key. Please try again.' });
        }
    };

    const handleRemove = () => {
        const success = removeApiKey();
        if (success) {
            setApiKeyInput('');
            setIsConfigured(false);
            setShowConfirmDelete(false);
            setMessage({ type: 'success', text: 'API key removed successfully' });
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ type: 'error', text: 'Failed to remove API key' });
        }
    };

    return (
        <div className="pb-24 space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <p className="text-gray-500 text-sm mt-1">Configure your AI features and preferences</p>
            </div>

            {/* API Key Configuration */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                                <Key size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Gemini API Key</h3>
                                <p className="text-xs text-gray-500">Required for AI-powered features</p>
                            </div>
                        </div>
                        {isConfigured && (
                            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
                                <CheckCircle2 size={14} />
                                Configured
                            </div>
                        )}
                    </div>

                    {/* API Key Input */}
                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                placeholder="Enter your Gemini API key"
                                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all font-mono text-sm"
                            />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20"
                            >
                                {isConfigured ? 'Update Key' : 'Save Key'}
                            </button>
                            {isConfigured && (
                                <button
                                    onClick={() => setShowConfirmDelete(true)}
                                    className="px-4 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>

                        {/* Get API Key Link */}
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                            <ExternalLink size={14} />
                            Get your free Gemini API key
                        </a>
                    </div>
                </div>

                {/* Security Notice */}
                <div className="p-6 bg-amber-50 border-t border-amber-100">
                    <div className="flex gap-3">
                        <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold text-amber-900 mb-1">Security Notice</p>
                            <p className="text-amber-800">
                                Your API key is stored locally in your browser's localStorage. It never leaves your device.
                                Keep your API key private and don't share it with others.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Features Status */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6">
                    <h3 className="font-bold text-gray-900 mb-4">AI-Powered Features</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isConfigured ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-400'}`}>
                                <Sparkles size={16} />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">AI Explanations</p>
                                <p className="text-xs text-gray-500">Get detailed analysis after answering</p>
                            </div>
                            <div className={`text-xs font-semibold px-2 py-1 rounded ${isConfigured ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                {isConfigured ? 'Active' : 'Inactive'}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isConfigured ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                                <HelpCircle size={16} />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">AI Hints</p>
                                <p className="text-xs text-gray-500">Get subtle hints during quizzes</p>
                            </div>
                            <div className={`text-xs font-semibold px-2 py-1 rounded ${isConfigured ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                {isConfigured ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success/Error Messages */}
            {message && (
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
            )}

            {/* Confirm Delete Modal */}
            {showConfirmDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-fade-in">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={24} className="text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Remove API Key?</h3>
                        <p className="text-sm text-gray-600 text-center mb-6">
                            This will disable all AI features. You can add it back anytime.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmDelete(false)}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRemove}
                                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Reset Progress */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6">
                    <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2">
                        <Trash2 size={20} /> Danger Zone
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Resetting your progress will delete all your stats, attempts, and bookmarks. This action cannot be undone.
                    </p>
                    <button
                        onClick={() => setShowConfirmReset(true)}
                        className="w-full py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors"
                    >
                        Reset All Progress
                    </button>
                </div>
            </div>

            {/* Confirm Reset Modal */}
            {showConfirmReset && (
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
            )}
        </div>
    );
};

export default Settings;
