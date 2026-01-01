export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  time: string;
}

// Structured plan session from AI
export interface PlanSession {
  Branch: string;
  Topic: string;
  Lesson: string;
  obstacles: string[];
  date: string;
  session_goal: string;
  parent_tip: string;
}

export interface SuggestedPlan {
  description: string;
  items?: string[];           // For simple text items (backward compatibility)
  sessions?: PlanSession[];   // For structured session plans
}

// Plan Request - matches AI Pipeline /plan endpoint
export interface PlanRequest {
  goal: string;
  time_available: string;
  branch?: string;
  topic?: string;
  obstacles?: string[];
  parent_remark?: string;
  session_logs?: SessionLog[];
  user_logs?: UserLog[];
}

export interface SessionLog {
  session_id: string;
  type: string;
  date: string;
  branch: string;
  topic: string;
  lesson: string;
  summary: string;
  feedback: string;
  quiz_score?: number;
  status: string;
  level: string;
}

export interface UserLog {
  user_id: string;
  name: string;
  email: string;
  level: string;
  grade: string;
  elo: number;
  role: string;
  total_quizzes: number;
  highest_score: number;
  total_qna: number;
  total_summaries: number;
  created_at: string;
  strengths: string[];
  weaknesses: string[];
}

export interface PlanResponse {
  plan: string;
  session_id: string;
  inputs: {
    goal: string;
    time_available: string;
    branch: string;
    topic: string;
    session_id: string;
  };
}

