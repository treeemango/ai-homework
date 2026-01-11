
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
