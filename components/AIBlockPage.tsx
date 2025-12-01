import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, Sparkles, Clock, Trash2, FileText } from 'lucide-react';
import AIConfigModal from './AIConfigModal';
import AIFilterModal from './AIFilterModal';
import { getSavedPapers, deleteSavedPaper, SavedPaper } from '../services/savedPapersService';

const AIBlockPage = () => {
    const navigate = useNavigate();
    const blocks = ['Block J', 'Block K', 'Block L', 'Block M1', 'Block M2'];
    const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'new' | 'saved'>('new');
    const [savedPapers, setSavedPapers] = useState<SavedPaper[]>([]);
    const [selectedPaper, setSelectedPaper] = useState<SavedPaper | null>(null);

    // Load saved papers when tab changes
    React.useEffect(() => {
        if (activeTab === 'saved') {
            setSavedPapers(getSavedPapers());
        }
    }, [activeTab]);

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this paper?')) {
            setSavedPapers(deleteSavedPaper(id));
        }
    };

    const handleOpenSaved = (paper: SavedPaper) => {
        setSelectedPaper(paper);
    };

    const handleStartSaved = (filter: 'all' | 'incorrect' | 'favorites') => {
        if (!selectedPaper) return;

        navigate('/quiz', {
            state: {
                mode: selectedPaper.type === 'full' ? 'exam' : 'practice',
                type: 'ai_generated', // Use ai_generated type for proper storage handling
                questions: selectedPaper.questions,
                timeLimit: selectedPaper.type === 'full' ? 120 : undefined,
                subject: selectedPaper.block, // For display
                filter, // Pass the selected filter
                paperId: selectedPaper.id // Pass paper ID for context if needed
            }
        });
        setSelectedPaper(null);
    };

    const handleStart = (config: { type: 'full' | 'custom'; topic?: string; count?: number }) => {
        // Navigate to quiz with AI config
        // We'll pass a special 'ai_generated' type to the quiz session
        navigate('/quiz', {
            state: {
                mode: config.type === 'full' ? 'exam' : 'practice',
                type: 'ai_generated',
                block: selectedBlock,
                aiConfig: config,
                timeLimit: config.type === 'full' ? 120 : undefined, // 2 hours for full paper
                questionCount: config.type === 'full' ? 120 : config.count
            }
        });
    };

    return (
        <div className="pb-24 space-y-6 relative">
            <div className="flex items-center gap-2 text-gray-500 cursor-pointer" onClick={() => navigate('/')}>
                <ArrowRight className="rotate-180" size={18} />
                <span className="text-sm font-medium">Back to Dashboard</span>
            </div>

            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                    <Sparkles size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">AI Questions</h2>
                    <p className="text-sm text-gray-500">Select a block to train the model</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-xl">
                <button
                    onClick={() => setActiveTab('new')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'new' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    New Generation
                </button>
                <button
                    onClick={() => setActiveTab('saved')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'saved' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Saved Papers
                </button>
            </div>

            {activeTab === 'new' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                    {blocks.map((block) => (
                        <button
                            key={block}
                            onClick={() => setSelectedBlock(block)}
                            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-medical-200 transition-all text-left flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center transition-transform group-hover:scale-110">
                                    <Layers size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{block}</h3>
                                </div>
                            </div>
                            <ArrowRight size={20} className="text-gray-300 group-hover:text-medical-600 transition-colors" />
                        </button>
                    ))}
                </div>
            ) : (
                <div className="space-y-3 animate-fade-in">
                    {savedPapers.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <FileText size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No saved papers yet.</p>
                            <p className="text-xs mt-1">Generate a Full Paper to see it here.</p>
                        </div>
                    ) : (
                        savedPapers.map((paper) => (
                            <div
                                key={paper.id}
                                onClick={() => handleOpenSaved(paper)}
                                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-medical-200 cursor-pointer group flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{paper.name}</h3>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(paper.date).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{paper.questions.length} Questions</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, paper.id)}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {selectedBlock && (
                <AIConfigModal
                    block={selectedBlock}
                    onClose={() => setSelectedBlock(null)}
                    onStart={handleStart}
                />
            )}

            {selectedPaper && (
                <AIFilterModal
                    isOpen={!!selectedPaper}
                    onClose={() => setSelectedPaper(null)}
                    onStart={handleStartSaved}
                    paperName={selectedPaper.name}
                />
            )}
        </div>
    );
};

export default AIBlockPage;
