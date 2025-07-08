import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoundationCheckpoint } from '@/components/advanced/FoundationCheckpoint';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Using Jest mocks

// Mock the API calls
const mockFetchFoundationStatus = jest.fn();
const mockLockComponents = jest.fn();
const mockValidateFoundation = jest.fn();

jest.mock('@/lib/api/foundation', () => ({
  fetchFoundationStatus: mockFetchFoundationStatus,
  lockComponents: mockLockComponents,
  validateFoundation: mockValidateFoundation,
}));

// Mock the store
jest.mock('@/hooks/useFoundationStatus', () => ({
  useFoundationStatus: () => ({
    status: mockFoundationStatus,
    isLoading: false,
    refetch: jest.fn(),
  }),
}));

const mockFoundationStatus = {
  components: [
    {
      id: 'concept',
      name: 'Concept',
      status: 'ready',
      completeness: 100,
      issues: [],
      locked: false,
    },
    {
      id: 'plot',
      name: 'Plot',
      status: 'incomplete',
      completeness: 75,
      issues: ['Missing climax scene'],
      locked: false,
    },
    {
      id: 'characters',
      name: 'Characters',
      status: 'ready',
      completeness: 100,
      issues: [],
      locked: true,
    },
  ],
  overallReadiness: 85,
  recommendations: [
    'Complete plot structure before proceeding',
    'Consider locking concept to prevent changes',
  ],
};

describe('FoundationCheckpoint', () => {
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
        <FoundationCheckpoint 
          projectId="test-project"
          onCheckpointCreate={() => {}}
          onComponentLock={() => {}}
        />
      </QueryClientProvider>
    );
  };

  it('renders foundation status correctly', () => {
    renderComponent();

    // Check overall readiness
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Foundation Readiness')).toBeInTheDocument();

    // Check components
    expect(screen.getByText('Concept')).toBeInTheDocument();
    expect(screen.getByText('Plot')).toBeInTheDocument();
    expect(screen.getByText('Characters')).toBeInTheDocument();
  });

  it('displays component status indicators', () => {
    renderComponent();

    // Ready components should have check icon
    const conceptCard = screen.getByTestId('component-concept');
    expect(conceptCard).toHaveClass('border-green-500');

    // Incomplete components should have warning
    const plotCard = screen.getByTestId('component-plot');
    expect(plotCard).toHaveClass('border-yellow-500');

    // Locked components should show lock icon
    const charactersCard = screen.getByTestId('component-characters');
    expect(charactersCard.querySelector('[data-testid="lock-icon"]')).toBeInTheDocument();
  });

  it('shows issues for incomplete components', () => {
    renderComponent();

    expect(screen.getByText('Missing climax scene')).toBeInTheDocument();
  });

  it('displays AI recommendations', () => {
    renderComponent();

    expect(screen.getByText('Complete plot structure before proceeding')).toBeInTheDocument();
    expect(screen.getByText('Consider locking concept to prevent changes')).toBeInTheDocument();
  });

  it('allows bulk selection of components', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Select concept component
    const conceptCheckbox = screen.getByTestId('select-concept');
    await user.click(conceptCheckbox);

    // Verify selection
    expect(conceptCheckbox).toBeChecked();
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  it('enables bulk lock operation when components selected', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Select a component
    await user.click(screen.getByTestId('select-concept'));

    // Lock button should be enabled
    const lockButton = screen.getByText('Lock Selected');
    expect(lockButton).not.toBeDisabled();
  });

  it('disables selection for already locked components', () => {
    renderComponent();

    const charactersCheckbox = screen.getByTestId('select-characters');
    expect(charactersCheckbox).toBeDisabled();
  });

  it('handles lock operation', async () => {
    const mockLockComponentsFunc = jest.fn().mockResolvedValue({ success: true });
    mockLockComponents.mockImplementation(mockLockComponentsFunc);

    const user = userEvent.setup();
    renderComponent();

    // Select and lock
    await user.click(screen.getByTestId('select-concept'));
    await user.click(screen.getByText('Lock Selected'));

    await waitFor(() => {
      expect(mockLockComponents).toHaveBeenCalledWith(
        'test-project',
        ['concept']
      );
    });
  });

  it('shows validation workflow', async () => {
    const user = userEvent.setup();
    renderComponent();

    const validateButton = screen.getByText('Validate Foundation');
    await user.click(validateButton);

    // Should show validation progress
    await waitFor(() => {
      expect(screen.getByText('Validating...')).toBeInTheDocument();
    });
  });

  it('filters components by status', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Click filter for incomplete
    const incompleteFilter = screen.getByText('Incomplete');
    await user.click(incompleteFilter);

    // Should only show plot
    expect(screen.getByText('Plot')).toBeInTheDocument();
    expect(screen.queryByText('Concept')).not.toBeInTheDocument();
  });

  it('shows progress bars with correct values', () => {
    renderComponent();

    const conceptProgress = screen.getByTestId('progress-concept');
    expect(conceptProgress).toHaveAttribute('aria-valuenow', '100');

    const plotProgress = screen.getByTestId('progress-plot');
    expect(plotProgress).toHaveAttribute('aria-valuenow', '75');
  });

  it('handles error states gracefully', async () => {
    // TODO: Mock an error when proper hook mocking is setup
    // jest.mocked(useFoundationStatus).mockReturnValueOnce({
    //   status: null,
    //   isLoading: false,
    //   error: new Error('Failed to load foundation status'),
    //   refetch: jest.fn(),
    // });

    renderComponent();

    expect(screen.getByText('Failed to load foundation status')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('refreshes data on retry', async () => {
    const mockRefetch = jest.fn();
    // TODO: Mock hook when proper setup is complete
    // jest.mocked(useFoundationStatus).mockReturnValueOnce({
    //   status: null,
    //   isLoading: false,
    //   error: new Error('Failed to load'),
    //   refetch: mockRefetch,
    // });

    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });
});
