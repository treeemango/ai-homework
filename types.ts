
export interface SolutionStep {
  title: string;
  description: string;
  math?: string;
  icon: string;
}

export interface Solution {
  id: string;
  topic: string;
  subtopic: string;
  explanation: string;
  steps: SolutionStep[];
  finalResult: string;
  confidence?: number;
  detectedSubject?: string;
  subjectConfidence?: number;
  extractedText?: string;
  captureUrl: string;
  timestamp: string;
}

export interface UserStats {
  problemsSolved: number;
  streak: number;
  accuracy: number;
  studyTime: string;
  masteredTopics: number;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  points: number;
  streak: number;
  accuracy: number;
  study_time: string;
  mastered_topics: number;
  difficulty_level?: 'easy' | 'standard' | 'challenge';
  created_at: string;
}

export type UserRole = 'student' | 'parent' | 'teacher' | 'admin';

export interface LinkedStudent {
  guardian_id: string;
  relationship: 'parent' | 'teacher';
  student_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  points: number;
  streak: number;
  accuracy: number;
  mastered_topics: number;
  updated_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

export interface UserAchievement {
  id: string;
  unlocked_at: string;
  achievements: Achievement;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  avatar_url: string;
  points: number;
  streak: number;
  accuracy: number;
  rank: number;
}
