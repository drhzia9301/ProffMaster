import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { School, ArrowRight } from 'lucide-react';

const PreproffCollegesPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { block } = location.state || {};
    const colleges = ['KMC', 'KGMC'];

    if (!block) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-500">No block selected.</p>
                <button onClick={() => navigate('/preproff-blocks')} className="mt-4 text-medical-600 font-bold">Go Back</button>
            </div>
        );
    }

    const handleCollegeSelect = (college: string) => {
        if (college === 'KMC') {
            navigate('/preproff-years', {
                state: { block: block, college: college }
            });
        } else {
            // Placeholder for other colleges
            alert('Coming soon!');
        }
    };

    return (
        <div className="pb-24 space-y-6">
            <div className="flex items-center gap-2 text-gray-500 cursor-pointer" onClick={() => navigate('/preproff-blocks')}>
                <ArrowRight className="rotate-180" size={18} />
                <span className="text-sm font-medium">Back to Blocks</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900">Select College</h2>
            <p className="text-gray-500 -mt-4">Block: <span className="text-medical-600 font-bold">{block}</span></p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {colleges.map((college) => (
                    <button
                        key={college}
                        onClick={() => handleCollegeSelect(college)}
                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-medical-200 transition-all text-left flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center transition-transform group-hover:scale-110">
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
        </div>
    );
};

export default PreproffCollegesPage;
