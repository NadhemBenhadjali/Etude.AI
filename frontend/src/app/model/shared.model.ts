import {Session} from './session.model';

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    OFF = 4
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}


export interface CalendarDay {
  number: number;
  isToday: boolean;
  status: 'completed' | 'incomplete' | 'mixed' | '';
  sessions: Session[];
  arabicDate: string;
  isCurrentMonth: boolean;
}
export interface Difficulty {
  name: string;
  severity: 'high' | 'medium' | 'low';
}

export interface Slide {
  number: string;
  text?: string;
  image?: string | null;
}

export interface Activity {
  icon: string;
  text: string;
}

export interface ModuleOption {
  name: string;
  value: string;
  icon: string;
}
export interface SubjectOption {
  name: string;
  value: string;
  color: string;
  icon: string;
  modules: ModuleOption[];
}
