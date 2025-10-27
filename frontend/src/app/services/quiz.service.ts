import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface QuizQuestion {
  type: 'mc' | 'tf';
  q: string;
  options?: string[];
  a: string;
  category?: string;
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

@Injectable({ providedIn: 'root' })
export class QuizService {
  private staticQuizData: QuizQuestion[] = [
    {
      type: "mc",
      q: "ما عاصمة تونس؟",
      options: ["تونس", "سوسة", "بنزرت", "نابل"],
      a: "تونس"
    },
    {
      type: "tf",
      q: "هل البحر الأبيض المتوسط يحد تونس من الشمال؟",
      options: ["صح", "خطأ"],
      a: "صح"
    },
    {
      type: "mc",
      q: "كم عدد الولايات في تونس؟",
      options: ["24", "23", "25", "22"],
      a: "24"
    },
    {
      type: "mc",
      q: "ما هي أكبر جامعة في تونس؟",
      options: ["جامعة تونس", "جامعة قرطاج", "جامعة منوبة", "جامعة سوسة"],
      a: "جامعة تونس"
    },
    {
      type: "tf",
      q: "هل تونس دولة عربية؟",
      options: ["صح", "خطأ"],
      a: "صح"
    },
    {
      type: "mc",
      q: "ما هي العملة الرسمية لتونس؟",
      options: ["الدينار التونسي", "الدرهم", "الريال", "الجنيه"],
      a: "الدينار التونسي"
    },
    {
      type: "tf",
      q: "هل تونس تقع في قارة أفريقيا؟",
      options: ["صح", "خطأ"],
      a: "صح"
    },
    {
      type: "mc",
      q: "ما هو اللون المميز في العلم التونسي؟",
      options: ["الأحمر", "الأزرق", "الأخضر", "الأصفر"],
      a: "الأحمر"
    },
    {
      type: "tf",
      q: "هل تونس بلد صحراوي بالكامل؟",
      options: ["صح", "خطأ"],
      a: "خطأ"
    },
    {
      type: "mc",
      q: "ما هي اللغة الرسمية في تونس؟",
      options: ["العربية", "الفرنسية", "الإنجليزية", "الإيطالية"],
      a: "العربية",
      category: "اللغة"
    },
    {
      type: "tf",
      q: "هل مدينة قرطاج التاريخية تقع في تونس؟",
      options: ["صح", "خطأ"],
      a: "صح",
      category: "التاريخ"
    },
    {
      type: "mc",
      q: "ما هي المدينة الساحلية الشهيرة في تونس؟",
      options: ["سوسة", "القيروان", "سيدي بوزيد", "قابس"],
      a: "سوسة",
      category: "الجغرافيا"
    }
  ];

  constructor() {}

  /**
   * Generate a quiz from static data
   * This replaces the server call with static quiz questions
   */
  generateQuiz(request: QuizRequest): Observable<QuizResponse> {
    // Filter questions by type if needed
    const mcQuestions = this.staticQuizData.filter(q => q.type === 'mc');
    const tfQuestions = this.staticQuizData.filter(q => q.type === 'tf');

    // Get requested number of questions
    const selectedMC = mcQuestions.slice(0, request.num_mc);
    const selectedTF = tfQuestions.slice(0, request.num_tf);

    // Combine and shuffle, then limit to 10 total questions
    const allQuestions = [...selectedMC, ...selectedTF];
    const shuffledQuestions = this.shuffleArray([...allQuestions]).slice(0, 10);

    const response: QuizResponse = {
      module: request.module,
      data: {
        questions: shuffledQuestions
      }
    };

    // Return as Observable to maintain the same interface
    return of(response);
  }

  /**
   * Shuffle array utility function
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}