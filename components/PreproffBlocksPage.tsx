import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowRight } from 'lucide-react';

const PreproffBlocksPage = () => {
    const navigate = useNavigate();
    const blocks = ['Block J', 'Block K', 'Block L', 'Block M1', 'Block M2'];

    return (
        <div className="pb-24 space-y-6">
            <div className="flex items-center gap-2 text-gray-500 cursor-pointer" onClick={() => navigate('/selection')}>
                <ArrowRight className="rotate-180" size={18} />
                <span className="text-sm font-medium">Back to Selection</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900">Select Block</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {blocks.map((block) => (
                    <button
                        key={block}
                        onClick={() => navigate('/preproff-colleges', { state: { block } })}
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
        </div>
    );
};

export default PreproffBlocksPage;
