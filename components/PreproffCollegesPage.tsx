import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { School, ArrowRight } from 'lucide-react';
import AIFilterModal from './AIFilterModal';

const PreproffCollegesPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { block, year } = location.state || {};
    // Updated colleges list with new colleges: AMC, RMC, KIMS, NMC
    const colleges = ['KMC', 'KGMC', 'NWSM', 'GMC', 'WMC', 'AMC', 'RMC', 'KIMS', 'NMC'];
    const [selectedCollege, setSelectedCollege] = useState<string | null>(null);

    // Available colleges for each block/year combination
    const getAvailableColleges = () => {
        if (year === '2023') {
            // Block J: Original 5 colleges + KIMS and RMC
            if (block === 'Block J') {
                return ['KMC', 'KGMC', 'NWSM', 'GMC', 'WMC', 'KIMS', 'RMC'];
            }
            // Block K: All original 5 colleges
            if (block === 'Block K') {
                return ['KMC', 'KGMC', 'NWSM', 'GMC', 'WMC'];
            }
            // Block L: All original 5 colleges
            if (block === 'Block L') {
                return ['KMC', 'KGMC', 'NWSM', 'GMC', 'WMC'];
            }
            // Block M1: WMC, GMC, KGMC, KMC + AMC, NMC (NWSM removed - merged to 2025)
            if (block === 'Block M1') {
                return ['KMC', 'KGMC', 'GMC', 'WMC', 'AMC', 'NMC'];
            }
            // Block M2: All 5 colleges + KIMS (NWSM removed - merged to 2025)
            if (block === 'Block M2') {
                return ['KMC', 'KGMC', 'GMC', 'WMC', 'KIMS'];
            }
        }
        if (year === '2024') {
            // Block J: KMC + GMC, WMC (2024 papers - removed KGMC)
            if (block === 'Block J') {
                return ['KMC', 'GMC', 'WMC'];
            }
            // Block L: GMC, KMC, WMC
            if (block === 'Block L') {
                return ['KMC', 'GMC', 'WMC'];
            }
            // Block M1: GMC, WMC + KMC (new 2024)
            if (block === 'Block M1') {
                return ['GMC', 'WMC', 'KMC'];
            }
            // Block M2: GMC, KMC + KGMC (new 2024)
            if (block === 'Block M2') {
                return ['KMC', 'GMC', 'KGMC'];
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
            // Block L: KMC, KGMC, NWSM and WMC
            if (block === 'Block L') {
                return ['KMC', 'KGMC', 'NWSM', 'WMC'];
            }
            // Block M1: KMC, KGMC and NWSM
            if (block === 'Block M1') {
                return ['KMC', 'KGMC', 'NWSM'];
            }
            // Block M2: KGMC and NWSM
            if (block === 'Block M2') {
                return ['KGMC', 'NWSM'];
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
                {availableColleges.map((college) => (
                    <button
                        key={college}
                        onClick={() => handleCollegeSelect(college)}
                        className="bg-white border-gray-100 hover:shadow-md hover:border-medical-200 cursor-pointer p-5 rounded-2xl border shadow-sm transition-all text-left flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform bg-teal-50 text-teal-600 group-hover:scale-110">
                                <School size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{college}</h3>
                            </div>
                        </div>
                        <ArrowRight size={20} className="text-gray-300 group-hover:text-medical-600 transition-colors" />
                    </button>
                ))}
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
