import { render, screen } from '@testing-library/react';
import { AgentQueue } from '../AgentQueue';
import { useGlobalStore } from '../../../lib/store';
import { useAgentQueue } from '../../../hooks/useAgentQueue';

jest.mock('../../../lib/store', () => ({
  useGlobalStore: jest.fn()
}));

jest.mock('../../../hooks/useAgentQueue', () => ({
  useAgentQueue: jest.fn()
}));

describe('AgentQueue', () => {
  const mockActiveAgent = {
    id: 'job-1',
    displayName: 'Test Agent',
    currentTask: 'Processing...',
    progress: 50,
    status: 'running' as const,
    startedAt: new Date()
  };

  beforeEach(() => {
    (useGlobalStore as jest.Mock).mockReturnValue({
      modeSet: 'professional-writer'
    });

    (useAgentQueue as jest.Mock).mockReturnValue({
      active: mockActiveAgent,
      queue: [],
      completed: []
    });
  });

  it('renders professional view with active agent', () => {
    render(<AgentQueue />);

    expect(screen.getByText('Agent Activity')).toBeInTheDocument();
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('renders simplified view for hobbyist mode', () => {
    (useGlobalStore as jest.Mock).mockReturnValue({
      modeSet: 'hobbyist'
    });

    render(<AgentQueue />);

    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.queryByText('Agent Activity')).not.toBeInTheDocument();
  });

  it('shows queued agents when available', () => {
    (useAgentQueue as jest.Mock).mockReturnValue({
      active: mockActiveAgent,
      queue: [
        {
          id: 'queued-1',
          displayName: 'Queued Agent',
          status: 'queued' as const,
          progress: 0,
          startedAt: new Date()
        }
      ],
      completed: []
    });

    render(<AgentQueue />);

    expect(screen.getByText('Queued (1)')).toBeInTheDocument();
    expect(screen.getByText('Queued Agent')).toBeInTheDocument();
  });
});
