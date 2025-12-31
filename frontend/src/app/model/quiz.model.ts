export interface QuizQuestion {
  type: 'mc' | 'tf';
  q: string;
  options?: string[];
  a: string;
  category?: string;
  userAnswer?: string;
  answered?: boolean;
}

export interface QuizRequest {
  module: string;
  num_mc: number;
  num_tf: number;
}

export interface QuizResponse {
  module: string;
  data: {
    questions: QuizQuestion[];
  };
}

export interface QuizElementDTO {
    id?: string;
    quizType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_ENDED' | 'CODING' | 'FILL_IN_THE_BLANK';
    question: string;
    options: string[];
    answer: string;
    answered: boolean;
}
