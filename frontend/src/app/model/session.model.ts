import {QnAElementDTO} from './qna.model';
import {QuizElementDTO} from './quiz.model';
import {SummaryElementDTO} from './summary.model';

export interface SessionState {
  selectedLevel: string;
  selectedSubject: string;
  selectedModule: string;
}

export enum SessionType {
    QUIZ = 'QUIZ',
    QNA = 'QNA',
    SUMMARY = 'SUMMARY'
}

export interface SessionDTO {
    id: string;
    level?: string;
    subject?: string;
    module?: string;
    lesson?: string;
    status: string;
    sessionType: SessionType;
    createdAt?: string;
    startedAt?: string;
    completedAt?: string;
    summaryPointsOfFocus?: string[];
    quizPointsOfFocus?: string[];
    quizScore?: number;
    summary?: string;
    sessionFeedback?: string;
    lessonContent?: string;
    quizElements?: QuizElementDTO[];
    qnaElements?: QnAElementDTO[];
    summaryElements?: SummaryElementDTO[];
    // Deprecated/Mapped fields locally
    topic?: string;
    selectedModule?: string;
    notes?: string;
    updatedAt?: string;
}

/**
 * DTO for partial session updates.
 * All fields are optional - only provided fields will be updated.
 */
export interface SessionUpdateDTO {
    status?: string;
    sessionType?: SessionType;
    startedAt?: string;
    completedAt?: string;
    summaryPointsOfFocus?: string[];
    quizPointsOfFocus?: string[];
    quizScore?: number;
    summary?: string;
    sessionFeedback?: string;
    lessonContent?: string;
    quizElements?: QuizElementDTO[];
    qnaElements?: QnAElementDTO[];
    summaryElements?: SummaryElementDTO[];
}


export interface Session {
  id?: string;
  sessionName: string;
  description: string;
  date: string;
  createdAt?: string;
  startedAt?: string;
  time?: string;
  status: 'COMPLETED' | 'ONGOING' | 'PENDING';
  // Fields from backend
  subject?: string;
  module?: string;
  lesson?: string;
  sessionType: SessionType;
  sessionGoal?: string;
  parentTip?: string;
  quizScore?: number;
}
