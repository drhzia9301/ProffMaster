import { Question, Subject } from './types';

export const APP_VERSION = '1.3.3'; // Increment this to force cache clear on update
export const MINIMUM_REQUIRED_VERSION = '1.3.0'; // Users with older versions will be forced to update

// Helper to compare versions (returns true if v1 >= v2)
export const isVersionAtLeast = (v1: string, v2: string): boolean => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return true;
    if (p1 < p2) return false;
  }
  return true; // Equal versions
};

// =====================================================
// App Configuration
// =====================================================
export const APP_CONFIG = {
  // WhatsApp number for payment inquiries (format: country code + number, no +)
  WHATSAPP_NUMBER: '923169694543',
  
  // Support email
  SUPPORT_EMAIL: 'support@proffmaster.com',
  
  // Subscription prices
  PREPROFF_PRICE: 300, // in PKR
};

export const SUBJECT_COLORS: Record<Subject, string> = {
  [Subject.ENT]: '#ef4444', // Red
  [Subject.Ophthalmology]: '#f97316', // Orange
  [Subject.Medicine]: '#3b82f6', // Blue
  [Subject.Surgery]: '#a855f7', // Purple
  [Subject['Community Medicine']]: '#10b981', // Green
  [Subject['Forensic Medicine']]: '#6366f1', // Indigo
  [Subject.Pathology]: '#84cc16', // Lime
  [Subject.Pharmacology]: '#06b6d4', // Cyan
  [Subject.Gynecology]: '#ec4899', // Pink
  [Subject.Psychiatry]: '#8b5cf6', // Violet
};

// Load questions from JSON files
export async function loadQuestions(subject: Subject): Promise<Question[]> {
  try {
    const response = await fetch(`/data/${subject.toLowerCase()}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${subject} questions`);
    }
    const data = await response.json();

    // Transform JSON format to Question format
    return data.map((q: any) => ({
      id: q.id?.toString() || `${subject.toLowerCase()}_${q.id}`,
      subject: subject,
      difficulty: q.difficulty || 'Medium',
      tags: q.tags || [q.topic || subject],
      text: q.question || q.text,
      options: q.options || [],
      correctIndex: q.correctIndex !== undefined
        ? q.correctIndex
        : (q.answer ? q.options.findIndex((opt: string) => opt === q.answer) : 0),
      explanation: q.explanation || ''
    }));
  } catch (error) {
    console.error(`Error loading ${subject} questions:`, error);
    return [];
  }
}

// Load all available questions
export async function loadAllQuestions(): Promise<Question[]> {
  const subjects = [Subject.Ophthalmology];
  const allQuestions: Question[] = [];

  for (const subject of subjects) {
    const questions = await loadQuestions(subject);
    allQuestions.push(...questions);
  }

  return allQuestions;
}

// Placeholder - will be populated dynamically
export const MOCK_QUESTIONS: Question[] = [];