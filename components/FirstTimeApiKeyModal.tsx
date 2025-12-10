import React, { useState, useEffect } from 'react';
import { Sparkles, Key, ExternalLink, PlayCircle, X, CheckCircle2 } from 'lucide-react';
import { hasShownFirstTimeModal, markFirstTimeModalShown } from '../services/apiKeyService';
import VideoPlayerModal from './VideoPlayerModal';

const FirstTimeApiKeyModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showVideo, setShowVideo] = useState(false);

    useEffect(() => {
        // Show modal only if not shown before
        if (!hasShownFirstTimeModal()) {
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        markFirstTimeModalShown();
        setIsOpen(false);
    };

    const handleWatchVideo = () => {
        setShowVideo(true);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                            <Sparkles size={28} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">AI Features Ready! 🎉</h2>
                            <p className="text-purple-100 text-sm">No setup required</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Good news section */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-semibold text-green-900">Default API Key Included</h3>
                                <p className="text-sm text-green-700 mt-1">
                                    This app comes with a built-in API key, so all AI features work right out of the box! ✨
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* What you can do */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">What you can do:</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                Generate AI-powered notes from questions
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                Create custom AI questions on any topic
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                Generate similar questions after sessions
                            </li>
                        </ul>
                    </div>

                    {/* Optional upgrade section */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Key className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                            <div>
                                <h3 className="font-semibold text-amber-900 text-sm">Want Unlimited Usage?</h3>
                                <p className="text-xs text-amber-700 mt-1">
                                    To avoid potential rate limits during peak times, you can add your own free Gemini API key in Settings.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="flex flex-col gap-2">
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium py-2 px-4 rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors"
                        >
                            <ExternalLink size={16} />
                            Get your free Gemini API key
                        </a>
                        <button
                            onClick={handleWatchVideo}
                            className="flex items-center justify-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium py-2 px-4 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors"
                        >
                            <PlayCircle size={16} />
                            Watch Tutorial Video
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <button
                        onClick={handleClose}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25"
                    >
                        Got it, let's go! 🚀
                    </button>
                </div>
            </div>

            {/* Video Player Modal */}
            <VideoPlayerModal
                isOpen={showVideo}
                onClose={() => setShowVideo(false)}
                videoSrc="/assets/api_key_tutorial.mp4"
                title="How to Get Your Gemini API Key"
            />
        </div>
    );
};

export default FirstTimeApiKeyModal;
