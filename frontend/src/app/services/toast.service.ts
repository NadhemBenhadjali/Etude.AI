import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  duration?: number;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts$ = new BehaviorSubject<Toast[]>([]);

  getToasts(): Observable<Toast[]> {
    return this.toasts$.asObservable();
  }

  /**
   * Show a success toast with celebration theme
   */
  success(message: string, duration: number = 4000): void {
    this.show({ message, type: 'success', duration, icon: '🎉' });
  }

  /**
   * Show an error toast with friendly message
   */
  error(message: string, duration: number = 5000): void {
    this.show({ message, type: 'error', duration, icon: '😅' });
  }

  /**
   * Show a warning toast
   */
  warning(message: string, duration: number = 4000): void {
    this.show({ message, type: 'warning', duration, icon: '⚠️' });
  }

  /**
   * Show an info toast
   */
  info(message: string, duration: number = 4000): void {
    this.show({ message, type: 'info', duration, icon: '💡' });
  }

  /**
   * Show a loading toast (no auto-dismiss)
   */
  loading(message: string): string {
    const id = this.generateId();
    const toast: Toast = { id, message, type: 'loading', icon: '⏳' };
    this.toasts$.next([...this.toasts$.value, toast]);
    return id;
  }

  /**
   * Dismiss a specific toast by ID
   */
  dismiss(id: string): void {
    this.toasts$.next(this.toasts$.value.filter(t => t.id !== id));
  }

  /**
   * Clear all toasts
   */
  clearAll(): void {
    this.toasts$.next([]);
  }

  private show(toast: Omit<Toast, 'id'>): void {
    const id = this.generateId();
    const newToast: Toast = { ...toast, id };

    // Limit to 4 visible toasts
    const currentToasts = this.toasts$.value;
    const updatedToasts = currentToasts.length >= 4
      ? [...currentToasts.slice(1), newToast]
      : [...currentToasts, newToast];

    this.toasts$.next(updatedToasts);

    if (toast.duration) {
      setTimeout(() => this.dismiss(id), toast.duration);
    }
  }

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

