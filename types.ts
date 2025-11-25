export enum Subject {
  ENT = 'ENT',
  Ophthalmology = 'Ophthalmology',
  Medicine = 'Medicine',
  Surgery = 'Surgery',
  'Community Medicine' = 'Community Medicine',
  'Forensic Medicine' = 'Forensic Medicine',
  Pathology = 'Pathology',
  Pharmacology = 'Pharmacology',
  Gynecology = 'Gynecology',
  Psychiatry = 'Psychiatry'
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  subject: Subject;
  tags: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface Attempt {
  questionId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timestamp: number;
  timeSpentSeconds: number;
}

export interface UserStats {
  totalQuestionsAttempted: number;
  correctAnswers: number;
  streakDays: number;
  lastActiveDate: string; // ISO Date string
  subjectAccuracy: Record<string, { attempted: number; correct: number }>;
}

export interface QuizConfig {
  mode: 'practice' | 'exam' | 'revision';
  subjects: Subject[];
  questionCount: number;
  timed: boolean;
  timeLimitMinutes?: number;
}