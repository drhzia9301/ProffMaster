import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { School, ArrowRight } from 'lucide-react';
import AIFilterModal from './AIFilterModal';

const PreproffCollegesPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { block, year } = location.state || {};
    const colleges = ['KMC', 'KGMC', 'NWSM', 'GMC', 'WMC'];
    const [selectedCollege, setSelectedCollege] = useState<string | null>(null);

    // Available colleges for each block/year combination
    const getAvailableColleges = () => {
        if (year === '2023') {
            // Block J: All 5 colleges (KGMC now added)
            if (block === 'Block J') {
                return ['KMC', 'KGMC', 'NWSM', 'GMC', 'WMC'];
            }
            // Block K: All 5 colleges
            if (block === 'Block K') {
                return ['KMC', 'KGMC', 'NWSM', 'GMC', 'WMC'];
            }
            // Block L: All 5 colleges
            if (block === 'Block L') {
                return ['KMC', 'KGMC', 'NWSM', 'GMC', 'WMC'];
            }
            // Block M1: WMC, GMC, KGMC, KMC (no NWSM)
            if (block === 'Block M1') {
                return ['KMC', 'KGMC', 'GMC', 'WMC'];
            }
            // Block M2: All 5 colleges (KGMC and KMC now added)
            if (block === 'Block M2') {
                return ['KMC', 'KGMC', 'NWSM', 'GMC', 'WMC'];
            }
        }
        if (year === '2024') {
            // Block J: KMC only (from jkmc2024.txt)
            if (block === 'Block J') {
                return ['KMC'];
            }
            // Block L: GMC, KMC, WMC
            if (block === 'Block L') {
                return ['KMC', 'GMC', 'WMC'];
            }
            // Block M1: GMC, WMC (KMC moved to M2)
            if (block === 'Block M1') {
                return ['GMC', 'WMC'];
            }
            // Block M2: GMC, KMC
            if (block === 'Block M2') {
                return ['KMC', 'GMC'];
            }
        }
        if (year === '2025') {
            // Block J: KMC, NWSM, and WMC
            if (block === 'Block J') {
                return ['KMC', 'NWSM', 'WMC'];
            }
            // Block K: NWSM and WMC
            if (block === 'Block K') {
                return ['NWSM', 'WMC'];
            }
            // Block L: KMC and NWSM
            if (block === 'Block L') {
                return ['KMC', 'NWSM'];
            }
            // Block M1: KMC and NWSM
            if (block === 'Block M1') {
                return ['KMC', 'NWSM'];
            }
            // Block M2: NWSM
            if (block === 'Block M2') {
                return ['NWSM'];
            }
        }
        return [];
    };

    const availableColleges = getAvailableColleges();

    if (!block) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-500">No block selected.</p>
                <button onClick={() => navigate('/preproff-blocks')} className="mt-4 text-medical-600 font-bold">Go Back</button>
            </div>
        );
    }

    const handleCollegeSelect = (college: string) => {
        if (availableColleges.includes(college)) {
            setSelectedCollege(college);
        } else {
            alert('Coming soon!');
        }
    };

    const handleStartQuiz = (filter: 'all' | 'incorrect' | 'favorites') => {
        if (!selectedCollege) return;
        
        navigate('/quiz', {
            state: {
                mode: 'exam',
                type: 'preproff',
                block: block,
                college: selectedCollege,
                year: year,
                timeLimit: 120,
                filter: filter
            }
        });
        setSelectedCollege(null);
    };

    return (
        <div className="pb-24 space-y-6">
            <div className="flex items-center gap-2 text-gray-500 cursor-pointer" onClick={() => navigate('/preproff-years', { state: { block } })}>
                <ArrowRight className="rotate-180" size={18} />
                <span className="text-sm font-medium">Back to Years</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900">Select College</h2>
            <p className="text-gray-500 -mt-4">Block: <span className="text-medical-600 font-bold">{block}</span> • Year: <span className="text-medical-600 font-bold">{year}</span></p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {colleges.map((college) => {
                    const isAvailable = availableColleges.includes(college);
                    return (
                        <button
                            key={college}
                            onClick={() => handleCollegeSelect(college)}
                            disabled={!isAvailable}
                            className={`p-5 rounded-2xl border shadow-sm transition-all text-left flex items-center justify-between group ${
                                isAvailable
                                    ? 'bg-white border-gray-100 hover:shadow-md hover:border-medical-200 cursor-pointer'
                                    : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform ${
                                    isAvailable
                                        ? 'bg-teal-50 text-teal-600 group-hover:scale-110'
                                        : 'bg-gray-200 text-gray-400'
                                }`}>
                                    <School size={24} />
                                </div>
                                <div>
                                    <h3 className={`font-bold ${isAvailable ? 'text-gray-900' : 'text-gray-500'}`}>{college}</h3>
                                    {!isAvailable && <p className="text-xs text-gray-400">Coming Soon</p>}
                                </div>
                            </div>
                            <ArrowRight size={20} className={isAvailable ? 'text-gray-300 group-hover:text-medical-600 transition-colors' : 'text-gray-300'} />
                        </button>
                    );
                })}
            </div>

            {selectedCollege && (
                <AIFilterModal
                    isOpen={!!selectedCollege}
                    onClose={() => setSelectedCollege(null)}
                    onStart={handleStartQuiz}
                    paperName={`${selectedCollege} ${block} ${year}`}
                />
            )}
        </div>
    );
};

export default PreproffCollegesPage;
