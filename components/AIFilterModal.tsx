
import React from 'react';
import { X, CheckCircle2, AlertCircle, Star, List } from 'lucide-react';

interface AIFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (filter: 'all' | 'incorrect' | 'favorites') => void;
    paperName: string;
}

const AIFilterModal: React.FC<AIFilterModalProps> = ({ isOpen, onClose, onStart, paperName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-gray-100 dark:border-slate-700">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Start Quiz</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{paperName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X size={20} className="text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-3">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">How would you like to practice this session?</p>

                    <button
                        onClick={() => onStart('all')}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group text-left"
                    >
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                            <List size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">All Questions</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Practice the full set of questions</p>
                        </div>
                    </button>

                    <button
                        onClick={() => onStart('incorrect')}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group text-left"
                    >
                        <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">Incorrect Only</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Focus on your mistakes</p>
                        </div>
                    </button>

                    <button
                        onClick={() => onStart('favorites')}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all group text-left"
                    >
                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
                            <Star size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">Favorites Only</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Review bookmarked questions</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIFilterModal;
