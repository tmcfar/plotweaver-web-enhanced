import { useAgentProgressStore } from '../lib/store/agentProgressStore';

export function useAgentQueue() {
  const { activeJobs, queuedJobs, completedJobs } = useAgentProgressStore();

  return {
    active: Array.from(activeJobs.values())[0], // For now, assume one active job
    queue: queuedJobs,
    completed: completedJobs
  };
}
