import { Attempt, UserStats, Question, Subject } from '../types';
import { supabase } from './supabase';

const STORAGE_KEYS = {
  ATTEMPTS: 'supersix_attempts',
  STATS: 'supersix_stats',
  BOOKMARKS: 'supersix_bookmarks',
  QUESTIONS: 'questions_cache', // Use cache from JSON loading
  COUNTS: 'supersix_counts',
  AI_ATTEMPTS: 'supersix_ai_attempts',
  AI_BOOKMARKS: 'supersix_ai_bookmarks',
  PREPROFF_ATTEMPTS: 'supersix_preproff_attempts',
  PREPROFF_BOOKMARKS: 'supersix_preproff_bookmarks'
};

// --- Question Bank Management ---

import { dbService } from './databaseService';

// --- Question Bank Management ---

export const getAllQuestions = async (): Promise<Question[]> => {
  try {
    const questions = await dbService.getAllQuestions();
    updateCachedCounts(questions);
    return questions;
  } catch (error) {
    console.error('Failed to get questions:', error);
    return [];
  }
};

export const saveQuestions = (newQuestions: Question[]) => {
  // Deprecated: Questions are now read-only from SQLite
  console.warn('saveQuestions is deprecated with SQLite backend');
  return 0;
};

export const getQuestionsBySubject = async (subject: Subject): Promise<Question[]> => {
  try {
    return await dbService.getQuestionsBySubject(subject);
  } catch (error) {
    console.error(`Failed to get questions for ${subject}:`, error);
    return [];
  }
};

export const getQuestionsByTopic = async (topic: string): Promise<Question[]> => {
  try {
    return await dbService.getQuestionsByTopic(topic);
  } catch (error) {
    console.error(`Failed to get questions for topic ${topic}:`, error);
    return [];
  }
};

// --- Caching ---

export const getCachedQuestionCount = (): number => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.COUNTS);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.total || 0;
    }
  } catch (e) {
    console.error('Error reading cached counts', e);
  }
  return 0;
};

export const getCachedSubjectCounts = (): Record<string, number> => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.COUNTS);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.subjects || {};
    }
  } catch (e) {
    console.error('Error reading cached counts', e);
  }
  return {};
};

const updateCachedCounts = (questions: Question[]) => {
  try {
    const subjects: Record<string, number> = {};
    questions.forEach(q => {
      subjects[q.subject] = (subjects[q.subject] || 0) + 1;
    });

    const cache = {
      total: questions.length,
      subjects
    };
    localStorage.setItem(STORAGE_KEYS.COUNTS, JSON.stringify(cache));
  } catch (e) {
    console.error('Error updating cached counts', e);
  }
};

// --- User Progress & Review ---

export const getAttempts = (): Record<string, Attempt[]> => {
  const data = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
  return data ? JSON.parse(data) : {};
};

export const saveAttempt = async (attempt: Attempt) => {
  const attempts = getAttempts();
  if (!attempts[attempt.questionId]) {
    attempts[attempt.questionId] = [];
  }
  attempts[attempt.questionId].push(attempt);
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
  updateStats(attempt);

  // Save to SQLite
  try {
    await dbService.saveAttempt(attempt);
  } catch (error) {
    console.error('Failed to save attempt to SQLite:', error);
  }

  // Sync to Supabase if logged in
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    try {
      await supabase.from('attempts').insert({
        user_id: session.user.id,
        question_id: attempt.questionId,
        selected_option_index: attempt.selectedOptionIndex,
        is_correct: attempt.isCorrect,
        timestamp: attempt.timestamp,
        time_spent_seconds: attempt.timeSpentSeconds
      });
    } catch (error) {
      console.error('Failed to sync attempt to Supabase:', error);
    }
  }
};

export const syncAttempts = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  try {
    // 1. Fetch remote attempts
    const { data: remoteAttempts, error } = await supabase
      .from('attempts')
      .select('*');

    if (error) throw error;

    // 2. Merge with local
    const localAttempts = getAttempts();
    let hasChanges = false;

    // Convert remote to local format
    remoteAttempts?.forEach((ra: any) => {
      const attempt: Attempt = {
        questionId: ra.question_id,
        selectedOptionIndex: ra.selected_option_index,
        isCorrect: ra.is_correct,
        timestamp: ra.timestamp,
        timeSpentSeconds: ra.time_spent_seconds || 0
      };

      if (!localAttempts[attempt.questionId]) {
        localAttempts[attempt.questionId] = [];
      }

      // Check if already exists (by timestamp)
      const exists = localAttempts[attempt.questionId]?.some(a => a.timestamp === attempt.timestamp);
      if (!exists) {
        if (!localAttempts[attempt.questionId]) {
          localAttempts[attempt.questionId] = [];
        }
        localAttempts[attempt.questionId].push(attempt);
        hasChanges = true;
        // Also update stats for this new attempt
        updateStats(attempt);

        // CRITICAL FIX: Also save to SQLite so it appears in "Weak Areas"
        dbService.saveAttempt(attempt).catch(e => console.error('Failed to sync attempt to SQLite:', e));
      }
    });

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(localAttempts));
    }

    // 3. Push local attempts that are missing from remote (Optional/Advanced: bidirectional sync)
    // For now, we assume "saveAttempt" handles the push, and this sync is mostly Pull on login.
    // To be robust, we could push everything local that isn't in remote, but that requires more logic.
    // Let's stick to Pull for now to restore progress.

  } catch (error) {
    console.error('Sync failed:', error);
  }
};

export const getWeakQuestions = async (): Promise<Question[]> => {
  try {
    // Use the optimized SQL query
    return await dbService.getWeakQuestions();
  } catch (error) {
    console.error('Failed to get weak questions:', error);
    return [];
  }
};

export const resetProgress = async () => {
  try {
    // 1. Clear Supabase (Best Effort - Do this FIRST while session is valid)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('Clearing Supabase attempts for user:', session.user.id);
        const { error } = await supabase.from('attempts').delete().eq('user_id', session.user.id);
        if (error) throw error;
      } else {
        console.log('No active session, skipping Supabase clear');
      }
    } catch (e) {
      console.error('Failed to clear Supabase attempts:', e);
      // We continue even if Supabase fails, as local reset is better than nothing.
    }

    // 2. Clear SQLite (Best Effort)
    try {
      console.log('Clearing SQLite attempts...');
      await dbService.clearAttempts();
    } catch (e) {
      console.error('Failed to clear SQLite attempts:', e);
    }

    // 3. Clear Local Storage (Aggressive - Keep only API Key)
    // This removes the Supabase session token, effectively logging the user out locally.
    const apiKey = localStorage.getItem('gemini_api_key');

    // Explicitly sign out to ensure session is killed on the client
    await supabase.auth.signOut();

    localStorage.clear();
    if (apiKey) {
      localStorage.setItem('gemini_api_key', apiKey);
    }

    // Verification: Check if attempts key still exists
    if (localStorage.getItem(STORAGE_KEYS.ATTEMPTS)) {
      console.error('CRITICAL: Failed to clear attempts from LocalStorage!');
      // Force remove again
      localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
    }

    console.log('Local storage cleared (preserved API key)');

    return true;
  } catch (error) {
    console.error('Failed to reset progress:', error);
    return false;
  }
};

// --- Bookmarks ---

export const getBookmarks = (): string[] => {
  const data = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
  return data ? JSON.parse(data) : [];
};

export const toggleBookmark = (questionId: string) => {
  const bookmarks = getBookmarks();
  const index = bookmarks.indexOf(questionId);
  if (index > -1) {
    bookmarks.splice(index, 1);
  } else {
    bookmarks.push(questionId);
  }
  localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  return bookmarks;
};

// --- Stats ---

const updateStats = (attempt: Attempt) => {
  const stats = getUserStats();
  const today = new Date().toISOString().split('T')[0];

  stats.totalQuestionsAttempted += 1;
  if (attempt.isCorrect) stats.correctAnswers += 1;

  if (stats.lastActiveDate !== today) {
    const lastDate = new Date(stats.lastActiveDate);
    const currentDate = new Date(today);
    const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      stats.streakDays += 1;
    } else if (diffDays > 1) {
      stats.streakDays = 1;
    }
    stats.lastActiveDate = today;
  }

  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
};

export const getUserStats = (): UserStats => {
  const data = localStorage.getItem(STORAGE_KEYS.STATS);
  if (data) return JSON.parse(data);
  return {
    totalQuestionsAttempted: 0,
    correctAnswers: 0,
    streakDays: 0,
    lastActiveDate: new Date().toISOString().split('T')[0],
    subjectAccuracy: {}
  };
};


// --- AI Specific Storage ---

export const getAIAttempts = (): Record<string, Attempt[]> => {
  const data = localStorage.getItem(STORAGE_KEYS.AI_ATTEMPTS);
  return data ? JSON.parse(data) : {};
};

export const saveAIAttempt = (attempt: Attempt) => {
  const attempts = getAIAttempts();
  if (!attempts[attempt.questionId]) {
    attempts[attempt.questionId] = [];
  }
  attempts[attempt.questionId].push(attempt);
  localStorage.setItem(STORAGE_KEYS.AI_ATTEMPTS, JSON.stringify(attempts));
  // Note: We do NOT update global stats for AI attempts
};

export const getAIBookmarks = (): string[] => {
  const data = localStorage.getItem(STORAGE_KEYS.AI_BOOKMARKS);
  return data ? JSON.parse(data) : [];
};

export const toggleAIBookmark = (questionId: string) => {
  const bookmarks = getAIBookmarks();
  const index = bookmarks.indexOf(questionId);
  if (index > -1) {
    bookmarks.splice(index, 1);
  } else {
    bookmarks.push(questionId);
  }
  localStorage.setItem(STORAGE_KEYS.AI_BOOKMARKS, JSON.stringify(bookmarks));
  return bookmarks;
};

// --- Preproff Specific Storage ---

export const getPreproffAttempts = (): Record<string, Attempt[]> => {
  const data = localStorage.getItem(STORAGE_KEYS.PREPROFF_ATTEMPTS);
  return data ? JSON.parse(data) : {};
};

export const savePreproffAttempt = (attempt: Attempt) => {
  const attempts = getPreproffAttempts();
  if (!attempts[attempt.questionId]) {
    attempts[attempt.questionId] = [];
  }
  attempts[attempt.questionId].push(attempt);
  localStorage.setItem(STORAGE_KEYS.PREPROFF_ATTEMPTS, JSON.stringify(attempts));
};

export const getPreproffBookmarks = (): string[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PREPROFF_BOOKMARKS);
  return data ? JSON.parse(data) : [];
};

export const togglePreproffBookmark = (questionId: string) => {
  const bookmarks = getPreproffBookmarks();
  const index = bookmarks.indexOf(questionId);
  if (index > -1) {
    bookmarks.splice(index, 1);
  } else {
    bookmarks.push(questionId);
  }
  localStorage.setItem(STORAGE_KEYS.PREPROFF_BOOKMARKS, JSON.stringify(bookmarks));
  return bookmarks;
};

// --- Session Persistence ---

export interface QuizSessionState {
  questions: Question[];
  currentIndex: number;
  score: number;
  mistakes: { question: string; selected: string; correct: string }[];
  sessionAttempts: Record<string, Attempt>;
  timeLimit?: number;
  startTime: number;
  type: string; // 'main' | 'ai_generated' | 'preproff'
  config?: any; // To store aiConfig or other setup params
}

export const saveCurrentSession = (state: QuizSessionState) => {
  try {
    localStorage.setItem('supersix_current_session', JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save session:', e);
  }
};

export const getCurrentSession = (): QuizSessionState | null => {
  try {
    const data = localStorage.getItem('supersix_current_session');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to load session:', e);
    return null;
  }
};

export const clearCurrentSession = () => {
  localStorage.removeItem('supersix_current_session');
};