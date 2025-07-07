import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreGenerationQueue } from '@/components/advanced/PreGenerationQueue';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Mock API
vi.mock('@/lib/api/queue', () => ({
  fetchQueueItems: vi.fn(),
  updateQueuePriority: vi.fn(),
  pauseQueueItem: vi.fn(),
  resumeQueueItem: vi.fn(),
  cancelQueueItem: vi.fn(),
  batchQueueOperation: vi.fn(),
  reorderQueue: vi.fn(),
}));

// Mock hooks
vi.mock('@/hooks/useAgentQueue', () => ({
  useAgentQueue: () => ({
    queueItems: mockQueueItems,
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

const mockQueueItems = [
  {
    id: 'queue-1',
    sceneId: 'scene-1',
    sceneName: 'Opening Scene',
    priority: 'high',
    status: 'queued',
    estimatedCost: 0.15,
    estimatedTime: 120,
    progress: 0,
    createdAt: new Date('2024-01-01T10:00:00'),
  },
  {
    id: 'queue-2',
    sceneId: 'scene-2',
    sceneName: 'Character Introduction',
    priority: 'normal',
    status: 'generating',
    estimatedCost: 0.20,
    estimatedTime: 150,
    progress: 45,
    createdAt: new Date('2024-01-01T10:05:00'),
  },
  {
    id: 'queue-3',
    sceneId: 'scene-3',
    sceneName: 'Conflict Scene',
    priority: 'low',
    status: 'completed',
    estimatedCost: 0.18,
    estimatedTime: 130,
    progress: 100,
    completedAt: new Date('2024-01-01T10:10:00'),
    result: {
      content: 'Generated scene content...',
      quality: 0.92,
    },
  },
  {
    id: 'queue-4',
    sceneId: 'scene-4',
    sceneName: 'Failed Scene',
    priority: 'urgent',
    status: 'failed',
    estimatedCost: 0.10,
    estimatedTime: 90,
    progress: 0,
    error: 'Generation failed due to timeout',
    createdAt: new Date('2024-01-01T10:15:00'),
  },
];

describe('PreGenerationQueue', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PreGenerationQueue projectId="test-project" />
      </QueryClientProvider>
    );
  };

  it('renders queue items correctly', () => {
    renderComponent();

    expect(screen.getByText('Opening Scene')).toBeInTheDocument();
    expect(screen.getByText('Character Introduction')).toBeInTheDocument();
    expect(screen.getByText('Conflict Scene')).toBeInTheDocument();
    expect(screen.getByText('Failed Scene')).toBeInTheDocument();
  });

  it('displays queue statistics', () => {
    renderComponent();

    // Queue counts
    expect(screen.getByText('4 total')).toBeInTheDocument();
    expect(screen.getByText('1 queued')).toBeInTheDocument();
    expect(screen.getByText('1 generating')).toBeInTheDocument();
    expect(screen.getByText('1 completed')).toBeInTheDocument();
  });

  it('shows cost and time estimates', () => {
    renderComponent();

    // Total estimates
    expect(screen.getByText('Total Cost: $0.63')).toBeInTheDocument();
    expect(screen.getByText('Total Time: ~8 min')).toBeInTheDocument();
  });

  it('displays priority badges correctly', () => {
    renderComponent();

    const urgentBadge = screen.getByText('URGENT');
    expect(urgentBadge).toHaveClass('bg-red-500');

    const highBadge = screen.getByText('HIGH');
    expect(highBadge).toHaveClass('bg-orange-500');

    const normalBadge = screen.getByText('NORMAL');
    expect(normalBadge).toHaveClass('bg-blue-500');

    const lowBadge = screen.getByText('LOW');
    expect(lowBadge).toHaveClass('bg-gray-500');
  });

  it('shows progress bars for generating items', () => {
    renderComponent();

    const progressBar = screen.getByTestId('progress-queue-2');
    expect(progressBar).toHaveAttribute('aria-valuenow', '45');
  });

  it('filters queue by status', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Filter by generating
    const generatingFilter = screen.getByText('Generating');
    await user.click(generatingFilter);

    // Should only show generating item
    expect(screen.getByText('Character Introduction')).toBeInTheDocument();
    expect(screen.queryByText('Opening Scene')).not.toBeInTheDocument();
    expect(screen.queryByText('Conflict Scene')).not.toBeInTheDocument();
  });

  it('allows changing priority', async () => {
    const mockUpdatePriority = vi.fn().mockResolvedValue({ success: true });
    vi.mocked(updateQueuePriority).mockImplementation(mockUpdatePriority);

    const user = userEvent.setup();
    renderComponent();

    // Click priority dropdown for first item
    const priorityButton = screen.getByTestId('priority-queue-1');
    await user.click(priorityButton);

    // Select urgent priority
    const urgentOption = screen.getByText('Urgent');
    await user.click(urgentOption);

    await waitFor(() => {
      expect(mockUpdatePriority).toHaveBeenCalledWith('queue-1', 'urgent');
    });
  });

  it('handles pause/resume operations', async () => {
    const mockPause = vi.fn().mockResolvedValue({ success: true });
    const mockResume = vi.fn().mockResolvedValue({ success: true });
    vi.mocked(pauseQueueItem).mockImplementation(mockPause);
    vi.mocked(resumeQueueItem).mockImplementation(mockResume);

    const user = userEvent.setup();
    renderComponent();

    // Pause generating item
    const pauseButton = screen.getByTestId('pause-queue-2');
    await user.click(pauseButton);

    await waitFor(() => {
      expect(mockPause).toHaveBeenCalledWith('queue-2');
    });
  });

  it('allows canceling queued items', async () => {
    const mockCancel = vi.fn().mockResolvedValue({ success: true });
    vi.mocked(cancelQueueItem).mockImplementation(mockCancel);

    const user = userEvent.setup();
    renderComponent();

    // Cancel queued item
    const cancelButton = screen.getByTestId('cancel-queue-1');
    await user.click(cancelButton);

    // Confirm cancellation
    const confirmButton = screen.getByText('Confirm');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockCancel).toHaveBeenCalledWith('queue-1');
    });
  });

  it('displays content preview for completed items', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Click preview button
    const previewButton = screen.getByTestId('preview-queue-3');
    await user.click(previewButton);

    // Should show preview modal
    await waitFor(() => {
      expect(screen.getByText('Scene Preview')).toBeInTheDocument();
      expect(screen.getByText('Generated scene content...')).toBeInTheDocument();
      expect(screen.getByText('Quality: 92%')).toBeInTheDocument();
    });
  });

  it('shows error details for failed items', () => {
    renderComponent();

    expect(screen.getByText('Generation failed due to timeout')).toBeInTheDocument();
    
    // Retry button should be visible
    const retryButton = screen.getByTestId('retry-queue-4');
    expect(retryButton).toBeInTheDocument();
  });

  it('enables batch operations when items selected', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Select multiple items
    const checkbox1 = screen.getByTestId('select-queue-1');
    const checkbox2 = screen.getByTestId('select-queue-2');
    
    await user.click(checkbox1);
    await user.click(checkbox2);

    // Batch operations should be enabled
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    expect(screen.getByText('Pause Selected')).not.toBeDisabled();
    expect(screen.getByText('Cancel Selected')).not.toBeDisabled();
  });

  it('handles batch operations', async () => {
    const mockBatch = vi.fn().mockResolvedValue({ success: true });
    vi.mocked(batchQueueOperation).mockImplementation(mockBatch);

    const user = userEvent.setup();
    renderComponent();

    // Select items
    await user.click(screen.getByTestId('select-queue-1'));
    await user.click(screen.getByTestId('select-queue-2'));

    // Batch pause
    await user.click(screen.getByText('Pause Selected'));

    await waitFor(() => {
      expect(mockBatch).toHaveBeenCalledWith(
        ['queue-1', 'queue-2'],
        'pause'
      );
    });
  });

  it('allows reordering queue items', async () => {
    const mockReorder = vi.fn().mockResolvedValue({ success: true });
    vi.mocked(reorderQueue).mockImplementation(mockReorder);

    const user = userEvent.setup();
    renderComponent();

    // Move item up
    const moveUpButton = screen.getByTestId('move-up-queue-2');
    await user.click(moveUpButton);

    await waitFor(() => {
      expect(mockReorder).toHaveBeenCalled();
    });
  });

  it('disables operations for completed/failed items', () => {
    renderComponent();

    // Completed item should not have pause/cancel buttons
    expect(screen.queryByTestId('pause-queue-3')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cancel-queue-3')).not.toBeInTheDocument();

    // Failed item should only have retry
    expect(screen.queryByTestId('pause-queue-4')).not.toBeInTheDocument();
    expect(screen.getByTestId('retry-queue-4')).toBeInTheDocument();
  });

  it('shows empty state when no items', async () => {
    vi.mocked(useAgentQueue).mockReturnValueOnce({
      queueItems: [],
      isLoading: false,
      refetch: vi.fn(),
    });

    renderComponent();

    expect(screen.getByText('Queue is empty')).toBeInTheDocument();
    expect(screen.getByText('No scenes queued for generation')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    vi.mocked(useAgentQueue).mockReturnValueOnce({
      queueItems: [],
      isLoading: true,
      refetch: vi.fn(),
    });

    renderComponent();

    expect(screen.getByText('Loading queue...')).toBeInTheDocument();
  });

  it('refreshes queue data', async () => {
    const mockRefetch = vi.fn();
    vi.mocked(useAgentQueue).mockReturnValueOnce({
      queueItems: mockQueueItems,
      isLoading: false,
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderComponent();

    const refreshButton = screen.getByTestId('refresh-queue');
    await user.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalled();
  });
});
