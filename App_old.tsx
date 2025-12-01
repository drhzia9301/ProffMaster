import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import QuizCard from './components/QuizCard';
import SettingsPage from './components/Settings';
import QuestionsBrowser from './components/QuestionsBrowser';
import QuestionViewer from './components/QuestionViewer';
import { SUBJECT_COLORS } from './constants.ts';
import { Subject, Question, Attempt } from './types';
import { saveAttempt, getAllQuestions, getQuestionsBySubject, getWeakQuestions, getAttempts, getBookmarks, toggleBookmark, getCachedQuestionCount, getCachedSubjectCounts } from './services/storageService';
import { ArrowRight, Play, Book, Clock, Search, AlertTriangle, BrainCircuit, CheckCircle2, Trophy, Settings, Sliders, Filter, CheckSquare, Square, LogIn, Sparkles, Skull, Activity, FlaskConical, Microscope, Pill, Stethoscope, Scissors, Eye, Ear, Users, Scale, Baby, Brain, Heart } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import { getSessionAnalysisFromAI } from './services/geminiService';
import { hasApiKey } from './services/apiKeyService';
import { dbService } from './services/databaseService';

const SUBJECT_ICONS: Record<string, React.ElementType> = {
  [Subject.ENT]: Ear,
  [Subject.Ophthalmology]: Eye,
  [Subject.Medicine]: Stethoscope,
  [Subject.Surgery]: Scissors,
  [Subject['Community Medicine']]: Users,
  [Subject['Forensic Medicine']]: Scale,
  [Subject.Pathology]: Microscope,
  [Subject.Pharmacology]: Pill,
  [Subject.Gynecology]: Baby,
  [Subject.Psychiatry]: Brain,
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// --- Helper Components ---

const Timer: React.FC<{ durationSeconds: number; onTimeUp: () => void }> = ({ durationSeconds, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft(p => p - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className={`flex items-center gap-2 font-mono font-bold text-sm px-3 py-1.5 rounded-lg ${timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
      <Clock size={16} />
      {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};

// --- Page Components ---

const Home = () => {
  const navigate = useNavigate();
  const [questionsCount, setQuestionsCount] = useState(getCachedQuestionCount());

  useEffect(() => {
    getAllQuestions().then(questions => {
      setQuestionsCount(questions.length);
    });
  }, []);

  return (
    <div className="pb-24 space-y-6">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-medical-600 to-medical-500 rounded-2xl p-6 text-white shadow-lg shadow-medical-500/20 overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">KMU Prep Dashboard</h2>
          <p className="text-medical-100 mb-6">You have {questionsCount} high-yield questions available.</p>

          <button
            onClick={() => navigate('/subjects')}
            className="bg-white text-medical-600 px-6 py-3 rounded-xl font-bold shadow-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Play size={18} fill="currentColor" />
            Start Practicing
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/subjects')}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-medical-200 text-left group transition-all"
        >
          <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center text-purple-600 mb-3 group-hover:scale-110 transition-transform">
            <Book size={20} />
          </div>
          <h3 className="font-bold text-gray-900">Subject Wise</h3>
          <p className="text-xs text-gray-500 mt-1">Focus on specific systems</p>
        </button>

        <button
          onClick={() => navigate('/review')}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-medical-200 text-left group transition-all"
        >
          <div className="bg-red-100 w-10 h-10 rounded-lg flex items-center justify-center text-red-600 mb-3 group-hover:scale-110 transition-transform">
            <BrainCircuit size={20} />
          </div>
          <h3 className="font-bold text-gray-900">Smart Review</h3>
          <p className="text-xs text-gray-500 mt-1">Revise weak areas</p>
        </button>
      </div>

      <button
        onClick={() => navigate('/search')}
        className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-medical-200 text-left flex items-center gap-4 group transition-all"
      >
        <div className="bg-gray-100 w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 group-hover:bg-gray-200">
          <Search size={20} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Search Question Bank</h3>
          <p className="text-xs text-gray-500 mt-1">Find questions by keyword</p>
        </div>
        <ArrowRight className="ml-auto text-gray-300 group-hover:text-medical-600" size={20} />
      </button>
    </div>
  );
};
const SubjectsPage = () => {
  const navigate = useNavigate();
  const subjects = Object.values(Subject);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>(getCachedSubjectCounts());

  useEffect(() => {
    getAllQuestions().then(questions => {
      setAllQuestions(questions);
      setSubjectCounts(getCachedSubjectCounts());
    });
  }, []);

  return (
    <div className="pb-24 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Browse by Subject</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {subjects.map((subject) => {
          const count = subjectCounts[subject] || 0;
          const Icon = SUBJECT_ICONS[subject] || Book;
          const color = SUBJECT_COLORS[subject];

          return (
            <button
              key={subject}
              onClick={() => navigate('/setup', { state: { subject } })}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-medical-200 transition-all text-left flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${color}20`, color: color }}
                >
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{subject}</h3>
                  <p className="text-xs text-gray-500">{count} Questions</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-300 group-hover:text-medical-600 transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

const QuizSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { subject } = location.state || {};

  const [mode, setMode] = useState<'study' | 'timed'>('study');
  const [count, setCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(15);
  const [maxQuestions, setMaxQuestions] = useState(0);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [subjectQuestions, setSubjectQuestions] = useState<Question[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'unsolved' | 'bookmarked'>('all');
  const [attempts, setAttempts] = useState<Record<string, Attempt[]>>({});
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    if (!subject) {
      navigate('/subjects');
      return;
    }

    // Load attempts and bookmarks
    const loadedAttempts = getAttempts();
    const loadedBookmarks = getBookmarks();
    setAttempts(loadedAttempts);
    setBookmarks(loadedBookmarks);

    getQuestionsBySubject(subject).then(questions => {
      setSubjectQuestions(questions);
      setMaxQuestions(questions.length);
      setCount(Math.min(10, questions.length));

      // Extract unique topics
      const topics = Array.from(new Set(questions.flatMap(q => q.tags || []))).sort();
      setAvailableTopics(topics);
      setSelectedTopics(topics); // Select all by default
    });
  }, [subject, navigate]);

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(prev => prev.filter(t => t !== topic));
    } else {
      setSelectedTopics(prev => [...prev, topic]);
    }
  };

  const toggleAllTopics = () => {
    if (selectedTopics.length === availableTopics.length) {
      setSelectedTopics([]);
    } else {
      setSelectedTopics([...availableTopics]);
    }
  };

  // Calculate available questions based on selected topics AND status
  const filteredQuestions = subjectQuestions.filter(q => {
    // 1. Filter by Topic
    const matchesTopic = q.tags.some(t => selectedTopics.includes(t));
    if (!matchesTopic) return false;

    // 2. Filter by Status
    if (statusFilter === 'all') return true;

    const isSolved = attempts[q.id]?.some(a => a.isCorrect);
    const isBookmarked = bookmarks.includes(q.id);

    if (statusFilter === 'solved') return isSolved;
    if (statusFilter === 'unsolved') return !isSolved;
    if (statusFilter === 'bookmarked') return isBookmarked;

    return true;
  });

  const filteredQuestionCount = filteredQuestions.length;

  // Update max and count when topics/status change
  useEffect(() => {
    const newMax = filteredQuestionCount;
    if (count > newMax) setCount(newMax);
    if (newMax === 0) setCount(0);
  }, [selectedTopics, statusFilter, filteredQuestionCount]);

  const handleStart = () => {
    navigate('/quiz', {
      state: {
        mode: mode === 'timed' ? 'exam' : 'practice',
        type: 'subject',
        subject,
        questionCount: count,
        timeLimit: mode === 'timed' ? timeLimit : undefined,
        topics: selectedTopics,
        statusFilter // Pass this to QuizSession if needed, or rely on random selection from filtered pool
      }
    });
  };

  if (!subject) return null;

  return (
    <div className="pb-24 space-y-6">
      <div className="flex items-center gap-2 text-gray-500 cursor-pointer" onClick={() => navigate('/subjects')}>
        <ArrowRight className="rotate-180" size={18} />
        <span className="text-sm font-medium">Back to Subjects</span>
      </div>

      <h2 className="text-2xl font-bold text-gray-900">Configure Quiz</h2>
      <p className="text-gray-500 -mt-4">Subject: <span className="text-medical-600 font-bold">{subject}</span></p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Status Filter */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-medical-500" /> Filter Status
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['all', 'solved', 'unsolved', 'bookmarked'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 rounded-lg text-sm font-medium capitalize border transition-all ${statusFilter === status
                  ? 'bg-medical-50 border-medical-500 text-medical-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Topics Selection */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Filter size={20} className="text-medical-500" /> Filter Topics
              <span className="text-xs font-normal bg-medical-50 text-medical-700 px-2 py-0.5 rounded-full">
                {filteredQuestionCount} questions
              </span>
            </h3>
            <button
              onClick={toggleAllTopics}
              className="text-xs font-bold text-medical-600 hover:text-medical-700"
            >
              {selectedTopics.length === availableTopics.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {availableTopics.map(topic => (
              <button
                key={topic}
                onClick={() => toggleTopic(topic)}
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-all whitespace-normal text-left h-auto break-words ${selectedTopics.includes(topic)
                  ? 'bg-medical-50 border-medical-200 text-medical-800'
                  : 'bg-white border-gray-200 text-gray-500'
                  }`}
              >
                {selectedTopics.includes(topic)
                  ? <CheckSquare size={16} className="text-medical-600 shrink-0" />
                  : <Square size={16} className="shrink-0" />}
                <span className="flex-1">{topic}</span>
              </button>
            ))}
          </div>
          {selectedTopics.length === 0 && (
            <p className="text-xs text-red-500 mt-2">Please select at least one topic.</p>
          )}
        </div>

        {/* Mode Selection */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Settings size={20} className="text-medical-500" /> Quiz Mode
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode('study')}
              className={`p-4 rounded-xl border-2 text-center transition-all ${mode === 'study' ? 'border-medical-500 bg-medical-50 text-medical-700' : 'border-gray-100 hover:border-gray-200'}`}
            >
              <Book size={24} className="mx-auto mb-2" />
              <div className="font-bold">Study Mode</div>
              <div className="text-xs opacity-80">Immediate feedback</div>
            </button>
            <button
              onClick={() => setMode('timed')}
              className={`p-4 rounded-xl border-2 text-center transition-all ${mode === 'timed' ? 'border-medical-500 bg-medical-50 text-medical-700' : 'border-gray-100 hover:border-gray-200'}`}
            >
              <Clock size={24} className="mx-auto mb-2" />
              <div className="font-bold">Timed Exam</div>
              <div className="text-xs opacity-80">Exam conditions</div>
            </button>
          </div>
        </div>

        {/* Question Count */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sliders size={20} className="text-medical-500" /> Question Count
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm font-medium">
              <span>1</span>
              <span className="text-medical-600 font-bold">{count} Selected</span>
              <span>{filteredQuestionCount} Max</span>
            </div>
            <input
              type="range"
              min="1"
              max={filteredQuestionCount || 1}
              step="1"
              value={count}
              disabled={filteredQuestionCount < 1}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-medical-600"
            />
            {filteredQuestionCount < 1 && (
              <p className="text-xs text-orange-500">Not enough questions in selected topics.</p>
            )}
          </div>
        </div>

        {/* Time Limit (Conditional) */}
        {mode === 'timed' && (
          <div className="p-6 border-b border-gray-100 animate-fade-in">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-medical-500" /> Time Limit (Minutes)
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[10, 15, 30, 60].map(t => (
                <button
                  key={t}
                  onClick={() => setTimeLimit(t)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap border ${timeLimit === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200'}`}
                >
                  {t} mins
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-6 bg-gray-50">
          <button
            onClick={handleStart}
            disabled={selectedTopics.length === 0 || filteredQuestionCount === 0}
            className="w-full bg-medical-600 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-medical-500/20 hover:bg-medical-700 transition-colors flex items-center justify-center gap-2"
          >
            Start Quiz <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const ReviewPage = () => {
  const navigate = useNavigate();
  const [weakQuestions, setWeakQuestions] = useState<Question[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);

  useEffect(() => {
    getWeakQuestions().then(allWeak => {
      setWeakQuestions(allWeak);

      // Extract subjects
      const subjects = Array.from(new Set(allWeak.map(q => q.subject))).sort();
      setAvailableSubjects(subjects);
      setSelectedSubjects(subjects);
    });
  }, []);

  // Update available topics when subjects change
  useEffect(() => {
    const filteredBySubject = weakQuestions.filter(q => selectedSubjects.includes(q.subject));
    const topics = Array.from(new Set(filteredBySubject.flatMap(q => q.tags || []))).sort();
    setAvailableTopics(topics);
    setSelectedTopics(topics);
  }, [selectedSubjects, weakQuestions]);

  const toggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(prev => prev.filter(s => s !== subject));
    } else {
      setSelectedSubjects(prev => [...prev, subject]);
    }
  };

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(prev => prev.filter(t => t !== topic));
    } else {
      setSelectedTopics(prev => [...prev, topic]);
    }
  };

  const filteredQuestions = weakQuestions.filter(q =>
    selectedSubjects.includes(q.subject) &&
    q.tags.some(t => selectedTopics.includes(t))
  );

  return (
    <div className="pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Smart Review</h2>
        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-lg">{weakQuestions.length} Items</span>
      </div>

      {weakQuestions.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
            <BrainCircuit size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Weak Areas Detected</h3>
            <p className="text-gray-500 text-sm mt-1">
              You have {weakQuestions.length} questions that need attention.
            </p>
          </div>

          {/* Filter Controls */}
          <div className="text-left border-t border-gray-100 pt-4 w-full">
            <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Filter size={16} /> Filter by Subject
            </h4>
            <div className="flex flex-wrap gap-2">
              {availableSubjects.map(subject => (
                <button
                  key={subject}
                  onClick={() => toggleSubject(subject)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${selectedSubjects.includes(subject)
                    ? 'bg-medical-50 border-medical-200 text-medical-700 font-medium'
                    : 'bg-white border-gray-200 text-gray-500'
                    }`}
                >
                  {subject} ({weakQuestions.filter(q => q.subject === subject).length})
                </button>
              ))}
            </div>
          </div>

          {/* Topic Filters */}
          {selectedSubjects.length > 0 && (
            <div className="text-left border-t border-gray-100 pt-4 w-full">
              <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Filter size={16} /> Filter by Topic
              </h4>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableTopics.map(topic => (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${selectedTopics.includes(topic)
                      ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                      : 'bg-white border-gray-200 text-gray-500'
                      }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}


          <button
            onClick={() => navigate('/quiz', { state: { mode: 'practice', type: 'custom_list', questions: filteredQuestions } })}
            disabled={filteredQuestions.length === 0}
            className="w-full bg-red-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
          >
            Start Focused Revision ({filteredQuestions.length})
          </button>
        </div>
      ) : (
        <div className="bg-green-50 rounded-2xl border border-green-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-green-900">All Caught Up!</h3>
          <p className="text-green-700 text-sm mt-2">
            Great job. You don't have any flagged weak areas right now.
          </p>
        </div>
      )
      }

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
        <strong>How it works:</strong> Questions you answer incorrectly or struggle with are automatically added here for spaced repetition.
      </div>
    </div >
  );
};

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);

  useEffect(() => {
    getAllQuestions().then(setAllQuestions);
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setResults([]);
      return;
    }
    const lower = searchTerm.toLowerCase();
    const filtered = allQuestions.filter(q =>
      q.text.toLowerCase().includes(lower) ||
      q.tags.some(t => t.toLowerCase().includes(lower)) ||
      q.subject.toLowerCase().includes(lower)
    );
    setResults(filtered);
  }, [searchTerm, allQuestions]);

  return (
    <div className="pb-24 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Search Bank</h2>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search topics, keywords, or questions..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-medical-500 focus:ring-2 focus:ring-medical-100 outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {results.map(q => (
          <div key={q.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-medical-200 cursor-pointer"
            onClick={() => navigate('/quiz', { state: { mode: 'practice', type: 'single', questionId: q.id } })}>
            <div className="flex gap-2 mb-1">
              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-bold">{q.subject}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">{q.difficulty}</span>
            </div>
            <p className="text-sm font-medium text-gray-900 line-clamp-2">{q.text}</p>
          </div>
        ))}
        {searchTerm && results.length === 0 && (
          <div className="text-center text-gray-400 py-8">No questions found.</div>
        )}
        {!searchTerm && (
          <div className="text-center text-gray-400 py-8 text-sm">Type to search across {allQuestions.length} questions.</div>
        )}
      </div>
    </div>
  );
};

const QuizSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mistakes, setMistakes] = useState<{ question: string; selected: string; correct: string }[]>([]);

  // New state for session-based tracking
  const [attempts, setAttempts] = useState<Record<string, Attempt[]>>({});
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  const state = location.state as any || {};
  const { mode, type, subject, questionId, timeLimit, questionCount, topics, statusFilter } = state;

  useEffect(() => {
    const loadQuizQuestions = async () => {
      // Load user progress
      setAttempts(getAttempts());
      setBookmarks(getBookmarks());

      let loadedQuestions: Question[] = [];

      if (type === 'subject') {
        loadedQuestions = await getQuestionsBySubject(subject);

        // Filter by topics
        if (topics && topics.length > 0) {
          loadedQuestions = loadedQuestions.filter(q =>
            q.tags.some(t => topics.includes(t))
          );
        }

        // Filter by Status (Redundant if filtered in Setup, but good for safety)
        if (statusFilter && statusFilter !== 'all') {
          const currentAttempts = getAttempts();
          const currentBookmarks = getBookmarks();

          loadedQuestions = loadedQuestions.filter(q => {
            const isSolved = currentAttempts[q.id]?.some(a => a.isCorrect);
            const isBookmarked = currentBookmarks.includes(q.id);

            if (statusFilter === 'solved') return isSolved;
            if (statusFilter === 'unsolved') return !isSolved;
            if (statusFilter === 'bookmarked') return isBookmarked;
            return true;
          });
        }

        // Shuffle
        loadedQuestions = [...loadedQuestions].sort(() => Math.random() - 0.5);
        // Limit count
        if (questionCount) {
          loadedQuestions = loadedQuestions.slice(0, questionCount);
        } else if (loadedQuestions.length > 10) {
          loadedQuestions = loadedQuestions.slice(0, 10);
        }
      } else if (type === 'custom_list') {
        loadedQuestions = state.questions || [];
      } else if (type === 'single') {
        const all = await getAllQuestions();
        loadedQuestions = all.filter(q => q.id === questionId);
      }

      setQuestions(loadedQuestions);
      setLoading(false);
    };

    loadQuizQuestions();
  }, [type, subject, questionId, questionCount, topics, statusFilter]);

  const handleAnswer = (index: number, isCorrect: boolean) => {
    if (isCorrect) setScore(s => s + 1);
    else {
      setMistakes(prev => [...prev, {
        question: questions[currentIndex].text,
        selected: questions[currentIndex].options[index],
        correct: questions[currentIndex].options[questions[currentIndex].correctIndex]
      }]);
    }

    const attempt: Attempt = {
      questionId: questions[currentIndex].id,
      selectedOptionIndex: index,
      isCorrect,
      timestamp: Date.now(),
      timeSpentSeconds: 0
    };

    saveAttempt(attempt);

    // Update local attempts state immediately to reflect changes
    setAttempts(prev => {
      const newAttempts = { ...prev };
      if (!newAttempts[attempt.questionId]) newAttempts[attempt.questionId] = [];
      newAttempts[attempt.questionId].push(attempt);
      return newAttempts;
    });
  };

  const handleToggleBookmark = () => {
    const currentQ = questions[currentIndex];
    const newBookmarks = toggleBookmark(currentQ.id);
    setBookmarks(newBookmarks);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleTimeUp = () => {
    setIsFinished(true);
  };

  if (loading) return <div className="p-8 text-center">Loading Quiz...</div>;

  if (questions.length === 0) return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-bold text-gray-900">No Questions Found</h2>
      <p className="text-gray-500 mt-2">This section is empty. Please check back later.</p>
      <button onClick={() => navigate('/')} className="mt-4 text-medical-600 font-bold">Go Home</button>
    </div>
  );

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6 px-4">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center animate-bounce ${percentage >= 50 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          {percentage >= 50 ? <Trophy size={40} /> : <AlertTriangle size={40} />}
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{percentage >= 50 ? 'Great Job!' : 'Needs Improvement'}</h2>
          <p className="text-gray-500 mt-2 text-lg">You scored <span className="font-bold text-gray-900">{score}</span> out of {questions.length}</p>
          <p className="text-medical-600 font-bold text-2xl mt-1">{percentage}%</p>
        </div>
        <div className="w-full max-w-md space-y-4">
          {/* AI Analysis Section */}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/analytics')}
            className="w-full bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-50"
          >
            View Analytics
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-medical-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-medical-500/20 hover:bg-medical-700"
          >
            Back to Home
          </button>
        </div>
      </div>

    );
  }

  return (
    <div className="pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-xs font-medium text-gray-500">
          Question {currentIndex + 1} / {questions.length}
        </div>

        {mode === 'exam' && timeLimit && (
          <Timer durationSeconds={timeLimit * 60} onTimeUp={handleTimeUp} />
        )}
      </div>

      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-medical-600 transition-all duration-500 ease-out"
          style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
        />
      </div>

      <QuizCard
        question={questions[currentIndex]}
        onAnswer={handleAnswer}
        onNext={handleNext}
        isLast={currentIndex === questions.length - 1}
        isSolved={attempts[questions[currentIndex].id]?.some(a => a.isCorrect)}
      />
    </div>
  );
};

const App: React.FC = () => {
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        await dbService.initialize();
        setQuestionsLoaded(true);
      } catch (error) {
        console.error('Error initializing database:', error);
        setLoadingError('Failed to initialize database. Please refresh the page.');
        setQuestionsLoaded(true);
      }
    };

    initApp();
  }, []);

  if (!questionsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-medical-200 border-t-medical-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Loading...</p>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Questions</h2>
          <p className="text-gray-600 mb-4">{loadingError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
          <Header />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } />
              <Route path="/subjects" element={
                <ProtectedRoute>
                  <SubjectsPage />
                </ProtectedRoute>
              } />
              <Route path="/setup" element={
                <ProtectedRoute>
                  <QuizSetup />
                </ProtectedRoute>
              } />
              <Route path="/quiz" element={
                <ProtectedRoute>
                  <QuizSession />
                </ProtectedRoute>
              } />
              <Route path="/review" element={
                <ProtectedRoute>
                  <ReviewPage />
                </ProtectedRoute>
              } />
              <Route path="/questions" element={
                <ProtectedRoute>
                  <QuestionsBrowser />
                </ProtectedRoute>
              } />
              <Route path="/questions/view" element={
                <ProtectedRoute>
                  <QuestionViewer />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/search" element={
                <ProtectedRoute>
                  <SearchPage />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
            </Routes>
          </main>

          <BottomNav />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;