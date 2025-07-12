import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContextBuilder } from '@/components/advanced/ContextBuilder';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
// Using Jest mocks

// Mock drag and drop
jest.mock('@hello-pangea/dnd', () => ({
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
      {children({ innerRef: () => { }, droppableProps: {}, placeholder: null })}
    </div>
  ),
  Draggable: ({ children, draggableId, index }: any) => (
    <div data-testid={`draggable-${draggableId}`}>
      {children({ innerRef: () => { }, draggableProps: {}, dragHandleProps: {} }, {})}
    </div>
  ),
}));

// Mock API
const mockFetchAvailableComponents = jest.fn();
const mockValidateContext = jest.fn();
const mockSuggestComponents = jest.fn();
const mockBuildContext = jest.fn();

jest.mock('@/lib/api/context', () => ({
  fetchAvailableComponents: mockFetchAvailableComponents,
  validateContext: mockValidateContext,
  suggestComponents: mockSuggestComponents,
  buildContext: mockBuildContext,
}));

// Mock hooks
jest.mock('@/hooks/useLockStore', () => ({
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
    type: 'character' as const,
    name: 'Main Protagonist',
    description: 'A brave hero on a quest',
    relevance: 95,
    locked: true,
    content: 'A brave hero on a quest',
    tags: ['protagonist', 'hero'],
  },
  {
    id: 'component-2',
    type: 'plot' as const,
    name: 'Chapter 1 Plot',
    description: 'The journey begins',
    relevance: 85,
    locked: false,
    content: 'The journey begins',
    tags: ['plot', 'journey'],
  },
  {
    id: 'component-3',
    type: 'setting' as const,
    name: 'Fantasy World',
    description: 'A magical realm',
    relevance: 90,
    locked: true,
    content: 'A magical realm',
    tags: ['setting', 'fantasy'],
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

    mockFetchAvailableComponents.mockResolvedValue(mockComponents);
    mockValidateContext.mockReset();
    mockSuggestComponents.mockReset();
    mockBuildContext.mockReset();
  });

  const renderComponent = (availableComponents = mockComponents) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ContextBuilder
          sceneId="test-scene"
          availableComponents={availableComponents}
          currentContext={[]}
          onContextUpdate={() => { }}
          onLockValidation={async () => ({ valid: true, issues: [], suggestions: [], estimatedTokens: 0 })}
        />
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
    const mockValidate = jest.fn().mockResolvedValue({
      isValid: false,
      issues: ['Missing required plot component'],
    });
    mockValidateContext.mockImplementation(mockValidate);

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
    mockSuggestComponents.mockResolvedValue(mockSuggestions);

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
    const mockBuild = jest.fn().mockResolvedValue({
      context: 'Built context content',
      tokenCount: 1500,
    });
    mockBuildContext.mockImplementation(mockBuild);

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
    mockFetchAvailableComponents.mockRejectedValueOnce(
      new Error('Failed to load components')
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Failed to load components')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('renders component interface', () => {
    renderComponent();

    expect(screen.getByText('Available Components')).toBeInTheDocument();
    expect(screen.getByText('Scene Context')).toBeInTheDocument();
  });

  it('displays empty state when no components in context', async () => {
    renderComponent([]);

    await waitFor(() => {
      expect(screen.getByText('No components in context')).toBeInTheDocument();
      expect(screen.getByText('Add components from the browser to build scene context')).toBeInTheDocument();
    });
  });
});
