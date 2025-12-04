import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, Lock, Loader2 } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import LockedContentModal from './LockedContentModal';

const PreproffBlocksPage = () => {
    const navigate = useNavigate();
    const blocks = ['Block J', 'Block K', 'Block L', 'Block M1', 'Block M2'];
    
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [showLockedModal, setShowLockedModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            setLoading(true);
            const access = await subscriptionService.hasPreproffAccess();
            setHasAccess(access);
            setLoading(false);
        };
        checkAccess();
    }, []);

    const handleBlockClick = (block: string) => {
        if (hasAccess) {
            navigate('/preproff-years', { state: { block } });
        } else {
            setShowLockedModal(true);
        }
    };

    if (loading) {
        return (
            <div className="pb-24 space-y-6">
                <div className="flex items-center gap-2 text-gray-500 cursor-pointer" onClick={() => navigate('/selection')}>
                    <ArrowRight className="rotate-180" size={18} />
                    <span className="text-sm font-medium">Back to Selection</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Block</h2>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-medical-600" size={32} />
                </div>
            </div>
        );
    }

    return (
        <div className="pb-24 space-y-6">
            <div className="flex items-center gap-2 text-gray-500 cursor-pointer" onClick={() => navigate('/selection')}>
                <ArrowRight className="rotate-180" size={18} />
                <span className="text-sm font-medium">Back to Selection</span>
            </div>

            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Block</h2>
                {!hasAccess && (
                    <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <Lock size={12} />
                        Premium
                    </span>
                )}
            </div>

            {!hasAccess && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>🔒 Premium Content:</strong> Preproff papers require a one-time payment of <strong>Rs 300</strong>. 
                        Tap any block to learn more.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {blocks.map((block) => (
                    <button
                        key={block}
                        onClick={() => handleBlockClick(block)}
                        className={`bg-white dark:bg-slate-800 p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group ${
                            hasAccess 
                                ? 'border-gray-100 dark:border-slate-700 hover:border-medical-200 dark:hover:border-medical-600' 
                                : 'border-amber-200 dark:border-amber-800/50'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                                hasAccess 
                                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                                    : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}>
                                {hasAccess ? <Layers size={24} /> : <Lock size={24} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{block}</h3>
                                {!hasAccess && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400">Tap to unlock</p>
                                )}
                            </div>
                        </div>
                        <ArrowRight size={20} className="text-gray-300 dark:text-gray-600 group-hover:text-medical-600 dark:group-hover:text-medical-400 transition-colors" />
                    </button>
                ))}
            </div>

            <LockedContentModal 
                isOpen={showLockedModal}
                onClose={() => setShowLockedModal(false)}
                contentName="Preproff Papers"
            />
        </div>
    );
};

export default PreproffBlocksPage;
