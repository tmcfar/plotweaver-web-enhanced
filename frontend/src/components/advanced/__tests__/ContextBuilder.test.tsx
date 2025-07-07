import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContextBuilder } from '@/components/advanced/ContextBuilder';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { vi } from 'vitest';

// Mock drag and drop
vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children, onDragEnd }: any) => (
    <div data-testid="drag-context" onClick={() => onDragEnd({
      source: { droppableId: 'available', index: 0 },
      destination: { droppableId: 'selected', index: 0 },
      draggableId: 'component-1',
    })}>
      {children}
    </div>
  ),
  Droppable: ({ children, droppableId }: any) => (
    <div data-testid={`droppable-${droppableId}`}>
      {children({ innerRef: () => {}, droppableProps: {}, placeholder: null })}
    </div>
  ),
  Draggable: ({ children, draggableId, index }: any) => (
    <div data-testid={`draggable-${draggableId}`}>
      {children({ innerRef: () => {}, draggableProps: {}, dragHandleProps: {} }, {})}
    </div>
  ),
}));

// Mock API
vi.mock('@/lib/api/context', () => ({
  fetchAvailableComponents: vi.fn(),
  validateContext: vi.fn(),
  suggestComponents: vi.fn(),
  buildContext: vi.fn(),
}));

// Mock hooks
vi.mock('@/hooks/useLockStore', () => ({
  useLockStore: () => ({
    locks: {
      'component-1': { level: 'soft', reason: 'Test lock' },
      'component-3': { level: 'hard', reason: 'Critical component' },
    },
  }),
}));

const mockComponents = [
  {
    id: 'component-1',
    type: 'character',
    name: 'Main Protagonist',
    relevance: 95,
    locked: true,
    content: 'A brave hero on a quest',
  },
  {
    id: 'component-2',
    type: 'plot',
    name: 'Chapter 1 Plot',
    relevance: 85,
    locked: false,
    content: 'The journey begins',
  },
  {
    id: 'component-3',
    type: 'setting',
    name: 'Fantasy World',
    relevance: 90,
    locked: true,
    content: 'A magical realm',
  },
];

describe('ContextBuilder', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.mocked(fetchAvailableComponents).mockResolvedValue(mockComponents);
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ContextBuilder projectId="test-project" sceneId="test-scene" />
      </QueryClientProvider>
    );
  };

  it('renders available components', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Main Protagonist')).toBeInTheDocument();
      expect(screen.getByText('Chapter 1 Plot')).toBeInTheDocument();
      expect(screen.getByText('Fantasy World')).toBeInTheDocument();
    });
  });

  it('shows component relevance scores', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('95%')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('90%')).toBeInTheDocument();
    });
  });

  it('indicates locked components', async () => {
    renderComponent();

    await waitFor(() => {
      const component1 = screen.getByTestId('component-component-1');
      const component3 = screen.getByTestId('component-component-3');
      
      expect(component1.querySelector('[data-testid="lock-indicator"]')).toBeInTheDocument();
      expect(component3.querySelector('[data-testid="lock-indicator"]')).toBeInTheDocument();
    });
  });

  it('filters components by type', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Main Protagonist')).toBeInTheDocument();
    });

    // Select character filter
    const characterFilter = screen.getByLabelText('Characters');
    await user.click(characterFilter);

    // Should only show character components
    expect(screen.getByText('Main Protagonist')).toBeInTheDocument();
    expect(screen.queryByText('Chapter 1 Plot')).not.toBeInTheDocument();
    expect(screen.queryByText('Fantasy World')).not.toBeInTheDocument();
  });

  it('allows searching components', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Main Protagonist')).toBeInTheDocument();
    });

    // Search for "hero"
    const searchInput = screen.getByPlaceholderText('Search components...');
    await user.type(searchInput, 'hero');

    // Should only show matching component
    expect(screen.getByText('Main Protagonist')).toBeInTheDocument();
    expect(screen.queryByText('Chapter 1 Plot')).not.toBeInTheDocument();
  });

  it('handles drag and drop to build context', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Main Protagonist')).toBeInTheDocument();
    });

    // Simulate drag and drop
    const dragContext = screen.getByTestId('drag-context');
    fireEvent.click(dragContext);

    // Component should move to selected area
    await waitFor(() => {
      const selectedArea = screen.getByTestId('droppable-selected');
      expect(selectedArea).toHaveTextContent('Main Protagonist');
    });
  });

  it('validates context with locked components', async () => {
    const mockValidate = vi.fn().mockResolvedValue({
      isValid: false,
      issues: ['Missing required plot component'],
    });
    vi.mocked(validateContext).mockImplementation(mockValidate);

    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Validate Context')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Validate Context'));

    await waitFor(() => {
      expect(mockValidate).toHaveBeenCalled();
      expect(screen.getByText('Missing required plot component')).toBeInTheDocument();
    });
  });

  it('shows AI suggestions', async () => {
    const mockSuggestions = [
      { componentId: 'component-2', reason: 'Essential for scene continuity' },
    ];
    vi.mocked(suggestComponents).mockResolvedValue(mockSuggestions);

    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Get AI Suggestions')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Get AI Suggestions'));

    await waitFor(() => {
      expect(screen.getByText('Essential for scene continuity')).toBeInTheDocument();
    });
  });

  it('displays context preview', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Main Protagonist')).toBeInTheDocument();
    });

    // Add component to context
    fireEvent.click(screen.getByTestId('drag-context'));

    // Preview should update
    await waitFor(() => {
      const preview = screen.getByTestId('context-preview');
      expect(preview).toHaveTextContent('A brave hero on a quest');
    });
  });

  it('calculates and displays total relevance', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Main Protagonist')).toBeInTheDocument();
    });

    // Add components
    fireEvent.click(screen.getByTestId('drag-context'));

    await waitFor(() => {
      expect(screen.getByText('Average Relevance: 95%')).toBeInTheDocument();
    });
  });

  it('prevents removing locked components from context', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Main Protagonist')).toBeInTheDocument();
    });

    // Add locked component
    fireEvent.click(screen.getByTestId('drag-context'));

    // Try to remove
    const removeButton = screen.getByTestId('remove-component-1');
    expect(removeButton).toBeDisabled();
    expect(removeButton).toHaveAttribute('title', 'Cannot remove locked component');
  });

  it('builds final context', async () => {
    const mockBuild = vi.fn().mockResolvedValue({
      context: 'Built context content',
      tokenCount: 1500,
    });
    vi.mocked(buildContext).mockImplementation(mockBuild);

    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Build Context')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Build Context'));

    await waitFor(() => {
      expect(mockBuild).toHaveBeenCalled();
      expect(screen.getByText('Context built successfully')).toBeInTheDocument();
      expect(screen.getByText('1500 tokens')).toBeInTheDocument();
    });
  });

  it('handles errors gracefully', async () => {
    vi.mocked(fetchAvailableComponents).mockRejectedValueOnce(
      new Error('Failed to load components')
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Failed to load components')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    renderComponent();

    expect(screen.getByText('Loading components...')).toBeInTheDocument();
  });

  it('displays empty state when no components available', async () => {
    vi.mocked(fetchAvailableComponents).mockResolvedValueOnce([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No components available')).toBeInTheDocument();
      expect(screen.getByText('Create some content first')).toBeInTheDocument();
    });
  });
});
