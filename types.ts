
export enum GradeLevel {
  Seven = '七年级',
  Eight = '八年级',
  Nine = '九年级',
}

export enum Subject {
  Math = '数学',
  English = '英语',
  Physics = '物理',
  Chemistry = '化学',
  Chinese = '语文',
}

export interface KnowledgePoint {
  name: string;
  score: number; // 0-100
  fullMark: number;
  learningGoal?: string; // The specific educational standard or goal for this topic
}

export interface StudentProfile {
  name: string;
  grade: GradeLevel;
  subject: Subject;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number; // 0-3
  explanation: string;
  knowledgePoint?: string; // The specific topic this question tests
  difficulty?: 'easy' | 'medium' | 'hard';
  // Fields for manual entry
  grade?: GradeLevel;
  subject?: Subject;
}

export interface QuizResult {
  correctCount: number;
  totalCount: number;
  weakPointImproved: string;
}
