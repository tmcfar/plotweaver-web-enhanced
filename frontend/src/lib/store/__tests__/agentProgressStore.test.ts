import { useAgentProgressStore, AgentProgress, AgentJobWithTask } from '../agentProgressStore';

describe('agentProgressStore', () => {
  // Reset store state before each test
  beforeEach(() => {
    useAgentProgressStore.setState({
      activeJobs: new Map(),
      queuedJobs: [],
      completedJobs: []
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAgentProgressStore.getState();
      
      expect(state.activeJobs).toEqual(new Map());
      expect(state.queuedJobs).toEqual([]);
      expect(state.completedJobs).toEqual([]);
    });
  });

  describe('Queue Management', () => {
    const mockJob: AgentJobWithTask = {
      id: 'job-1',
      agentName: 'test-agent',
      displayName: 'Test Agent',
      status: 'queued',
      progress: 0,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      startedAt: new Date('2024-01-01T10:00:00Z'),
      currentTask: 'Initializing'
    };

    it('should add job to queue', () => {
      const { addToQueue } = useAgentProgressStore.getState();
      
      addToQueue(mockJob);
      
      const state = useAgentProgressStore.getState();
      expect(state.queuedJobs).toHaveLength(1);
      expect(state.queuedJobs[0]).toEqual(mockJob);
    });

    it('should add multiple jobs to queue', () => {
      const { addToQueue } = useAgentProgressStore.getState();
      
      const job1 = { ...mockJob, id: 'job-1' };
      const job2 = { ...mockJob, id: 'job-2', displayName: 'Test Agent 2' };
      
      addToQueue(job1);
      addToQueue(job2);
      
      const state = useAgentProgressStore.getState();
      expect(state.queuedJobs).toHaveLength(2);
      expect(state.queuedJobs[0].id).toBe('job-1');
      expect(state.queuedJobs[1].id).toBe('job-2');
    });
  });

  describe('Progress Updates', () => {
    const mockJob: AgentJobWithTask = {
      id: 'job-1',
      agentName: 'test-agent',
      displayName: 'Test Agent',
      status: 'running',
      progress: 0,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      startedAt: new Date('2024-01-01T10:00:00Z')
    };

    beforeEach(() => {
      // Add a job to active jobs
      useAgentProgressStore.setState({
        activeJobs: new Map([['job-1', mockJob]])
      });
    });

    it('should update job progress', () => {
      const { updateProgress } = useAgentProgressStore.getState();
      
      const progress: AgentProgress = {
        progress: 50,
        currentTask: 'Processing data',
        status: 'running'
      };
      
      updateProgress('job-1', progress);
      
      const state = useAgentProgressStore.getState();
      const updatedJob = state.activeJobs.get('job-1');
      
      expect(updatedJob).toBeDefined();
      expect(updatedJob?.progress).toBe(50);
      expect(updatedJob?.currentTask).toBe('Processing data');
      expect(updatedJob?.status).toBe('running');
    });

    it('should update only provided fields', () => {
      const { updateProgress } = useAgentProgressStore.getState();
      
      // First update with partial data
      updateProgress('job-1', {
        progress: 25,
        status: 'running'
      });
      
      let state = useAgentProgressStore.getState();
      let job = state.activeJobs.get('job-1');
      expect(job?.progress).toBe(25);
      expect(job?.currentTask).toBeUndefined();
      
      // Second update with different fields
      updateProgress('job-1', {
        progress: 50,
        currentTask: 'Analyzing',
        status: 'running'
      });
      
      state = useAgentProgressStore.getState();
      job = state.activeJobs.get('job-1');
      expect(job?.progress).toBe(50);
      expect(job?.currentTask).toBe('Analyzing');
    });

    it('should not update non-existent job', () => {
      const { updateProgress } = useAgentProgressStore.getState();
      
      const initialState = useAgentProgressStore.getState();
      
      updateProgress('non-existent', {
        progress: 100,
        status: 'completed'
      });
      
      const state = useAgentProgressStore.getState();
      expect(state.activeJobs).toEqual(initialState.activeJobs);
    });
  });

  describe('Job Completion', () => {
    const mockJob: AgentJobWithTask = {
      id: 'job-1',
      agentName: 'test-agent',
      displayName: 'Test Agent',
      status: 'running',
      progress: 90,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      startedAt: new Date('2024-01-01T10:00:00Z'),
      currentTask: 'Finalizing'
    };

    beforeEach(() => {
      useAgentProgressStore.setState({
        activeJobs: new Map([['job-1', mockJob]])
      });
    });

    it('should mark job as completed', () => {
      const { markComplete } = useAgentProgressStore.getState();
      
      const result = { data: 'Job completed successfully' };
      markComplete('job-1', result);
      
      const state = useAgentProgressStore.getState();
      
      // Should be removed from active jobs
      expect(state.activeJobs.has('job-1')).toBe(false);
      
      // Should be added to completed jobs
      expect(state.completedJobs).toHaveLength(1);
      expect(state.completedJobs[0]).toMatchObject({
        id: 'job-1',
        status: 'completed',
        result,
        completedAt: expect.any(Date)
      });
    });

    it('should not complete non-existent job', () => {
      const { markComplete } = useAgentProgressStore.getState();
      
      markComplete('non-existent', { data: 'test' });
      
      const state = useAgentProgressStore.getState();
      expect(state.activeJobs.size).toBe(1);
      expect(state.completedJobs).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    const mockJob: AgentJobWithTask = {
      id: 'job-1',
      agentName: 'test-agent',
      displayName: 'Test Agent',
      status: 'running',
      progress: 50,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      startedAt: new Date('2024-01-01T10:00:00Z')
    };

    beforeEach(() => {
      useAgentProgressStore.setState({
        activeJobs: new Map([['job-1', mockJob]])
      });
    });

    it('should mark job as error', () => {
      const { markError } = useAgentProgressStore.getState();
      
      const errorMessage = 'Network error occurred';
      markError('job-1', errorMessage);
      
      const state = useAgentProgressStore.getState();
      
      // Should be removed from active jobs
      expect(state.activeJobs.has('job-1')).toBe(false);
      
      // Should be added to completed jobs with error status
      expect(state.completedJobs).toHaveLength(1);
      expect(state.completedJobs[0]).toMatchObject({
        id: 'job-1',
        status: 'error',
        error: errorMessage,
        completedAt: expect.any(Date)
      });
    });

    it('should not mark error for non-existent job', () => {
      const { markError } = useAgentProgressStore.getState();
      
      markError('non-existent', 'Error message');
      
      const state = useAgentProgressStore.getState();
      expect(state.activeJobs.size).toBe(1);
      expect(state.completedJobs).toHaveLength(0);
    });
  });

  describe('Job Cancellation', () => {
    const mockJob: AgentJobWithTask = {
      id: 'job-1',
      agentName: 'test-agent',
      displayName: 'Test Agent',
      status: 'running',
      progress: 30,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      startedAt: new Date('2024-01-01T10:00:00Z')
    };

    beforeEach(() => {
      useAgentProgressStore.setState({
        activeJobs: new Map([['job-1', mockJob]])
      });
    });

    it('should cancel job', () => {
      const { cancelJob } = useAgentProgressStore.getState();
      
      cancelJob('job-1');
      
      const state = useAgentProgressStore.getState();
      
      // Should be removed from active jobs
      expect(state.activeJobs.has('job-1')).toBe(false);
      
      // Should be added to completed jobs as cancelled
      expect(state.completedJobs).toHaveLength(1);
      expect(state.completedJobs[0]).toMatchObject({
        id: 'job-1',
        status: 'error',
        error: 'Job cancelled by user',
        completedAt: expect.any(Date)
      });
    });

    it('should not cancel non-existent job', () => {
      const { cancelJob } = useAgentProgressStore.getState();
      
      cancelJob('non-existent');
      
      const state = useAgentProgressStore.getState();
      expect(state.activeJobs.size).toBe(1);
      expect(state.completedJobs).toHaveLength(0);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple concurrent jobs', () => {
      const { addToQueue, updateProgress, markComplete } = useAgentProgressStore.getState();
      
      // Add multiple jobs
      const job1: AgentJobWithTask = {
        id: 'job-1',
        agentName: 'agent-1',
        displayName: 'Agent 1',
        status: 'queued',
        progress: 0,
        createdAt: new Date(),
        startedAt: new Date()
      };
      
      const job2: AgentJobWithTask = {
        id: 'job-2',
        agentName: 'agent-2',
        displayName: 'Agent 2',
        status: 'queued',
        progress: 0,
        createdAt: new Date(),
        startedAt: new Date()
      };
      
      const job3: AgentJobWithTask = {
        id: 'job-3',
        agentName: 'agent-3',
        displayName: 'Agent 3',
        status: 'queued',
        progress: 0,
        createdAt: new Date(),
        startedAt: new Date()
      };
      
      addToQueue(job1);
      addToQueue(job2);
      addToQueue(job3);
      
      // Move jobs to active
      useAgentProgressStore.setState(state => ({
        activeJobs: new Map([
          ['job-1', { ...job1, status: 'running' }],
          ['job-2', { ...job2, status: 'running' }]
        ]),
        queuedJobs: [job3]
      }));
      
      // Update progress on multiple jobs
      updateProgress('job-1', { progress: 50, status: 'running' });
      updateProgress('job-2', { progress: 75, status: 'running' });
      
      // Complete one job
      markComplete('job-1', { result: 'Success' });
      
      const state = useAgentProgressStore.getState();
      expect(state.activeJobs.size).toBe(1);
      expect(state.activeJobs.has('job-2')).toBe(true);
      expect(state.queuedJobs).toHaveLength(1);
      expect(state.completedJobs).toHaveLength(1);
      expect(state.completedJobs[0].id).toBe('job-1');
    });

    it('should maintain job order in queues', () => {
      const { addToQueue } = useAgentProgressStore.getState();
      
      const jobs = Array.from({ length: 5 }, (_, i) => ({
        id: `job-${i}`,
        agentName: `agent-${i}`,
        displayName: `Agent ${i}`,
        status: 'queued' as const,
        progress: 0,
        createdAt: new Date(),
        startedAt: new Date()
      }));
      
      jobs.forEach(job => addToQueue(job));
      
      const state = useAgentProgressStore.getState();
      expect(state.queuedJobs).toHaveLength(5);
      state.queuedJobs.forEach((job, index) => {
        expect(job.id).toBe(`job-${index}`);
      });
    });

    it('should handle rapid status transitions', () => {
      const { updateProgress, markComplete, markError } = useAgentProgressStore.getState();
      
      const job: AgentJobWithTask = {
        id: 'job-1',
        agentName: 'test-agent',
        displayName: 'Test Agent',
        status: 'running',
        progress: 0,
        createdAt: new Date(),
        startedAt: new Date()
      };
      
      useAgentProgressStore.setState({
        activeJobs: new Map([['job-1', job]])
      });
      
      // Rapid progress updates
      updateProgress('job-1', { progress: 10, status: 'running' });
      updateProgress('job-1', { progress: 30, status: 'running' });
      updateProgress('job-1', { progress: 50, status: 'running' });
      updateProgress('job-1', { progress: 80, status: 'running' });
      
      // Try to complete the job
      markComplete('job-1', { result: 'Done' });
      
      // Try to mark it as error (should not work as it's already completed)
      markError('job-1', 'This should not work');
      
      const state = useAgentProgressStore.getState();
      expect(state.completedJobs).toHaveLength(1);
      expect(state.completedJobs[0].status).toBe('completed');
      expect(state.completedJobs[0].error).toBeUndefined();
    });
  });
});