export interface UserDTO {
    id?: string;
    keycloakUserId?: string;
    email: string;
    firstname: string;
    lastname: string;
    birthDate: string;
    level: 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH' | 'FIFTH' | 'SIXTH'
    elo?: number;
    role?: string;
    avatar?: string;
    totalQuizzes?: number;
    highestScore?: number;
    createdAt?: string;
    updatedAt?: string;
    totalQna ?: number;
    totalSummaries ?: number;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface RegistrationData {
    email: string;
    password: string;
    firstname: string;
    lastname: string;
    birthDate?: string;
    level?: string;
}

export interface StudentData {
  name: string;
  class: string;
  avatar: string;
  lastActivity: string;
  isOnline: boolean;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  status: 'completed' | 'in-progress' | 'pending';
  icon: string;
}
export const levelMap = {
  FIRST: 'السنة الاولى',
  SECOND: 'السنة الثانية',
  THIRD: 'السنة الثالثة',
  FOURTH: 'السنة الرابعة',
  FIFTH: 'السنة الخامسة',
  SIXTH: 'السنة السادسة',
};
