import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronRight } from 'lucide-react';
import AIFilterModal from './AIFilterModal';

const PreproffYearsPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { block, college } = location.state || {};

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);

    const handleYearSelect = (year: string) => {
        setSelectedYear(year);
        setIsFilterModalOpen(true);
    };

    const handleStartQuiz = (filter: 'all' | 'incorrect' | 'favorites') => {
        setIsFilterModalOpen(false);
        if (!selectedYear) return;

        navigate('/quiz', {
            state: {
                mode: 'exam',
                type: 'preproff',
                block: block,
                college: college,
                year: selectedYear,
                timeLimit: 120, // Default 2 hours for full paper
                filter: filter // Pass the filter mode
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 pb-24">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Colleges
                </button>
                <h1 className="text-3xl font-bold mb-2">Select Year</h1>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <span className="px-2 py-1 bg-slate-800 rounded text-xs">{block}</span>
                    <span>•</span>
                    <span className="px-2 py-1 bg-slate-800 rounded text-xs">{college}</span>
                </div>
            </div>

            {/* Years Grid */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={() => handleYearSelect('2025')}
                    className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-blue-500 hover:bg-slate-700/50 transition-all group text-left flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">2025</h3>
                            <p className="text-sm text-gray-400">Latest Paper</p>
                        </div>
                    </div>
                    <ChevronRight className="text-gray-600 group-hover:text-blue-400 transition-colors" />
                </button>

                {/* Placeholder for future years */}
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 opacity-50 cursor-not-allowed flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-500/10 flex items-center justify-center text-gray-500">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-500">2024</h3>
                            <p className="text-sm text-gray-600">Coming Soon</p>
                        </div>
                    </div>
                </div>
            </div>

            <AIFilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onStart={handleStartQuiz}
                paperName={`${college} ${block} ${selectedYear}`}
            />
        </div>
    );
};

// Export default for lazy loading
export default PreproffYearsPage;
