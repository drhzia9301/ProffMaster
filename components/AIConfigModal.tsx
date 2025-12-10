import React, { useState, useMemo } from 'react';
import { Sparkles, BookOpen, X, ArrowRight, ArrowLeft, Hash, Tag, Edit3, Grid } from 'lucide-react';

interface AIConfigModalProps {
    block: string;
    onClose: () => void;
    onStart: (config: { type: 'custom'; topic: string; count: number; quizName: string }) => void;
}

// Subjects available for each block
const BLOCK_SUBJECTS: Record<string, string[]> = {
    'Block J': [
        'Pharmacology',
        'Pathology',
        'Forensic Medicine',
        'Community Medicine',
        'PRIME',
        'Medicine',
        'Psychiatry',
        'Neurosurgery',
        'Pediatrics',
        'Anesthesia',
        'Family Medicine'
    ],
    'Block K': [
        'Pharmacology',
        'Pathology',
        'Forensic Medicine',
        'Community Medicine',
        'PRIME',
        'Medicine',
        'Surgery',
        'Pediatrics',
        'Family Medicine'
    ],
    'Block L': [
        'Community Medicine',
        'Pharmacology',
        'Pathology',
        'Forensic Medicine',
        'Surgery',
        'Gynecology',
        'Medicine',
        'Pediatrics',
        'Family Medicine'
    ],
    'Block M1': ['ENT'],
    'Block M2': ['Ophthalmology']
};

const AIConfigModal: React.FC<AIConfigModalProps> = ({ block, onClose, onStart }) => {
    const [mode, setMode] = useState<'subject' | 'custom'>('subject'); // 'subject' for predefined list, 'custom' for user input
    const [step, setStep] = useState<1 | 2>(1);
    
    // Form State
    const [selectedSubject, setSelectedSubject] = useState('');
    const [customTopic, setCustomTopic] = useState('');
    const [count, setCount] = useState(20);
    const [quizName, setQuizName] = useState('');

    // Get subjects for selected block
    const subjects = useMemo(() => BLOCK_SUBJECTS[block] || [], [block]);

    // Auto-generate quiz name when subject changes (only for subject mode)
    const handleSubjectSelect = (subject: string) => {
        setSelectedSubject(subject);
        setQuizName(`${subject} - ${block}`);
    };

    const handleStart = () => {
        const finalTopic = mode === 'subject' ? selectedSubject : customTopic;
        const validTopic = finalTopic && finalTopic.trim().length > 0;
        
        // Generate a default name if empty in custom mode
        let finalQuizName = quizName.trim();
        if (!finalQuizName && mode === 'custom') {
            finalQuizName = `${finalTopic} - ${block}`;
        }

        if (validTopic && count >= 1 && count <= 50 && finalQuizName) {
            onStart({
                type: 'custom',
                topic: finalTopic,
                count,
                quizName: finalQuizName
            });
        }
    };

    // Validation
    const canProceedStep2 = mode === 'subject' ? !!selectedSubject : !!customTopic.trim();
    const canGenerate = (mode === 'subject' ? !!selectedSubject : !!customTopic.trim()) && count >= 1 && count <= 50;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-fade-in max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="text-purple-600" size={24} />
                            AI Quiz Generator
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{block}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    {step === 1 ? (
                        <>
                            {/* Mode Tabs */}
                            <div className="flex p-1 bg-gray-100 dark:bg-slate-700 rounded-xl mb-4">
                                <button
                                    onClick={() => { setMode('subject'); setCustomTopic(''); }}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                                        mode === 'subject'
                                            ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-300 shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                                    }`}
                                >
                                    <Grid size={16} />
                                    Subject List
                                </button>
                                <button
                                    onClick={() => { setMode('custom'); setSelectedSubject(''); }}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                                        mode === 'custom'
                                            ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-300 shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                                    }`}
                                >
                                    <Edit3 size={16} />
                                    Custom Topic
                                </button>
                            </div>

                            {mode === 'subject' ? (
                                /* Subject List Mode */
                                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2">
                                    {subjects.map((subject) => (
                                        <button
                                            key={subject}
                                            onClick={() => handleSubjectSelect(subject)}
                                            className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                                                selectedSubject === subject
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                                                    : 'border-gray-100 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-700'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                selectedSubject === subject
                                                    ? 'bg-purple-500 text-white'
                                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                                            }`}>
                                                <BookOpen size={20} />
                                            </div>
                                            <span className={`font-medium ${
                                                selectedSubject === subject
                                                    ? 'text-purple-700 dark:text-purple-300'
                                                    : 'text-gray-800 dark:text-gray-200'
                                            }`}>
                                                {subject}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                /* Custom Topic Mode */
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Topic / Concept
                                        </label>
                                        <textarea
                                            value={customTopic}
                                            onChange={(e) => setCustomTopic(e.target.value)}
                                            placeholder="e.g. Mechanism of Action of Beta Blockers, Glomerulonephritis, Circle of Willis..."
                                            className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-slate-600 focus:border-purple-500 outline-none min-h-[120px] resize-none dark:bg-slate-700 dark:text-white"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            Tip: Be specific for better questions. The AI will generate questions focused exactly on this topic.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Step 2: Quiz Configuration */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">2</div>
                                <h4 className="font-bold text-gray-900 dark:text-white">Configure Quiz</h4>
                            </div>

                            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-4 mb-4">
                                <p className="text-sm text-purple-700 dark:text-purple-300">
                                    <span className="font-bold">Topic:</span> {mode === 'subject' ? selectedSubject : customTopic}
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Question Count */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        <Hash size={16} />
                                        Number of Questions
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="5"
                                            max="20"
                                            value={count}
                                            onChange={(e) => setCount(parseInt(e.target.value))}
                                            className="flex-1 h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                        />
                                        <div className="w-16 text-center">
                                            <input
                                                type="number"
                                                min="1"
                                                max="20"
                                                value={count}
                                                onChange={(e) => setCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                                                className="w-full p-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-center font-bold text-gray-900 dark:text-white focus:border-purple-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum: 20 questions</p>
                                </div>

                                {/* Quiz Name */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        <Tag size={16} />
                                        Quiz Name
                                    </label>
                                    <input
                                        type="text"
                                        value={quizName}
                                        onChange={(e) => setQuizName(e.target.value)}
                                        placeholder={mode === 'subject' ?  `e.g., ${selectedSubject} Practice` : 'e.g. My Custom Quiz'}
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/30 outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(1)}
                                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 mt-4"
                            >
                                <ArrowLeft size={16} />
                                Back to topic selection
                            </button>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 flex-shrink-0">
                    {step === 1 ? (
                        <button
                            onClick={() => setStep(2)}
                            disabled={!canProceedStep2}
                            className="w-full bg-purple-600 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                        >
                            Continue
                            <ArrowRight size={20} />
                        </button>
                    ) : (
                        <button
                            onClick={handleStart}
                            disabled={!canGenerate}
                            className="w-full bg-purple-600 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Sparkles size={20} />
                            Generate {count} Questions
                        </button>
                    )}
                    
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
                        ⚡ Estimated time: {count <= 15 ? '~1 minute' : count <= 30 ? '~2 minutes' : '~3 minutes'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AIConfigModal;
