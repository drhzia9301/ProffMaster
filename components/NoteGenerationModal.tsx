import React, { useState } from 'react';
import { X, Sparkles, FileText, AlignLeft, BookOpen } from 'lucide-react';

interface NoteGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (title: string, mode: 'concise' | 'detailed') => void;
    defaultTitle?: string;
}

const NoteGenerationModal: React.FC<NoteGenerationModalProps> = ({
    isOpen,
    onClose,
    onGenerate,
    defaultTitle = 'Study Notes'
}) => {
    const [title, setTitle] = useState(defaultTitle);
    const [mode, setMode] = useState<'concise' | 'detailed'>('concise');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Sparkles size={24} />
                        </div>
                        <h2 className="text-xl font-bold">Generate AI Notes</h2>
                    </div>
                    <p className="text-indigo-100 text-sm">
                        Create custom study material from your session.
                    </p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Title Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Note Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            placeholder="e.g., Cardiology Review"
                        />
                    </div>

                    {/* Mode Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select Style
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setMode('concise')}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${mode === 'concise'
                                        ? 'border-indigo-600 bg-indigo-50'
                                        : 'border-gray-100 hover:border-gray-200'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${mode === 'concise' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    <AlignLeft size={18} />
                                </div>
                                <h3 className={`font-bold mb-1 ${mode === 'concise' ? 'text-indigo-900' : 'text-gray-900'}`}>
                                    Concise
                                </h3>
                                <p className="text-xs text-gray-500">
                                    High-yield bullet points & rapid review.
                                </p>
                            </button>

                            <button
                                onClick={() => setMode('detailed')}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${mode === 'detailed'
                                        ? 'border-purple-600 bg-purple-50'
                                        : 'border-gray-100 hover:border-gray-200'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${mode === 'detailed' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    <BookOpen size={18} />
                                </div>
                                <h3 className={`font-bold mb-1 ${mode === 'detailed' ? 'text-purple-900' : 'text-gray-900'}`}>
                                    Detailed
                                </h3>
                                <p className="text-xs text-gray-500">
                                    In-depth explanations & concepts.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={() => onGenerate(title, mode)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Sparkles size={20} />
                        Generate Notes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NoteGenerationModal;
