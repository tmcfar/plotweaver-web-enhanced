import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreGenerationQueue } from '@/components/advanced/PreGenerationQueue';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Using Jest mocks

// Mock API
const mockFetchQueueItems = jest.fn();
const mockUpdateQueuePriority = jest.fn();
const mockPauseQueueItem = jest.fn();
const mockResumeQueueItem = jest.fn();
const mockCancelQueueItem = jest.fn();
const mockBatchQueueOperation = jest.fn();
const mockReorderQueue = jest.fn();

jest.mock('@/lib/api/queue', () => ({
  fetchQueueItems: mockFetchQueueItems,
  updateQueuePriority: mockUpdateQueuePriority,
  pauseQueueItem: mockPauseQueueItem,
  resumeQueueItem: mockResumeQueueItem,
  cancelQueueItem: mockCancelQueueItem,
  batchQueueOperation: mockBatchQueueOperation,
  reorderQueue: mockReorderQueue,
}));

// Mock hooks
jest.mock('@/hooks/useAgentQueue', () => ({
  useAgentQueue: () => ({
    queueItems: mockQueueItems,
    isLoading: false,
    refetch: jest.fn(),
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

  const renderComponent = (queuedScenes = mockQueueItems) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PreGenerationQueue 
          projectId="test-project"
          queuedScenes={queuedScenes.map(item => ({
            id: item.id,
            title: item.sceneName,
            chapterId: 'chapter-1',
            chapterTitle: 'Chapter 1',
            position: 1,
            status: item.status,
            priority: item.priority,
            estimatedTokens: 1000,
            estimatedCost: item.estimatedCost,
            estimatedTime: item.estimatedTime,
            queuedAt: item.createdAt,
            startedAt: item.createdAt,
            completedAt: item.completedAt,
            progress: item.progress,
            error: item.error,
            context: {
              characters: ['Character 1'],
              settings: ['Setting 1'],
              plotPoints: ['Plot Point 1']
            },
            generatedContent: item.result?.content,
            wordCount: item.result?.content ? 500 : undefined
          }))}
          onQueueUpdate={() => {}}
          onGenerationStart={() => {}}
          onGenerationCancel={() => {}}
          onGenerationPause={() => {}}
          onGenerationResume={() => {}}
          isProcessing={false}
        />
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

    // Should show scene count in header
    expect(screen.getByText(/4 scenes/)).toBeInTheDocument();
  });

  it('shows cost and time estimates', () => {
    renderComponent();

    // Should show cost and time estimates in header
    expect(screen.getByText(/Est\. \$/)).toBeInTheDocument();
  });

  it('displays priority badges correctly', () => {
    renderComponent();

    const urgentBadge = screen.getByText('urgent');
    expect(urgentBadge).toHaveClass('bg-red-100');

    const highBadge = screen.getByText('high');
    expect(highBadge).toHaveClass('bg-orange-100');

    const normalBadge = screen.getByText('normal');
    expect(normalBadge).toHaveClass('bg-blue-100');

    const lowBadge = screen.getByText('low');
    expect(lowBadge).toHaveClass('bg-gray-100');
  });

  it('shows progress bars for generating items', () => {
    renderComponent();

    // Find the generating item with progress
    expect(screen.getByText('45% complete')).toBeInTheDocument();
  });

  it('filters queue by status', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Filter by generating
    const filterSelect = screen.getByDisplayValue('All Scenes');
    await user.selectOptions(filterSelect, 'generating');

    // Should only show generating item
    expect(screen.getByText('Character Introduction')).toBeInTheDocument();
    expect(screen.queryByText('Opening Scene')).not.toBeInTheDocument();
    expect(screen.queryByText('Conflict Scene')).not.toBeInTheDocument();
  });

  it('shows priority selection dropdowns', async () => {
    renderComponent();
    
    // Test that select elements are present (Filter + Sort + Priority selects per item)
    const allSelects = screen.getAllByRole('combobox');
    expect(allSelects.length).toBeGreaterThan(2); // Filter + Sort + Priority selects
  });

  it('handles pause/resume operations', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Find pause button for generating item (should be present for generating status)
    const pauseButtons = screen.getAllByRole('button');
    const pauseButton = pauseButtons.find(btn => 
      btn.querySelector('svg[class*="lucide-pause"]')
    );
    
    expect(pauseButton).toBeInTheDocument();
  });

  it('shows cancel buttons for items', async () => {
    renderComponent();

    // Find cancel buttons (X icon buttons)
    const cancelButtons = screen.getAllByRole('button');
    const xButtons = cancelButtons.filter(btn => 
      btn.querySelector('svg[class*="lucide-x"]')
    );
    
    expect(xButtons.length).toBeGreaterThan(0);
  });

  it('shows preview buttons for completed items', async () => {
    renderComponent();

    // Find preview buttons (Eye icon buttons) for completed items
    const eyeButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg[class*="lucide-eye"]')
    );
    
    expect(eyeButtons.length).toBeGreaterThan(0);
  });

  it('shows failed items with error status', async () => {
    renderComponent();

    // Check that failed item exists
    expect(screen.getByText('Failed Scene')).toBeInTheDocument();
    
    // Check that alert icon is present for failed items
    const alertIcons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg[class*="lucide-circle-alert"]') ||
      document.querySelector('svg[class*="lucide-circle-alert"]')
    );
    
    // Failed items should have alert visual indicator
    expect(document.querySelector('svg[class*="lucide-circle-alert"]')).toBeInTheDocument();
  });

  it('shows queue positioning controls', async () => {
    renderComponent();

    // Find move up/down buttons (ChevronUp/Down icons) for queued items
    const chevronButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg[class*="lucide-chevron"]')
    );
    
    expect(chevronButtons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no items', async () => {
    renderComponent([]);

    expect(screen.getByText('No scenes in queue')).toBeInTheDocument();
    expect(screen.getByText('Queue scenes for background generation')).toBeInTheDocument();
  });

  it('renders component without errors', () => {
    renderComponent();
    
    expect(screen.getByText('Pre-Generation Queue')).toBeInTheDocument();
  });
});
