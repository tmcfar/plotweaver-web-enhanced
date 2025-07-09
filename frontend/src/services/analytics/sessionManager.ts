import { v4 as uuidv4 } from 'uuid';
import { SessionData } from './types';

class SessionManager {
  private sessionData: SessionData | null = null;

  constructor() {
    this.initializeSession();
  }

  private initializeSession(): void {
    const existingSessionId = localStorage.getItem('plotweaver_session_id');
    const sessionStart = localStorage.getItem('session_start');
    
    if (existingSessionId && sessionStart) {
      this.sessionData = {
        sessionId: existingSessionId,
        startTime: sessionStart,
        projectId: this.getStoredProjectId(),
        userId: this.getStoredUserId()
      };
    } else {
      this.createNewSession();
    }
  }

  private createNewSession(): void {
    const sessionId = uuidv4();
    const startTime = new Date().toISOString();
    
    localStorage.setItem('plotweaver_session_id', sessionId);
    localStorage.setItem('session_start', startTime);
    
    this.sessionData = {
      sessionId,
      startTime,
      projectId: this.getStoredProjectId(),
      userId: this.getStoredUserId()
    };
  }

  private getStoredProjectId(): number | undefined {
    const projectId = localStorage.getItem('current_project_id');
    return projectId ? parseInt(projectId, 10) : undefined;
  }

  private getStoredUserId(): string | undefined {
    return localStorage.getItem('user_id') || undefined;
  }

  getSessionId(): string {
    return this.sessionData?.sessionId || '';
  }

  getSessionDuration(): number {
    if (!this.sessionData) return 0;
    return Date.now() - new Date(this.sessionData.startTime).getTime();
  }

  setProjectId(projectId: number): void {
    if (this.sessionData) {
      this.sessionData.projectId = projectId;
      localStorage.setItem('current_project_id', projectId.toString());
    }
  }

  setUserId(userId: string): void {
    if (this.sessionData) {
      this.sessionData.userId = userId;
      localStorage.setItem('user_id', userId);
    }
  }

  getProjectId(): number | undefined {
    return this.sessionData?.projectId;
  }

  getUserId(): string | undefined {
    return this.sessionData?.userId;
  }

  refreshSession(): void {
    this.createNewSession();
  }

  clearSession(): void {
    localStorage.removeItem('plotweaver_session_id');
    localStorage.removeItem('session_start');
    localStorage.removeItem('current_project_id');
    localStorage.removeItem('user_id');
    this.sessionData = null;
  }
}

export const sessionManager = new SessionManager();