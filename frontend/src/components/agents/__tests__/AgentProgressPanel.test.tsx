import { render, screen } from '@testing-library/react';
import { AgentProgressPanel } from '../AgentProgressPanel';
import { useAgentQueue } from '../../../hooks/useAgentQueue';

// Mock the hooks
jest.mock('../../../hooks/useAgentQueue');
jest.mock('../../../hooks/useAgentProgress');

const mockUseAgentQueue = useAgentQueue as jest.MockedFunction<typeof useAgentQueue>;

const mockActiveJobs = [
  {
    id: 'job-1',
    agentName: 'Scene Generator',
    status: 'running' as const
  },
  {
    id: 'job-2',
    agentName: 'Character Developer',
    status: 'running' as const
  }
];

describe('AgentProgressPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows empty state when no active jobs', () => {
    mockUseAgentQueue.mockReturnValue({
      activeJobs: [],
      queuedJobs: [],
      completedJobs: [],
      addJob: jest.fn(),
      removeJob: jest.fn(),
      clearCompleted: jest.fn()
    });

    render(<AgentProgressPanel />);
    
    expect(screen.getByText('Agent Progress')).toBeInTheDocument();
    expect(screen.getByText('No active agent jobs')).toBeInTheDocument();
  });

  it('displays active jobs with correct count', () => {
    mockUseAgentQueue.mockReturnValue({
      activeJobs: mockActiveJobs,
      queuedJobs: [],
      completedJobs: [],
      addJob: jest.fn(),
      removeJob: jest.fn(),
      clearCompleted: jest.fn()
    });

    render(<AgentProgressPanel />);
    
    expect(screen.getByText('Agent Progress')).toBeInTheDocument();
    expect(screen.getByText('2 active jobs')).toBeInTheDocument();
  });

  it('displays singular text for single job', () => {
    mockUseAgentQueue.mockReturnValue({
      activeJobs: [mockActiveJobs[0]],
      queuedJobs: [],
      completedJobs: [],
      addJob: jest.fn(),
      removeJob: jest.fn(),
      clearCompleted: jest.fn()
    });

    render(<AgentProgressPanel />);
    
    expect(screen.getByText('1 active job')).toBeInTheDocument();
  });
});