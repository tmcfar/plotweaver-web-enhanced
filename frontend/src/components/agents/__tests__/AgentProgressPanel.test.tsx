import { render, screen } from '@testing-library/react';
import { AgentProgressPanel } from '../AgentProgressPanel';
import { useAgentQueue } from '../../../hooks/useAgentQueue';
import { useAgentProgress } from '../../../hooks/useAgentProgress';

// Mock the hooks
jest.mock('../../../hooks/useAgentQueue');
jest.mock('../../../hooks/useAgentProgress');

// Mock the child component since it has complex internal logic
jest.mock('../AgentProgressItem', () => ({
  AgentProgressItem: ({ job, progress }: any) => (
    <div data-testid="agent-progress-item">
      <div>{job.displayName}</div>
      <div>{progress?.percentage || job.progress}%</div>
    </div>
  )
}));

const mockUseAgentQueue = useAgentQueue as jest.MockedFunction<typeof useAgentQueue>;
const mockUseAgentProgress = useAgentProgress as jest.MockedFunction<typeof useAgentProgress>;

const mockActiveJob = {
  id: 'job-1',
  agentName: 'Scene Generator',
  displayName: 'Scene Generator',
  status: 'running' as const,
  progress: 50,
  currentTask: 'Analyzing plot structure...',
  createdAt: new Date(),
  startedAt: new Date()
};

const mockQueuedJob = {
  id: 'job-2',
  agentName: 'Character Developer',
  displayName: 'Character Developer',
  status: 'queued' as const,
  progress: 0,
  createdAt: new Date(),
  startedAt: new Date()
};

describe('AgentProgressPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAgentProgress.mockReturnValue({
      progress: { percentage: 50, status: 'running', message: 'Test progress' }
    });
  });

  describe('Basic Rendering', () => {
    it('shows empty state when no active jobs', () => {
      mockUseAgentQueue.mockReturnValue({
        active: null,
        queue: [],
        completed: []
      });

      render(<AgentProgressPanel />);
      
      expect(screen.getByText('Agent Progress')).toBeInTheDocument();
      expect(screen.getByText('No active agent jobs')).toBeInTheDocument();
    });

    it('displays active job correctly', () => {
      mockUseAgentQueue.mockReturnValue({
        active: mockActiveJob,
        queue: [],
        completed: []
      });

      render(<AgentProgressPanel />);
      
      expect(screen.getByText('Agent Progress')).toBeInTheDocument();
      expect(screen.getByText('1 active job')).toBeInTheDocument();
      expect(screen.getByText('Scene Generator')).toBeInTheDocument();
    });

    it('displays singular text for single job', () => {
      mockUseAgentQueue.mockReturnValue({
        active: mockActiveJob,
        queue: [],
        completed: []
      });

      render(<AgentProgressPanel />);
      
      expect(screen.getByText('1 active job')).toBeInTheDocument();
    });

    it('shows correct count with queue', () => {
      mockUseAgentQueue.mockReturnValue({
        active: mockActiveJob,
        queue: [mockQueuedJob],
        completed: []
      });

      render(<AgentProgressPanel />);
      
      expect(screen.getByText('1 active job')).toBeInTheDocument();
      expect(screen.getByText('Scene Generator')).toBeInTheDocument();
      expect(screen.getByText('Character Developer')).toBeInTheDocument();
    });
  });

  describe('Job Display', () => {
    it('shows multiple jobs when active and queued exist', () => {
      mockUseAgentQueue.mockReturnValue({
        active: mockActiveJob,
        queue: [mockQueuedJob],
        completed: []
      });

      render(<AgentProgressPanel />);
      
      const jobItems = screen.getAllByTestId('agent-progress-item');
      expect(jobItems).toHaveLength(2);
      
      expect(screen.getByText('Scene Generator')).toBeInTheDocument();
      expect(screen.getByText('Character Developer')).toBeInTheDocument();
    });

    it('shows only queued jobs when no active job', () => {
      mockUseAgentQueue.mockReturnValue({
        active: null,
        queue: [mockQueuedJob],
        completed: []
      });

      render(<AgentProgressPanel />);
      
      expect(screen.getByText('0 active jobs')).toBeInTheDocument();
      expect(screen.getByText('Character Developer')).toBeInTheDocument();
    });
  });

  describe('State Updates', () => {
    it('updates when job status changes', () => {
      mockUseAgentQueue.mockReturnValue({
        active: mockActiveJob,
        queue: [],
        completed: []
      });
      
      const { rerender } = render(<AgentProgressPanel />);

      expect(screen.getByText('1 active job')).toBeInTheDocument();

      mockUseAgentQueue.mockReturnValue({
        active: null,
        queue: [],
        completed: []
      });

      rerender(<AgentProgressPanel />);

      expect(screen.getByText('No active agent jobs')).toBeInTheDocument();
    });

    it('updates when queue changes', () => {
      mockUseAgentQueue.mockReturnValue({
        active: mockActiveJob,
        queue: [],
        completed: []
      });
      
      const { rerender } = render(<AgentProgressPanel />);

      expect(screen.getAllByTestId('agent-progress-item')).toHaveLength(1);

      mockUseAgentQueue.mockReturnValue({
        active: mockActiveJob,
        queue: [mockQueuedJob],
        completed: []
      });

      rerender(<AgentProgressPanel />);

      expect(screen.getAllByTestId('agent-progress-item')).toHaveLength(2);
    });
  });
});