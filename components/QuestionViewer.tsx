import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { Question } from '../types';
import ReactMarkdown from 'react-markdown';

const QuestionViewer: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const question = location.state?.question as Question;
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);

    if (!question) {
        return (
            <div className="p-8 text-center">
                <p>No question selected.</p>
                <button onClick={() => navigate(-1)} className="text-medical-600 font-bold mt-4">Go Back</button>
            </div>
        );
    }

    const handleOptionClick = (index: number) => {
        if (selectedOption !== null) return; // Prevent changing answer
        setSelectedOption(index);
        setShowExplanation(true);
    };

    const isCorrect = selectedOption === question.correctIndex;

    return (
        <div className="pb-24 space-y-6">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft size={20} />
                <span className="font-medium">Back to List</span>
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex gap-2 mb-4">
                        <span className="text-xs font-bold px-2 py-1 rounded bg-medical-50 text-medical-700">
                            {question.subject}
                        </span>
                        <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-600">
                            Viewer Mode (No Stats)
                        </span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 leading-relaxed">
                        {question.text}
                    </h2>
                </div>

                <div className="p-6 space-y-3">
                    {question.options.map((option, index) => {
                        let stateClass = "border-gray-200 hover:border-gray-300 hover:bg-gray-50";
                        let icon = null;

                        if (selectedOption !== null) {
                            if (index === question.correctIndex) {
                                stateClass = "border-green-500 bg-green-50 text-green-900";
                                icon = <CheckCircle2 size={20} className="text-green-600" />;
                            } else if (index === selectedOption) {
                                stateClass = "border-red-500 bg-red-50 text-red-900";
                                icon = <XCircle size={20} className="text-red-600" />;
                            } else {
                                stateClass = "border-gray-100 opacity-50";
                            }
                        }

                        return (
                            <button
                                key={index}
                                onClick={() => handleOptionClick(index)}
                                disabled={selectedOption !== null}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center ${stateClass}`}
                            >
                                <div className="flex gap-3">
                                    <span className="font-bold opacity-60">{String.fromCharCode(65 + index)}.</span>
                                    <span>{option}</span>
                                </div>
                                {icon}
                            </button>
                        );
                    })}
                </div>

                {showExplanation && (
                    <div className="p-6 bg-blue-50 border-t border-blue-100 animate-fade-in">
                        <h3 className="font-bold text-blue-900 mb-2">Explanation</h3>
                        <div className="text-blue-800 text-sm leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{question.explanation || "No explanation available."}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionViewer;
