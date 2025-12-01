import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import QuizCard from './components/QuizCard';
import SettingsPage from './components/Settings';
import QuestionsBrowser from './components/QuestionsBrowser';
import QuestionViewer from './components/QuestionViewer';

import { SUBJECT_COLORS } from './constants.ts';
import { ThemeProvider } from './contexts/ThemeContext';
import { Subject, Question, Attempt } from './types';
import { saveAttempt, getAllQuestions, getQuestionsBySubject, getWeakQuestions, getAttempts, getBookmarks, toggleBookmark, getCachedQuestionCount, getCachedSubjectCounts, saveAIAttempt, getAIAttempts, toggleAIBookmark, getAIBookmarks, getPreproffAttempts, savePreproffAttempt, getPreproffBookmarks, togglePreproffBookmark, saveCurrentSession, getCurrentSession, clearCurrentSession } from './services/storageService';
import { ArrowRight, Play, Book, Clock, Search, AlertTriangle, BrainCircuit, CheckCircle2, Trophy, Settings, Sliders, Filter, CheckSquare, Square, LogIn, Sparkles, Skull, Activity, FlaskConical, Microscope, Pill, Stethoscope, Scissors, Eye, Ear, Users, Scale, Baby, Brain, Heart, BookOpen, Shield } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import SelectionPage from './components/SelectionPage';
import PreproffBlocksPage from './components/PreproffBlocksPage';
import PreproffCollegesPage from './components/PreproffCollegesPage';
import PreproffYearsPage from './components/PreproffYearsPage';
import AIBlockPage from './components/AIBlockPage';
import { getSessionAnalysisFromAI } from './services/geminiService';
import { hasApiKey } from './services/apiKeyService';
import { dbService } from './services/databaseService';
import { generateQuiz, generateStudyNotes } from './services/geminiService';
import { savePaper } from './services/savedPapersService';
import { App as CapacitorApp } from '@capacitor/app';
import { hapticsService, NotificationType, ImpactStyle } from './services/hapticsService';
import { VersionManager } from './components/VersionManager';
import NotesPage from './components/NotesPage';
import { notesService } from './services/notesService';
import NoteGenerationModal from './components/NoteGenerationModal';
import { WhatsNewModal } from './components/WhatsNewModal';

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

        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/selection')}
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

        <button
          onClick={() => navigate('/ai-questions')}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-medical-200 text-left group transition-all"
        >
          <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
            <Sparkles size={20} />
          </div>
          <h3 className="font-bold text-gray-900">AI Questions</h3>
          <p className="text-xs text-gray-500 mt-1">Generate custom quizzes</p>
        </button>

        <button
          onClick={() => navigate('/notes')}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-medical-200 text-left group transition-all"
        >
          <div className="bg-emerald-100 w-10 h-10 rounded-lg flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 transition-transform">
            <BookOpen size={20} />
          </div>
          <h3 className="font-bold text-gray-900">AI Study Notes</h3>
          <p className="text-xs text-gray-500 mt-1">View your saved notes</p>
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

  return (
    <div className="pb-24 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Subjects</h2>
      <div className="grid grid-cols-1 gap-4">
        {subjects.map((subject) => {
          const Icon = SUBJECT_ICONS[subject] || Book;
          return (
            <button
              key={subject}
              onClick={() => navigate('/setup', { state: { subject } })}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-medical-200 text-left flex items-center gap-4 group transition-all"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform" style={{ backgroundColor: SUBJECT_COLORS[subject] }}>
                <Icon size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{subject}</h3>
                <p className="text-xs text-gray-500">Practice questions</p>
              </div>
              <ArrowRight className="ml-auto text-gray-300 group-hover:text-medical-600" size={20} />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
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
        <div className="p-6 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sliders size={20} className="text-medical-500 dark:text-medical-400" /> Question Count
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-600 dark:text-gray-400">1</span>
              <span className="text-medical-600 dark:text-medical-400 font-bold">{count} Selected</span>
              <span className="text-gray-600 dark:text-gray-400">{filteredQuestionCount} Max</span>
            </div>
            <input
              type="range"
              min="1"
              max={filteredQuestionCount || 1}
              step="1"
              value={count}
              disabled={filteredQuestionCount < 1}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-medical-600"
            />
            {filteredQuestionCount < 1 && (
              <p className="text-xs text-orange-500 dark:text-orange-400">Not enough questions in selected topics.</p>
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

const Timer = ({ durationSeconds, onTimeUp }: { durationSeconds: number, onTimeUp: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className={`flex items-center gap-2 font-mono font-bold ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-medical-600'}`}>
      <Clock size={18} />
      {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};

const QuizSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    mode,
    subject,
    questionCount,
    topics,
    questions: reviewQuestions,
    questionId,
    statusFilter,
    block,
    aiConfig,
    filter // 'all' | 'incorrect' | 'favorites'
  } = location.state || {};

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading Questions...');
  const [mistakes, setMistakes] = useState<{ question: string; selected: string; correct: string }[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLimit, setTimeLimit] = useState<number | undefined>(location.state?.timeLimit);

  // New State for Session Persistence
  const [attempts, setAttempts] = useState<Record<string, Attempt[]>>({});
  const [sessionAttempts, setSessionAttempts] = useState<Record<string, Attempt>>({});
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Track if we've already saved this session's paper to prevent duplicates
  const hasSavedPaper = useRef(false);



  // Determine the type of quiz for storage keys
  const type = location.state?.type || (aiConfig ? 'ai_generated' : (block ? 'preproff' : 'main'));

  // --- Session Cleanup Logic ---

  // Clear Session on Finish
  useEffect(() => {
    if (isFinished) {
      clearCurrentSession();
    }
  }, [isFinished]);

  useEffect(() => {
    const loadQuizQuestions = async () => {
      setLoading(true);

      let loadedQuestions: Question[] = [];

      console.log("Loading Quiz Questions...", { type, mode, hasReviewQuestions: !!reviewQuestions, aiConfig });

      // 1. Review Mode or Pre-loaded Questions (e.g. Saved AI Paper)
      if (reviewQuestions && reviewQuestions.length > 0) {
        console.log("Using pre-loaded questions:", reviewQuestions.length);
        loadedQuestions = reviewQuestions;
      }
      // 2. Single Question Mode (from Search)
      else if (questionId) {
        const all = await getAllQuestions();
        const q = all.find(q => q.id === questionId);
        if (q) loadedQuestions = [q];
      }
      // 3. AI Generated Quiz
      else if (type === 'ai_generated' && aiConfig) {
        try {
          setLoadingMessage('Initializing AI...');
          loadedQuestions = await generateQuiz(
            block || aiConfig.block,
            aiConfig.type,
            aiConfig.topic,
            aiConfig.count,
            (msg) => setLoadingMessage(msg)
          );

          if (aiConfig.timed) {
            setTimeLimit(aiConfig.timeLimit);
          }

          // Save the generated paper automatically
          if (loadedQuestions.length > 0 && !hasSavedPaper.current) {
            const paperBlock = block || aiConfig.block;
            const newPaper = {
              id: crypto.randomUUID(),
              name: `${paperBlock} ${aiConfig.type === 'full' ? 'Full Paper' : (aiConfig.topic || 'Custom Quiz')}`,
              block: paperBlock,
              date: Date.now(),
              questions: loadedQuestions,
              type: aiConfig.type
            };
            savePaper(newPaper);
            hasSavedPaper.current = true;
          }

        } catch (err: any) {
          if (err.message === 'API_KEY_MISSING') {
            setError('API_KEY_MISSING');
            setLoading(false);
            return;
          }
          console.error("AI Quiz Error:", err);
          // Fallback?
        }
      }
      // 4. Preproff Mode
      else if (type === 'preproff' && block) {
        setLoadingMessage(`Loading ${block} questions...`);
        const { college, year } = location.state;
        loadedQuestions = await dbService.getPreproffQuestions(block, college, year);

        // Apply Filters
        if (filter === 'incorrect') {
          const attempts = getPreproffAttempts();
          loadedQuestions = loadedQuestions.filter(q => {
            const qAttempts = attempts[q.id];
            // Check if the LAST attempt was incorrect
            return qAttempts && qAttempts.length > 0 && !qAttempts[qAttempts.length - 1].isCorrect;
          });
        } else if (filter === 'favorites') {
          const bookmarks = getPreproffBookmarks();
          loadedQuestions = loadedQuestions.filter(q => bookmarks.includes(q.id));
        }

      }
      // 5. Standard Practice Mode
      else if (subject) {
        const subjectQuestions = await getQuestionsBySubject(subject);
        let filtered = subjectQuestions;

        if (topics && topics.length > 0) {
          filtered = filtered.filter(q => q.tags.some(t => topics.includes(t)));
        }

        // Randomize and slice
        loadedQuestions = filtered
          .sort(() => 0.5 - Math.random())
          .slice(0, questionCount || 10);
      }
      // 6. Fallback (shouldn't happen often)
      else {
        // Maybe load all?
      }

      // Load initial state for these questions
      if (loadedQuestions.length > 0) {
        if (type === 'ai_generated') {
          setAttempts(getAIAttempts());
          setBookmarks(getAIBookmarks());
        } else if (type === 'preproff') {
          setAttempts(getPreproffAttempts());
          setBookmarks(getPreproffBookmarks());
        } else {
          setAttempts(getAttempts());
          setBookmarks(getBookmarks());
        }
      }

      // If AI failed to generate questions (empty array), try fallback
      if (type === 'ai_generated' && loadedQuestions.length === 0 && !error) {
        // Retry once or show error?
        // For now, let's show error if it's truly empty
        if (!loadingMessage.includes('Generating')) {
          // It finished but empty
        }
      }

      // Special handling for Custom AI Quiz if it returns empty (simulated delay/error)
      if (type === 'ai_generated' && loadedQuestions.length === 0 && !error) {
        // If we are here, generateQuiz returned []
        // We might want to try again or check if it was a "Custom" request that failed
        if (aiConfig?.type === 'custom') {
          // Try one more time with a simpler prompt?
          // Or just notify user
          try {
            console.log('Retrying custom quiz generation...');
            loadedQuestions = await generateQuiz(aiConfig.block, 'custom', aiConfig.topic, aiConfig.count);
          } catch (err: any) {
            if (err.message === 'API_KEY_MISSING') {
              setError('API_KEY_MISSING');
              setLoading(false);
              return;
            }
            console.error("Quiz Generation Error:", err);
            // Fallback or show generic error
          }
        }
      }

      setQuestions(loadedQuestions);
      setLoading(false);
    };

    loadQuizQuestions();
    // Removed duplicate call
  }, [type, subject, questionId, questionCount, topics, statusFilter, block, aiConfig, filter]);

  const handleAnswer = (index: number, isCorrect: boolean) => {
    if (isCorrect) {
      setScore(s => s + 1);
      hapticsService.notification(NotificationType.Success);
    } else {
      hapticsService.notification(NotificationType.Error);
    }
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    if (!isCorrect) {
      setMistakes(prev => [...prev, {
        question: currentQuestion.text,
        selected: currentQuestion.options[index],
        correct: currentQuestion.options[currentQuestion.correctIndex]
      }]);
    }

    // Save Attempt
    const attempt: Attempt = {
      questionId: currentQuestion.id,
      selectedOptionIndex: index,
      isCorrect,
      timestamp: Date.now(),
      timeSpentSeconds: 0 // TODO: Track time per question
    };

    if (type === 'ai_generated') {
      saveAIAttempt(attempt);
      // Update local state for immediate feedback
      setAttempts(prev => ({
        ...prev,
        [currentQuestion.id]: [...(prev[currentQuestion.id] || []), attempt]
      }));
    } else if (type === 'preproff') { // Handle preproff attempts
      savePreproffAttempt(attempt);
      setAttempts(prev => ({
        ...prev,
        [currentQuestion.id]: [...(prev[currentQuestion.id] || []), attempt]
      }));
    } else {
      saveAttempt(attempt);
      setAttempts(prev => ({
        ...prev,
        [currentQuestion.id]: [...(prev[currentQuestion.id] || []), attempt]
      }));
    }

    // Update session attempts for navigation persistence
    setSessionAttempts(prev => ({
      ...prev,
      [attempt.questionId]: attempt
    }));
  };

  const toggleQuestionBookmark = () => {
    if (!questions[currentIndex]) return;
    const qId = questions[currentIndex].id;

    let newBookmarks: string[];
    if (type === 'ai_generated') {
      newBookmarks = toggleAIBookmark(qId);
    } else if (type === 'preproff') { // Handle preproff bookmarks
      newBookmarks = togglePreproffBookmark(qId);
    } else {
      newBookmarks = toggleBookmark(qId);
    }
    setBookmarks(newBookmarks);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleTimeUp = () => {
    setIsFinished(true);
  };

  const handleGenerateNotes = async (title: string, mode: 'concise' | 'detailed') => {
    setShowNotesModal(false);
    setIsGeneratingNotes(true);

    // Pass mode and title to service
    const notes = await generateStudyNotes(questions, mode, title);

    if (notes && !notes.startsWith('Failed')) {
      notesService.saveNote({
        id: Date.now().toString(),
        title: title,
        content: notes,
        date: new Date().toISOString(),
        tags: [subject || 'General', mode], // Add mode as tag
        relatedQuestions: questions.map(q => q.id)
      });
      alert('Notes generated and saved successfully!');
    } else {
      alert('Failed to generate notes. Please try again.');
    }
    setIsGeneratingNotes(false);
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-medical-100 border-t-medical-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles size={24} className="text-medical-600 animate-pulse" />
        </div>
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-xl font-bold text-gray-900 animate-pulse">
          {loadingMessage}
        </h2>
        {type === 'ai_generated' && aiConfig?.type === 'full' && (
          <p className="text-sm text-gray-500">
            Please be patient. We are crafting a comprehensive exam based on the official syllabus.
          </p>
        )}
      </div>
    </div>
  );

  if (error === 'API_KEY_MISSING') return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600">
        <Settings size={32} />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-xl font-bold text-gray-900">API Key Missing</h2>
        <p className="text-gray-500">
          To generate AI questions, you need to configure your Gemini API Key in Settings.
        </p>
      </div>
      <button
        onClick={() => navigate('/settings')}
        className="bg-medical-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-medical-500/20 hover:bg-medical-700 transition-colors"
      >
        Go to Settings
      </button>
    </div>
  );

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
          <div className="w-full">
            <button
              onClick={() => setShowNotesModal(true)}
              disabled={isGeneratingNotes}
              className="w-full bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGeneratingNotes ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Notes...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate AI Study Notes
                </>
              )}
            </button>
          </div>
        </div>

        <NoteGenerationModal
          isOpen={showNotesModal}
          onClose={() => setShowNotesModal(false)}
          onGenerate={handleGenerateNotes}
          defaultTitle={`Study Notes: ${subject || 'Session'}`}
        />

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
        currentQuestionIndex={currentIndex}
        totalQuestions={questions.length}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onPrevious={handlePrevious}
        isLastQuestion={currentIndex === questions.length - 1}
        attempts={sessionAttempts[questions[currentIndex].id] ? [sessionAttempts[questions[currentIndex].id]] : []}
        isBookmarked={bookmarks.includes(questions[currentIndex].id)}
        onToggleBookmark={toggleQuestionBookmark}
      />
    </div>
  );
};

// BackButtonHandler Component
const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (location.pathname === '/' || location.pathname === '/login') {
        CapacitorApp.exitApp();
      } else {
        navigate(-1);
      }
    });

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, [navigate, location]);

  return null;
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
    <ThemeProvider>
      <VersionManager />
      <WhatsNewModal />
      <Router>
        <AuthProvider>
          <AuthWrapper>
            <div className="min-h-screen bg-gray-50 text-gray-900 font-sans transition-colors duration-300">
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
                  <Route path="/selection" element={<ProtectedRoute><SelectionPage /></ProtectedRoute>} />
                  <Route path="/preproff-blocks" element={<ProtectedRoute><PreproffBlocksPage /></ProtectedRoute>} />
                  <Route path="/preproff-colleges" element={<ProtectedRoute><PreproffCollegesPage /></ProtectedRoute>} />
                  <Route path="/preproff-years" element={<ProtectedRoute><PreproffYearsPage /></ProtectedRoute>} />
                  <Route path="/ai-questions" element={<ProtectedRoute><AIBlockPage /></ProtectedRoute>} />
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
                  <Route path="/analytics" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/search" element={
                    <ProtectedRoute>
                      <QuestionsBrowser />
                    </ProtectedRoute>
                  } />
                  <Route path="/question/:id" element={
                    <ProtectedRoute>
                      <QuestionViewer />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/notes" element={
                    <ProtectedRoute>
                      <NotesPage />
                    </ProtectedRoute>
                  } />

                </Routes>
              </main>

              <BottomNav />
            </div>
            <BackButtonHandler />
          </AuthWrapper>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

// Wrapper to handle connection error inside AuthProvider context
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connectionError } = useAuth();

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center animate-fade-in">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="relative">
              <Users size={40} className="text-red-500 opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-1 bg-red-600 rotate-45 rounded-full absolute" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Internet Connection</h2>
          <p className="text-gray-500 mb-8">
            This app requires an active internet connection to verify your license and sync your progress.
            <br /><br />
            Please check your Wi-Fi or mobile data and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-medical-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-medical-500/20 hover:bg-medical-700 transition-all active:scale-95"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default App;