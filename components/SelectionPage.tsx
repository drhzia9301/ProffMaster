import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, FileText, ArrowRight } from 'lucide-react';

const SelectionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-24 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Select Question Bank</h2>
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => navigate('/subjects')}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-medical-200 transition-all text-left flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-110">
              <Book size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">KMU Past Papers</h3>
              <p className="text-sm text-gray-500">Practice questions from previous years</p>
            </div>
          </div>
          <ArrowRight size={24} className="text-gray-300 group-hover:text-medical-600 transition-colors" />
        </button>

        <button
          onClick={() => navigate('/preproff-blocks')}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-medical-200 transition-all text-left flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center transition-transform group-hover:scale-110">
              <FileText size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Preproff Papers</h3>
              <p className="text-sm text-gray-500">College-specific pre-professional exams</p>
            </div>
          </div>
          <ArrowRight size={24} className="text-gray-300 group-hover:text-medical-600 transition-colors" />
        </button>
      </div>
    </div>
  );
};

export default SelectionPage;
