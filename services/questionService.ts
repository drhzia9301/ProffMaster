import { supabase } from './supabase';
import { Question, Subject } from '../types';

export interface QuestionRow {
    id: string;
    subject: string;
    topic: string;
    question: string;
    options: string; // JSON string
    correct_answer: string;
    correct_index: number;
    explanation: string;
    difficulty: string;
}

/**
 * Fetch all questions from Supabase
 */
export async function fetchAllQuestions(): Promise<Question[]> {
    try {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .order('id');

        if (error) throw error;

        return (data || []).map(transformQuestion);
    } catch (error) {
        console.error('Error fetching questions from Supabase:', error);
        return [];
    }
}

/**
 * Fetch questions by subject
 */
export async function fetchQuestionsBySubject(subject: Subject): Promise<Question[]> {
    try {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('subject', subject)
            .order('id');

        if (error) throw error;

        return (data || []).map(transformQuestion);
    } catch (error) {
        console.error(`Error fetching ${subject} questions:`, error);
        return [];
    }
}

/**
 * Fetch questions by topic
 */
export async function fetchQuestionsByTopic(topic: string): Promise<Question[]> {
    try {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('topic', topic)
            .order('id');

        if (error) throw error;

        return (data || []).map(transformQuestion);
    } catch (error) {
        console.error(`Error fetching questions for topic ${topic}:`, error);
        return [];
    }
}

/**
 * Transform database row to Question type
 */
function transformQuestion(row: QuestionRow): Question {
    return {
        id: row.id,
        subject: row.subject as Subject,
        difficulty: row.difficulty as 'Easy' | 'Medium' | 'Hard',
        tags: row.topic ? [row.topic] : [],
        text: row.question,
        options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
        correctIndex: row.correct_index,
        explanation: row.explanation || ''
    };
}

/**
 * Sync questions from Supabase to localStorage
 * This allows offline access
 */
export async function syncQuestionsToLocal(): Promise<void> {
    try {
        const questions = await fetchAllQuestions();
        localStorage.setItem('questions_cache', JSON.stringify(questions));
        localStorage.setItem('questions_last_sync', Date.now().toString());
        console.log(`Synced ${questions.length} questions to local storage`);
    } catch (error) {
        console.error('Error syncing questions:', error);
    }
}

/**
 * Check if local cache needs refresh (older than 24 hours)
 */
export function shouldRefreshCache(): boolean {
    const lastSync = localStorage.getItem('questions_last_sync');
    if (!lastSync) return true;

    const dayInMs = 24 * 60 * 60 * 1000;
    return Date.now() - parseInt(lastSync) > dayInMs;
}
