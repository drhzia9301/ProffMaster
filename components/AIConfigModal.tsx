import React, { useState } from 'react';
import { Sparkles, FileText, Settings, X, ArrowRight } from 'lucide-react';

interface AIConfigModalProps {
    block: string;
    onClose: () => void;
    onStart: (config: { type: 'full' | 'custom'; topic?: string; count?: number }) => void;
}

const AIConfigModal: React.FC<AIConfigModalProps> = ({ block, onClose, onStart }) => {
    const [mode, setMode] = useState<'full' | 'custom' | null>(null);
    const [topic, setTopic] = useState('');
    const [count, setCount] = useState(10);

    const handleStart = () => {
        if (mode === 'full') {
            onStart({ type: 'full' });
        } else if (mode === 'custom') {
            onStart({ type: 'custom', topic, count });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-fade-in">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles className="text-medical-600" size={24} />
                            AI Generator
                        </h3>
                        <p className="text-sm text-gray-500">Block: {block}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {!mode ? (
                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => setMode('full')}
                                className="p-4 rounded-xl border-2 border-gray-100 hover:border-medical-500 hover:bg-medical-50 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                                        <FileText size={20} />
                                    </div>
                                    <span className="font-bold text-gray-900">Full Paper</span>
                                </div>
                                <p className="text-sm text-gray-500">Generate a complete 120 MCQ paper based on the block syllabus. (2 Hours)</p>
                            </button>

                            <button
                                onClick={() => setMode('custom')}
                                className="p-4 rounded-xl border-2 border-gray-100 hover:border-medical-500 hover:bg-medical-50 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-purple-100 text-purple-600 p-2 rounded-lg">
                                        <Settings size={20} />
                                    </div>
                                    <span className="font-bold text-gray-900">Custom Quiz</span>
                                </div>
                                <p className="text-sm text-gray-500">Choose a specific topic and number of questions.</p>
                            </button>
                        </div>
                    ) : mode === 'custom' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. Cardiac Cycle, Neoplasia..."
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-medical-500 focus:ring-2 focus:ring-medical-100 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions (Max 20)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={count}
                                    onChange={(e) => setCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 0)))}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-medical-500 focus:ring-2 focus:ring-medical-100 outline-none"
                                />
                            </div>

                            <button
                                onClick={() => setMode(null)}
                                className="text-sm text-gray-500 hover:text-gray-700 underline"
                            >
                                Back to options
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-gray-600">Ready to generate Full Paper for <b>{block}</b>?</p>
                            <p className="text-sm text-gray-500 mt-2">
                                {(block === 'Block M1' || block === 'Block M2') ? '90 Questions • 90 Minutes' : '120 Questions • 120 Minutes'}
                            </p>
                            <button
                                onClick={() => setMode(null)}
                                className="text-sm text-gray-500 hover:text-gray-700 underline mt-4 block"
                            >
                                Back to options
                            </button>
                        </div>
                    )}
                </div>

                {mode && (
                    <div className="p-6 bg-gray-50 border-t border-gray-100">
                        <button
                            onClick={handleStart}
                            disabled={mode === 'custom' && !topic.trim()}
                            className="w-full bg-medical-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold shadow-lg shadow-medical-500/20 hover:bg-medical-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Sparkles size={20} />
                            Generate {mode === 'full' ? 'Paper' : 'Quiz'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIConfigModal;
