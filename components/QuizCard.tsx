import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import { CheckCircle, XCircle, Sparkles, HelpCircle, Flag, Settings, Loader2 } from 'lucide-react';
import { getExplanationFromAI, getHintFromAI, getHighYieldPointsFromAI } from '../services/geminiService';
import { toggleBookmark, getBookmarks } from '../services/storageService';
import { hasApiKey } from '../services/apiKeyService';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface QuizCardProps {
  question: Question;
  onAnswer: (selectedOptionIndex: number, isCorrect: boolean) => void;
  onNext: () => void;
  isLast: boolean;
  isSolved?: boolean; // New prop
}

const QuizCard: React.FC<QuizCardProps> = ({ question, onAnswer, onNext, isLast, isSolved }) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiHighYield, setAiHighYield] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);

  useEffect(() => {
    // Reset state when question changes
    setSelected(null);
    setIsRevealed(false);
    setAiHint(null);
    setAiExplanation(null);
    setAiHighYield(null);
    setIsLoadingAI(false);
    const bookmarks = getBookmarks();
    setIsBookmarked(bookmarks.includes(question.id));
    setApiKeyConfigured(hasApiKey());
  }, [question]);

  const handleOptionClick = (index: number) => {
    if (isRevealed) return;
    setSelected(index);
    setIsRevealed(true);
    const isCorrect = index === question.correctIndex;
    onAnswer(index, isCorrect);
  };

  const handleGetHint = async () => {
    if (!apiKeyConfigured) {
      navigate('/settings');
      return;
    }
    if (aiHint) return;
    setIsLoadingAI(true);
    const hint = await getHintFromAI(question);
    setAiHint(hint);
    setIsLoadingAI(false);
  };

  const handleGetAIExplanation = async () => {
    if (!apiKeyConfigured) {
      navigate('/settings');
      return;
    }
    if (aiExplanation) return;
    setIsLoadingAI(true);
    const explanation = await getExplanationFromAI(
      question,
      selected !== null ? question.options[selected] : 'None'
    );
    setAiExplanation(explanation);
    setIsLoadingAI(false);
  };

  const handleGetHighYield = async () => {
    if (!apiKeyConfigured) {
      navigate('/settings');
      return;
    }
    if (aiHighYield) return;
    setIsLoadingAI(true);
    try {
      const points = await getHighYieldPointsFromAI(question);
      if (points.includes("API key not valid") || points.includes("API Key not found")) {
        setAiHighYield("Error: Invalid API Key. Please check your settings.");
      } else {
        setAiHighYield(points);
      }
    } catch (error) {
      console.error("Error fetching high yield points:", error);
      setAiHighYield("Failed to fetch high yield points.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleBookmark = () => {
    toggleBookmark(question.id);
    setIsBookmarked(!isBookmarked);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-2xl mx-auto">
      {/* Card Header */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-medical-50 text-medical-700">
              {question.subject}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              {question.difficulty}
            </span>
            {isSolved && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                <CheckCircle size={12} /> Solved
              </span>
            )}
          </div>
          <h2 className="text-lg font-semibold text-gray-900 leading-snug">
            {question.text}
          </h2>
        </div>
        <button
          onClick={handleBookmark}
          className={`p-2 rounded-full transition-colors ${isBookmarked ? 'text-red-500 bg-red-50' : 'text-gray-300 hover:bg-gray-50'}`}
        >
          <Flag size={20} fill={isBookmarked ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Options */}
      <div className="p-6 space-y-3">
        {question.options.map((option, index) => {
          let cardClass = "w-full p-4 text-left rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ";

          if (!isRevealed) {
            cardClass += "border-gray-100 hover:border-medical-200 hover:bg-medical-50";
          } else {
            if (index === question.correctIndex) {
              cardClass += "border-green-500 bg-green-50 text-green-900";
            } else if (index === selected) {
              cardClass += "border-red-500 bg-red-50 text-red-900";
            } else {
              cardClass += "border-gray-100 opacity-50";
            }
          }

          return (
            <button
              key={index}
              disabled={isRevealed}
              onClick={() => handleOptionClick(index)}
              className={cardClass}
            >
              <div className="flex items-center gap-4">
                <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold 
                  ${isRevealed && index === question.correctIndex ? 'bg-green-200 text-green-800' :
                    isRevealed && index === selected ? 'bg-red-200 text-red-800' :
                      'bg-gray-100 text-gray-500 group-hover:bg-white'}`}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="font-medium">{option}</span>
              </div>

              {isRevealed && index === question.correctIndex && <CheckCircle size={20} className="text-green-600" />}
              {isRevealed && index === selected && index !== question.correctIndex && <XCircle size={20} className="text-red-600" />}
            </button>
          );
        })}
      </div>

      {/* Actions & Feedback */}
      <div className="px-6 pb-6 space-y-4">

        {!isRevealed && (
          <div className="flex justify-end">
            <button
              onClick={handleGetHint}
              disabled={isLoadingAI}
              className="flex items-center gap-2 text-sm text-medical-600 hover:text-medical-700 font-medium px-4 py-2 rounded-lg hover:bg-medical-50 transition-colors"
            >
              {!apiKeyConfigured ? (
                <>
                  <Settings size={16} />
                  Configure API Key for AI Hints
                </>
              ) : (
                <>
                  {isLoadingAI && !aiHint ? <Loader2 size={16} className="animate-spin" /> : <HelpCircle size={16} />}
                  {aiHint ? 'Hint Revealed' : (isLoadingAI && !aiHint ? 'Thinking...' : 'Ask AI for a Hint')}
                </>
              )}
            </button>
          </div>
        )}

        {aiHint && !isRevealed && (
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800 animate-fade-in">
            <p className="font-semibold flex items-center gap-2 mb-1">
              <Sparkles size={14} /> AI Hint:
            </p>
            <div className="prose prose-sm max-w-none text-blue-800">
              <ReactMarkdown>
                {aiHint}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {isRevealed && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600 font-semibold mb-1">Explanation:</p>
              <p className="text-sm text-gray-800">{question.explanation}</p>
            </div>

            {/* AI Detailed Explanation */}
            {!aiExplanation ? (
              <button
                onClick={handleGetAIExplanation}
                disabled={isLoadingAI}
                className="w-full py-3 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 font-medium flex items-center justify-center gap-2 hover:bg-purple-100 transition-colors"
              >
                {!apiKeyConfigured ? (
                  <>
                    <Settings size={18} />
                    Configure API Key for AI Analysis
                  </>
                ) : (
                  <>
                    {isLoadingAI ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    {isLoadingAI ? 'Consulting AI...' : 'Ask AI for deeper analysis'}
                  </>
                )}
              </button>
            ) : (
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-sm text-purple-900">
                <p className="font-semibold flex items-center gap-2 mb-1 text-purple-700">
                  <Sparkles size={14} /> AI Analysis:
                </p>
                <div className="prose prose-sm max-w-none text-purple-900">
                  <ReactMarkdown>
                    {aiExplanation}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* AI High Yield Points */}
            {!aiHighYield ? (
              <button
                onClick={handleGetHighYield}
                disabled={isLoadingAI}
                className="w-full py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 font-medium flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors"
              >
                {!apiKeyConfigured ? (
                  <>
                    <Settings size={18} />
                    Configure API Key for High Yield Points
                  </>
                ) : (
                  <>
                    {isLoadingAI ? <Loader2 size={18} className="animate-spin" /> : <Flag size={18} />}
                    {isLoadingAI ? 'Generating Points...' : 'Get High Yield Points'}
                  </>
                )}
              </button>
            ) : (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm text-amber-900">
                <p className="font-semibold flex items-center gap-2 mb-1 text-amber-700">
                  <Flag size={14} /> High Yield Points:
                </p>
                <div className="prose prose-sm max-w-none text-amber-900">
                  <ReactMarkdown>
                    {aiHighYield}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            <button
              onClick={onNext}
              className="w-full py-3.5 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-semibold text-lg shadow-lg shadow-medical-500/20 transition-all active:scale-[0.98]"
            >
              {isLast ? 'Finish Quiz' : 'Next Question'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizCard;
