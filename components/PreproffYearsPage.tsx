import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronRight } from 'lucide-react';

const PreproffYearsPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { block } = location.state || {};

    // Get available years for the selected block
    const getAvailableYears = () => {
        // Block J has 2023, 2024, 2025
        if (block === 'Block J') {
            return ['2023', '2024', '2025'];
        }
        // Block K has 2023, 2025
        if (block === 'Block K') {
            return ['2023', '2025'];
        }
        // Block L has 2023, 2024, 2025
        if (block === 'Block L') {
            return ['2023', '2024', '2025'];
        }
        // Block M1 has 2023, 2024, 2025
        if (block === 'Block M1') {
            return ['2023', '2024', '2025'];
        }
        // Block M2 has 2023, 2024
        if (block === 'Block M2') {
            return ['2023', '2024'];
        }
        return [];
    };

    const availableYears = getAvailableYears();

    const handleYearSelect = (year: string) => {
        // Navigate to colleges page with block and year
        navigate('/preproff-colleges', {
            state: { block, year }
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white p-6 pb-24">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-8">
                <button
                    onClick={() => navigate('/preproff-blocks')}
                    className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Blocks
                </button>
                <h1 className="text-3xl font-bold mb-2">Select Year</h1>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                    <span className="px-2 py-1 bg-gray-200 dark:bg-slate-800 rounded text-xs">{block}</span>
                </div>
            </div>

            {/* Years Grid */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 2025 */}
                {availableYears.includes('2025') ? (
                    <button
                        onClick={() => handleYearSelect('2025')}
                        className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-all group text-left flex items-center justify-between shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">2025</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Latest Paper</p>
                            </div>
                        </div>
                        <ChevronRight className="text-gray-400 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                    </button>
                ) : (
                    <div className="bg-gray-100 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-200 dark:border-slate-700/50 opacity-50 cursor-not-allowed flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-500/10 flex items-center justify-center text-gray-500">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-500">2025</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-600">Coming Soon</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2024 */}
                {availableYears.includes('2024') ? (
                    <button
                        onClick={() => handleYearSelect('2024')}
                        className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-slate-700/50 transition-all group text-left flex items-center justify-between shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">2024</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Recent Paper</p>
                            </div>
                        </div>
                        <ChevronRight className="text-gray-400 dark:text-gray-600 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" />
                    </button>
                ) : (
                    <div className="bg-gray-100 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-200 dark:border-slate-700/50 opacity-50 cursor-not-allowed flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-500/10 flex items-center justify-center text-gray-500">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-500">2024</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-600">Coming Soon</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2023 */}
                {availableYears.includes('2023') ? (
                    <button
                        onClick={() => handleYearSelect('2023')}
                        className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-slate-700/50 transition-all group text-left flex items-center justify-between shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">2023</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Multiple Colleges</p>
                            </div>
                        </div>
                        <ChevronRight className="text-gray-400 dark:text-gray-600 group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors" />
                    </button>
                ) : (
                    <div className="bg-gray-100 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-200 dark:border-slate-700/50 opacity-50 cursor-not-allowed flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-500/10 flex items-center justify-center text-gray-500">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-500">2023</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-600">Coming Soon</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Export default for lazy loading
export default PreproffYearsPage;
