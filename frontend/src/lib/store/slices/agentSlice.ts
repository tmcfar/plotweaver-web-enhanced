import { StateCreator, AgentJob } from '../../../types/store';

export interface AgentSlice {
  // State
  activeJobs: Map<string, AgentJob>;
  queuedJobs: AgentJob[];
  completedJobs: AgentJob[];

  // Actions
  addJob: (job: Omit<AgentJob, 'id' | 'createdAt'>) => string;
  startJob: (jobId: string) => void;
  updateJobProgress: (jobId: string, progress: number) => void;
  completeJob: (jobId: string, result: unknown) => void;
  failJob: (jobId: string, error: string) => void;
  cancelJob: (jobId: string) => void;
  removeJob: (jobId: string) => void;
  clearCompleted: () => void;
}

const generateJobId = () => `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const createAgentSlice: StateCreator<AgentSlice> = (set) => ({
  // Initial state
  activeJobs: new Map(),
  queuedJobs: [],
  completedJobs: [],

  // Actions
  addJob: (jobData) => {
    const jobId = generateJobId();
    const job: AgentJob = {
      ...jobData,
      id: jobId,
      status: 'queued',
      createdAt: new Date()
    };

    set((state) => ({
      queuedJobs: [...state.queuedJobs, job]
    }));

    return jobId;
  },

  startJob: (jobId) => set((state) => {
    const queuedJob = state.queuedJobs.find(job => job.id === jobId);
    if (!queuedJob) return state;

    const runningJob = { ...queuedJob, status: 'running' as const };
    const newActive = new Map(state.activeJobs);
    newActive.set(jobId, runningJob);

    return {
      activeJobs: newActive,
      queuedJobs: state.queuedJobs.filter(job => job.id !== jobId)
    };
  }),

  updateJobProgress: (jobId, progress) => set((state) => {
    const newActive = new Map(state.activeJobs);
    const job = newActive.get(jobId);

    if (job) {
      newActive.set(jobId, { ...job, progress });
    }

    return { activeJobs: newActive };
  }),

  completeJob: (jobId, result) => set((state) => {
    const job = state.activeJobs.get(jobId);
    if (!job) return state;

    const completedJob = {
      ...job,
      status: 'completed' as const,
      result,
      completedAt: new Date()
    };

    const newActive = new Map(state.activeJobs);
    newActive.delete(jobId);

    return {
      activeJobs: newActive,
      completedJobs: [...state.completedJobs, completedJob]
    };
  }),

  failJob: (jobId, error) => set((state) => {
    const job = state.activeJobs.get(jobId);
    if (!job) return state;

    const failedJob = {
      ...job,
      status: 'error' as const,
      error,
      completedAt: new Date()
    };

    const newActive = new Map(state.activeJobs);
    newActive.delete(jobId);

    return {
      activeJobs: newActive,
      completedJobs: [...state.completedJobs, failedJob]
    };
  }),

  cancelJob: (jobId) => set((state) => {
    const newActive = new Map(state.activeJobs);
    newActive.delete(jobId);

    return {
      activeJobs: newActive,
      queuedJobs: state.queuedJobs.filter(job => job.id !== jobId)
    };
  }),

  removeJob: (jobId) => set((state) => {
    const newActive = new Map(state.activeJobs);
    newActive.delete(jobId);

    return {
      activeJobs: newActive,
      queuedJobs: state.queuedJobs.filter(job => job.id !== jobId),
      completedJobs: state.completedJobs.filter(job => job.id !== jobId)
    };
  }),

  clearCompleted: () => set(() => ({
    completedJobs: []
  }))
});