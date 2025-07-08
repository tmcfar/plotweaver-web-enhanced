export interface User {
  id: string;
  name: string;
  email: string;
  preferences: Record<string, unknown>;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WritingMode {
  primary: 'discovery' | 'outlining' | 'drafting' | 'revision';
  secondary?: string[];
}

export interface OpenFile {
  id: string;
  name: string;
  type: 'scene' | 'metadata';
  content: string;
  lastModified: Date;
}

export interface AgentJob {
  id: string;
  agentName: string;
  displayName: string;
  status: 'queued' | 'running' | 'completed' | 'error';
  progress: number;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
  startedAt: Date;
  completedAt?: Date;
}

export interface Preferences {
  panelSizes: Record<string, number>;
  editorSettings: Record<string, unknown>;
  shortcuts: Record<string, string>;
}

// StateCreator type for Zustand slices
export type StateCreator<T> = (
  set: (fn: (state: T) => Partial<T>) => void,
  get: () => T,
  api: unknown
) => T;