import { Injectable } from '@angular/core';
import { SessionState } from '../model/session.model';




@Injectable({
  providedIn: 'root'
})
export class SessionStateService {
  private readonly STORAGE_KEY = 'etude_session_state';

  constructor() { }

  // Save the session state to localStorage
  saveState(state: SessionState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save session state', e);
    }
  }

  // Get the current session state
  getState(): SessionState | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load session state', e);
    }
    return null;
  }

  // Clear the session state
  clearState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear session state', e);
    }
  }

  // Update only the level
  setLevel(level: string): void {
    const state = this.getState() || { selectedLevel: '', selectedSubject: '', selectedModule: '' };
    state.selectedLevel = level;
    this.saveState(state);
  }

  // Update only the subject
  setSubject(subject: string): void {
    const state = this.getState() || { selectedLevel: '', selectedSubject: '', selectedModule: '' };
    state.selectedSubject = subject;
    this.saveState(state);
  }

  // Update only the module
  setModule(module: string): void {
    const state = this.getState() || { selectedLevel: '', selectedSubject: '', selectedModule: '' };
    state.selectedModule = module;
    this.saveState(state);
  }
}

