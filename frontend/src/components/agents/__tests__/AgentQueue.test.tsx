import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  const mockQueuedAgent = {
    id: 'queued-1',
    displayName: 'Queued Agent',
    status: 'queued' as const,
    progress: 0,
    startedAt: new Date()
  };

  const mockCompletedAgent = {
    id: 'completed-1',
    displayName: 'Completed Agent',
    status: 'completed' as const,
    progress: 100,
    startedAt: new Date(),
    completedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useGlobalStore as unknown as jest.Mock).mockReturnValue({
      modeSet: 'professional-writer'
    });

    (useAgentQueue as jest.Mock).mockReturnValue({
      active: mockActiveAgent,
      queue: [],
      completed: []
    });
  });

  describe('Basic Rendering', () => {
    it('renders professional view with active agent', () => {
      render(<AgentQueue />);

      expect(screen.getByText('Agent Activity')).toBeInTheDocument();
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('renders simplified view for hobbyist mode', () => {
      (useGlobalStore as unknown as jest.Mock).mockReturnValue({
        modeSet: 'hobbyist'
      });

      render(<AgentQueue />);

      expect(screen.getByText('Test Agent')).toBeInTheDocument();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.queryByText('Agent Activity')).not.toBeInTheDocument();
    });

    it('shows empty state when no agents', () => {
      (useAgentQueue as jest.Mock).mockReturnValue({
        active: null,
        queue: [],
        completed: []
      });

      render(<AgentQueue />);

      expect(screen.getByText('Agent Activity')).toBeInTheDocument();
      expect(screen.queryByText('Test Agent')).not.toBeInTheDocument();
    });
  });

  describe('Queue Display', () => {
    it('shows queued agents when available', () => {
      (useAgentQueue as jest.Mock).mockReturnValue({
        active: mockActiveAgent,
        queue: [mockQueuedAgent],
        completed: []
      });

      render(<AgentQueue />);

      expect(screen.getByText('Queued (1)')).toBeInTheDocument();
      expect(screen.getByText('Queued Agent')).toBeInTheDocument();
    });

    it('shows multiple queued agents', () => {
      (useAgentQueue as jest.Mock).mockReturnValue({
        active: mockActiveAgent,
        queue: [mockQueuedAgent, { ...mockQueuedAgent, id: 'queued-2', displayName: 'Second Queued' }],
        completed: []
      });

      render(<AgentQueue />);

      expect(screen.getByText('Queued (2)')).toBeInTheDocument();
      expect(screen.getByText('Queued Agent')).toBeInTheDocument();
      expect(screen.getByText('Second Queued')).toBeInTheDocument();
    });

    it('does not show queue section when empty', () => {
      render(<AgentQueue />);

      expect(screen.queryByText(/Queued/)).not.toBeInTheDocument();
    });
  });

  describe('Progress Display', () => {
    it('displays progress percentage in card', () => {
      render(<AgentQueue />);

      expect(screen.getByText('50% complete')).toBeInTheDocument();
    });

    it('handles zero progress correctly', () => {
      (useAgentQueue as jest.Mock).mockReturnValue({
        active: { ...mockActiveAgent, progress: 0 },
        queue: [],
        completed: []
      });

      render(<AgentQueue />);

      expect(screen.getByText('0% complete')).toBeInTheDocument();
    });

    it('handles complete progress correctly', () => {
      (useAgentQueue as jest.Mock).mockReturnValue({
        active: { ...mockActiveAgent, progress: 100 },
        queue: [],
        completed: []
      });

      render(<AgentQueue />);

      expect(screen.getByText('100% complete')).toBeInTheDocument();
    });

    it('shows progress bar visual', () => {
      render(<AgentQueue />);

      const progressContainer = document.querySelector('.h-2.bg-gray-100.rounded.overflow-hidden');
      expect(progressContainer).toBeInTheDocument();
      
      const progressBar = progressContainer?.querySelector('.h-full.bg-blue-500');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle('width: 50%');
    });
  });

  describe('Cancel Functionality', () => {
    it('shows cancel button for professional writer mode', () => {
      (useGlobalStore as unknown as jest.Mock).mockReturnValue({
        modeSet: 'professional-writer'
      });

      render(<AgentQueue />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('does not show cancel button for hobbyist mode', () => {
      (useGlobalStore as unknown as jest.Mock).mockReturnValue({
        modeSet: 'hobbyist'
      });

      render(<AgentQueue />);

      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('updates progress display when agent progress changes', async () => {
      const { rerender } = render(<AgentQueue />);

      expect(screen.getByText('50% complete')).toBeInTheDocument();

      (useAgentQueue as jest.Mock).mockReturnValue({
        active: { ...mockActiveAgent, progress: 100 },
        queue: [],
        completed: []
      });

      rerender(<AgentQueue />);

      await waitFor(() => {
        expect(screen.getByText('100% complete')).toBeInTheDocument();
      });
    });

    it('updates when queue changes', async () => {
      const { rerender } = render(<AgentQueue />);

      expect(screen.queryByText(/Queued/)).not.toBeInTheDocument();

      (useAgentQueue as jest.Mock).mockReturnValue({
        active: mockActiveAgent,
        queue: [mockQueuedAgent],
        completed: []
      });

      rerender(<AgentQueue />);

      await waitFor(() => {
        expect(screen.getByText('Queued (1)')).toBeInTheDocument();
      });
    });
  });
});
