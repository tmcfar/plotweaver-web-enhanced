import { create } from 'zustand';

export interface AgentJob {
  id: string;
  displayName: string;
  currentTask?: string;
  progress: number;
  status: 'queued' | 'running' | 'completed' | 'error';
  result?: unknown;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface AgentProgress {
  progress: number;
  currentTask?: string;
  status: AgentJob['status'];
  result?: unknown;
  error?: string;
}

interface AgentProgressState {
  activeJobs: Map<string, AgentJob>;
  queuedJobs: AgentJob[];
  completedJobs: AgentJob[];
  updateProgress: (jobId: string, progress: AgentProgress) => void;
  addToQueue: (job: AgentJob) => void;
  markComplete: (jobId: string, result: unknown) => void;
  markError: (jobId: string, error: string) => void;
  cancelJob: (jobId: string) => void;
}

export const useAgentProgressStore = create<AgentProgressState>((set) => ({
  activeJobs: new Map(),
  queuedJobs: [],
  completedJobs: [],

  updateProgress: (jobId, progress) =>
    set((state) => {
      const newActiveJobs = new Map(state.activeJobs);
      const job = newActiveJobs.get(jobId);
      if (job) {
        newActiveJobs.set(jobId, {
          ...job,
          ...progress,
          status: progress.status || job.status
        });
      }
      return { activeJobs: newActiveJobs };
    }),

  addToQueue: (job) =>
    set((state) => ({
      queuedJobs: [...state.queuedJobs, job]
    })),

  markComplete: (jobId, result) =>
    set((state) => {
      const job = state.activeJobs.get(jobId);
      if (!job) return state;

      const newActiveJobs = new Map(state.activeJobs);
      newActiveJobs.delete(jobId);

      return {
        activeJobs: newActiveJobs,
        completedJobs: [
          ...state.completedJobs,
          { ...job, result, status: 'completed', completedAt: new Date() }
        ]
      };
    }),

  markError: (jobId, error) =>
    set((state) => {
      const job = state.activeJobs.get(jobId);
      if (!job) return state;

      const newActiveJobs = new Map(state.activeJobs);
      newActiveJobs.delete(jobId);

      return {
        activeJobs: newActiveJobs,
        completedJobs: [
          ...state.completedJobs,
          { ...job, error, status: 'error', completedAt: new Date() }
        ]
      };
    }),

  cancelJob: (jobId) =>
    set((state) => {
      const job = state.activeJobs.get(jobId);
      if (!job) return state;

      const newActiveJobs = new Map(state.activeJobs);
      newActiveJobs.delete(jobId);

      return {
        activeJobs: newActiveJobs,
        completedJobs: [
          ...state.completedJobs,
          {
            ...job,
            status: 'error',
            error: 'Job cancelled by user',
            completedAt: new Date()
          }
        ]
      };
    })
}));
