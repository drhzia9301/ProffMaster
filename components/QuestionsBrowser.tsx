import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronRight, BookOpen, CheckCircle, Star, X } from 'lucide-react';
import { Subject, Question, Attempt } from '../types';
import { getAllQuestions, getQuestionsBySubject, getAttempts, getBookmarks } from '../services/storageService';
import { SUBJECT_COLORS } from '../constants';

const QuestionsBrowser: React.FC = () => {
    const navigate = useNavigate();
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
    const [availableTopics, setAvailableTopics] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [attempts, setAttempts] = useState<Record<string, Attempt[]>>({});
    const [bookmarks, setBookmarks] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Question[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const subjects = Object.values(Subject);

    // Load all questions on mount for search
    useEffect(() => {
        getAllQuestions().then(qs => {
            setAllQuestions(qs);
            setAttempts(getAttempts());
            setBookmarks(getBookmarks());
        });
    }, []);

    // Handle search
    useEffect(() => {
        if (searchQuery.trim().length >= 2) {
            setIsSearching(true);
            const query = searchQuery.toLowerCase();
            const results = allQuestions.filter(q => 
                q.text.toLowerCase().includes(query) ||
                q.options.some(opt => opt.toLowerCase().includes(query)) ||
                q.tags.some(tag => tag.toLowerCase().includes(query)) ||
                q.subject.toLowerCase().includes(query)
            ).slice(0, 50); // Limit to 50 results for performance
            setSearchResults(results);
        } else {
            setIsSearching(false);
            setSearchResults([]);
        }
    }, [searchQuery, allQuestions]);

    useEffect(() => {
        if (selectedSubject) {
            setLoading(true);
            getQuestionsBySubject(selectedSubject as Subject).then(qs => {
                setQuestions(qs);
                const topics = Array.from(new Set(qs.flatMap(q => q.tags || []))).sort();
                setAvailableTopics(topics);
                setFilteredQuestions([]);
                setAttempts(getAttempts());
                setBookmarks(getBookmarks());
                setLoading(false);
            });
        } else {
            setQuestions([]);
            setAvailableTopics([]);
            setFilteredQuestions([]);
        }
    }, [selectedSubject]);

    useEffect(() => {
        if (selectedTopic) {
            setFilteredQuestions(questions.filter(q => q.tags.includes(selectedTopic)));
        } else {
            setFilteredQuestions([]);
        }
    }, [selectedTopic, questions]);

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setIsSearching(false);
    };

    const renderQuestionCard = (q: Question, idx: number) => {
        const isSolved = attempts[q.id]?.some(a => a.isCorrect);
        const isBookmarked = bookmarks.includes(q.id);

        return (
            <button
                key={q.id}
                onClick={() => navigate('/questions/view', { state: { question: q } })}
                className="w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-medical-200 text-left group transition-all"
            >
                <div className="flex gap-2 mb-2 items-center flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-bold">
                        {q.id.split('_')[1] || `#${idx + 1}`}
                    </span>
                    <span 
                        className="text-[10px] px-2 py-0.5 rounded text-white font-medium"
                        style={{ backgroundColor: SUBJECT_COLORS[q.subject] || '#6b7280' }}
                    >
                        {q.subject}
                    </span>
                    {q.tags.slice(0, 1).map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                            {t}
                        </span>
                    ))}
                    <div className="ml-auto flex gap-1">
                        {isSolved && <CheckCircle size={16} className="text-green-500" />}
                        {isBookmarked && <Star size={16} className="text-yellow-400 fill-yellow-400" />}
                    </div>
                </div>
                <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-medical-700 transition-colors">
                    {q.text}
                </p>
            </button>
        );
    };

    return (
        <div className="pb-24 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Question Bank</h2>

            {/* Search Bar */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={20} className="text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search questions by keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                />
                {searchQuery && (
                    <button
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Search Results */}
            {isSearching ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            {searchResults.length > 0 
                                ? `Found ${searchResults.length}${searchResults.length === 50 ? '+' : ''} questions`
                                : 'No questions found'
                            }
                        </p>
                        <button
                            onClick={clearSearch}
                            className="text-sm text-medical-600 font-medium hover:text-medical-700"
                        >
                            Clear search
                        </button>
                    </div>
                    <div className="space-y-3">
                        {searchResults.map((q, idx) => renderQuestionCard(q, idx))}
                    </div>
                </div>
            ) : !selectedSubject ? (
                /* Subject Selector */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {subjects.map((subject) => (
                        <button
                            key={subject}
                            onClick={() => setSelectedSubject(subject)}
                            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-medical-200 text-left flex items-center gap-4 transition-all"
                        >
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white"
                                style={{ backgroundColor: SUBJECT_COLORS[subject] }}
                            >
                                {subject.charAt(0)}
                            </div>
                            <span className="font-bold text-gray-900">{subject}</span>
                            <ChevronRight className="ml-auto text-gray-300" size={20} />
                        </button>
                    ))}
                </div>
            ) : (
                /* Subject Selected - Show Topics and Questions */
                <div className="space-y-4">
                    <button
                        onClick={() => { setSelectedSubject(null); setSelectedTopic(null); }}
                        className="text-sm text-gray-500 flex items-center gap-1 hover:text-medical-600"
                    >
                        ← Back to Subjects
                    </button>

                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-gray-900">{selectedSubject}</h3>
                            <span className="text-xs text-gray-400 animate-pulse">Scroll right for more →</span>
                        </div>

                        {/* Topic Filter */}
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {availableTopics.map(topic => (
                                <button
                                    key={topic}
                                    onClick={() => setSelectedTopic(topic)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                        selectedTopic === topic 
                                            ? 'bg-medical-600 text-white' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Questions List */}
                    <div className="space-y-3">
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Loading questions...</div>
                        ) : !selectedTopic ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-gray-100 border-dashed">
                                <p className="text-gray-500 font-medium">Select a topic above to view questions</p>
                            </div>
                        ) : filteredQuestions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No questions found.</div>
                        ) : (
                            filteredQuestions.map((q, idx) => renderQuestionCard(q, idx))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionsBrowser;
