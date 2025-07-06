import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoreProvider } from '../../src/components/providers/StoreProvider';
import { App } from '../../src/components/App';
import { useStore } from '../../src/lib/store/createStore';
import { sseManager } from '../../src/lib/sse/SSEConnectionManager';

// Mock SSE manager
jest.mock('../../src/lib/sse/SSEConnectionManager');
const mockSSEManager = sseManager as jest.Mocked<typeof sseManager>;

// Mock API calls
const mockAPI = {
  generateScene: jest.fn(),
  checkContinuity: jest.fn(),
  applyContinuityFix: jest.fn(),
  saveProject: jest.fn(),
  loadProject: jest.fn()
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock project data
const mockProject = {
  id: 'test-project',
  name: 'My Novel',
  chapters: [
    {
      id: 'chapter-1',
      name: 'Chapter 1',
      scenes: [
        {
          id: 'scene-1',
          name: 'Scene 1',
          content: 'Elena stepped into the room, her red coat dripping with rain.',
          type: 'scene',
          status: 'completed'
        },
        {
          id: 'scene-2',
          name: 'Scene 2 (placeholder)',
          content: '',
          type: 'scene',
          status: 'placeholder'
        }
      ]
    }
  ]
};

// Mock scene generation progress
const mockSceneProgress = {
  jobId: 'generate-scene-job-1',
  agentName: 'Scene Generator',
  percentage: 0,
  currentStep: 'Initializing...',
  status: 'running' as const
};

describe('Complete Writing Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset store state
    useStore.setState({
      user: { id: 'test-user', name: 'Test User' },
      currentProject: mockProject,
      modeSet: 'professional-writer',
      files: [],
      locks: {},
      agentQueue: [],
      continuityIssues: []
    }, true);
    
    // Mock API responses
    mockAPI.generateScene.mockResolvedValue({
      content: 'Elena stepped into the jazz club, the music washing over her like a warm embrace.',
      metadata: { wordCount: 150, timeToGenerate: 5000 }
    });
    
    mockAPI.checkContinuity.mockResolvedValue([]);
    mockAPI.saveProject.mockResolvedValue({ success: true });
    mockAPI.loadProject.mockResolvedValue(mockProject);
  });

  it('completes a scene generation workflow', async () => {
    const user = userEvent.setup();
    
    // Mock SSE connection for scene generation
    let onMessage: ((data: any) => void) | undefined;
    mockSSEManager.connect.mockImplementation((jobId, options) => {
      onMessage = options?.onMessage;
      return {} as EventSource;
    });
    
    render(
      <StoreProvider>
        <App />
      </StoreProvider>
    );
    
    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByText('My Novel')).toBeInTheDocument();
    });
    
    // Navigate to project
    await user.click(screen.getByText('My Novel'));
    
    // Should show project structure
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    
    // Expand chapter
    await user.click(screen.getByText('Chapter 1'));
    
    // Should show scenes
    expect(screen.getByText('Scene 1')).toBeInTheDocument();
    expect(screen.getByText('Scene 2 (placeholder)')).toBeInTheDocument();
    
    // Click on placeholder scene
    await user.click(screen.getByText('Scene 2 (placeholder)'));
    
    // Should show generate scene option
    expect(screen.getByText('Generate Scene')).toBeInTheDocument();
    
    // Click generate scene
    await user.click(screen.getByText('Generate Scene'));
    
    // Should show agent progress
    await waitFor(() => {
      expect(screen.getByText('Scene Generator')).toBeInTheDocument();
    });
    
    // Simulate progress updates
    const progressUpdates = [
      { ...mockSceneProgress, percentage: 25, currentStep: 'Analyzing context...' },
      { ...mockSceneProgress, percentage: 50, currentStep: 'Generating content...' },
      { ...mockSceneProgress, percentage: 75, currentStep: 'Refining output...' },
      { ...mockSceneProgress, percentage: 100, currentStep: 'Complete', status: 'completed' as const }
    ];
    
    for (const update of progressUpdates) {
      onMessage?.(update);
      await waitFor(() => {
        expect(screen.getByText(update.currentStep)).toBeInTheDocument();
      });
    }
    
    // Should show completion message
    await waitFor(() => {
      expect(screen.getByText('Scene generated successfully')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    // Should show generated content
    expect(screen.getByText(/Elena stepped into the jazz club/)).toBeInTheDocument();
    
    // Verify scene was added to project
    const state = useStore.getState();
    expect(state.currentProject?.chapters[0].scenes[1].content).toContain('jazz club');
  });

  it('handles continuity issues correctly', async () => {
    const user = userEvent.setup();
    
    // Mock continuity issue
    const continuityIssue = {
      id: 'continuity-1',
      type: 'inconsistency',
      description: 'Character clothing inconsistency',
      severity: 'medium',
      location: { chapter: 'chapter-1', scene: 'scene-1' },
      suggestions: [
        { id: 'fix-1', description: 'Change all to red coat', preview: 'Elena stepped into the room, her red coat...' },
        { id: 'fix-2', description: 'Change all to blue coat', preview: 'Elena stepped into the room, her blue coat...' }
      ]
    };
    
    mockAPI.checkContinuity.mockResolvedValue([continuityIssue]);
    
    render(
      <StoreProvider>
        <App />
      </StoreProvider>
    );
    
    // Navigate to scene
    await user.click(screen.getByText('My Novel'));
    await user.click(screen.getByText('Chapter 1'));
    await user.click(screen.getByText('Scene 1'));
    
    // Edit scene to create continuity issue
    const editor = screen.getByRole('textbox');
    await user.click(editor);
    await user.clear(editor);
    await user.type(editor, 'Elena wore a blue coat when she entered the room.');
    
    // Wait for continuity check (debounced)
    await waitFor(() => {
      expect(screen.getByText('Continuity Issue Detected')).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Should show issue details
    expect(screen.getByText('Character clothing inconsistency')).toBeInTheDocument();
    expect(screen.getByText('Medium severity')).toBeInTheDocument();
    
    // Should show fix options
    expect(screen.getByText('Change all to red coat')).toBeInTheDocument();
    expect(screen.getByText('Change all to blue coat')).toBeInTheDocument();
    
    // Click on first fix
    await user.click(screen.getByText('Change all to red coat'));
    
    // Should show fix preview
    expect(screen.getByText(/Elena stepped into the room, her red coat/)).toBeInTheDocument();
    
    // Apply fix
    await user.click(screen.getByText('Apply Fix'));
    
    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Continuity fix applied successfully')).toBeInTheDocument();
    });
    
    // Should update content
    expect(screen.getByText(/red coat/)).toBeInTheDocument();
    expect(screen.queryByText(/blue coat/)).not.toBeInTheDocument();
  });

  it('handles AI-First mode pre-generation workflow', async () => {
    const user = userEvent.setup();
    
    // Set to AI-First mode
    useStore.setState({ modeSet: 'ai-first' });
    
    render(
      <StoreProvider>
        <App />
      </StoreProvider>
    );
    
    // Should show AI-First specific UI
    expect(screen.getByText('Pre-generated Scenes')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    
    // Navigate to project
    await user.click(screen.getByText('My Novel'));
    
    // Should show pre-generated scenes panel
    expect(screen.getByText('Upcoming Scenes')).toBeInTheDocument();
    
    // Mock pre-generated scenes
    const preGeneratedScenes = [
      {
        id: 'pre-scene-1',
        content: 'Elena discovers a hidden letter in the jazz club.',
        quality: 0.85,
        keywords: ['letter', 'discovery', 'jazz club']
      },
      {
        id: 'pre-scene-2',
        content: 'The mysterious stranger approaches Elena.',
        quality: 0.92,
        keywords: ['stranger', 'approach', 'mystery']
      }
    ];
    
    // Add pre-generated scenes to store
    useStore.setState({ 
      preGeneratedScenes 
    });
    
    // Should show pre-generated options
    expect(screen.getByText('Elena discovers a hidden letter')).toBeInTheDocument();
    expect(screen.getByText('The mysterious stranger approaches')).toBeInTheDocument();
    
    // Should show quality scores
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    
    // Use first pre-generated scene
    await user.click(screen.getByText('Use This Scene'));
    
    // Should add scene to project
    await waitFor(() => {
      expect(screen.getByText('Scene added to project')).toBeInTheDocument();
    });
    
    // Should show scene in editor
    expect(screen.getByText(/Elena discovers a hidden letter/)).toBeInTheDocument();
  });

  it('handles lock workflow during collaborative editing', async () => {
    const user = userEvent.setup();
    
    // Mock collaborative context
    useStore.setState({
      user: { id: 'user-1', name: 'User One' },
      collaborators: [
        { id: 'user-2', name: 'User Two', isActive: true }
      ]
    });
    
    render(
      <StoreProvider>
        <App />
      </StoreProvider>
    );
    
    // Navigate to scene
    await user.click(screen.getByText('My Novel'));
    await user.click(screen.getByText('Chapter 1'));
    await user.click(screen.getByText('Scene 1'));
    
    // Should show collaboration indicator
    expect(screen.getByText('User Two is online')).toBeInTheDocument();
    
    // Open lock menu
    await user.click(screen.getByLabelText('Lock menu'));
    
    // Should show lock options
    expect(screen.getByText('Soft Lock')).toBeInTheDocument();
    expect(screen.getByText('Hard Lock')).toBeInTheDocument();
    expect(screen.getByText('Freeze')).toBeInTheDocument();
    
    // Apply soft lock
    await user.click(screen.getByText('Soft Lock'));
    
    // Should show lock reason dialog
    expect(screen.getByText('Lock Reason')).toBeInTheDocument();
    
    // Enter reason
    await user.type(screen.getByPlaceholderText('Why are you locking this content?'), 'Working on character development');
    
    // Confirm lock
    await user.click(screen.getByText('Apply Lock'));
    
    // Should show lock indicator
    await waitFor(() => {
      expect(screen.getByText('🔒 Soft Lock')).toBeInTheDocument();
    });
    
    // Should show lock reason
    expect(screen.getByText('Working on character development')).toBeInTheDocument();
    
    // Simulate another user trying to edit
    const otherUserEdit = {
      userId: 'user-2',
      action: 'edit',
      fileId: 'scene-1',
      content: 'Different content'
    };
    
    // Should show conflict notification
    useStore.setState({
      lockConflicts: [otherUserEdit]
    });
    
    await waitFor(() => {
      expect(screen.getByText('Lock conflict detected')).toBeInTheDocument();
    });
    
    // Should show conflict resolution options
    expect(screen.getByText('User Two is trying to edit locked content')).toBeInTheDocument();
    expect(screen.getByText('Allow Edit')).toBeInTheDocument();
    expect(screen.getByText('Deny Edit')).toBeInTheDocument();
  });

  it('handles error recovery during scene generation', async () => {
    const user = userEvent.setup();
    
    // Mock SSE connection with error
    let onError: ((error: Event) => void) | undefined;
    mockSSEManager.connect.mockImplementation((jobId, options) => {
      onError = options?.onError;
      return {} as EventSource;
    });
    
    render(
      <StoreProvider>
        <App />
      </StoreProvider>
    );
    
    // Navigate to placeholder scene
    await user.click(screen.getByText('My Novel'));
    await user.click(screen.getByText('Chapter 1'));
    await user.click(screen.getByText('Scene 2 (placeholder)'));
    
    // Start scene generation
    await user.click(screen.getByText('Generate Scene'));
    
    // Should show progress
    await waitFor(() => {
      expect(screen.getByText('Scene Generator')).toBeInTheDocument();
    });
    
    // Simulate connection error
    onError?.(new Event('error'));
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Connection error occurred')).toBeInTheDocument();
    });
    
    // Should show retry option
    expect(screen.getByText('Retry Generation')).toBeInTheDocument();
    
    // Click retry
    await user.click(screen.getByText('Retry Generation'));
    
    // Should restart generation
    await waitFor(() => {
      expect(screen.getByText('Retrying scene generation...')).toBeInTheDocument();
    });
    
    // Should call SSE manager again
    expect(mockSSEManager.connect).toHaveBeenCalledTimes(2);
  });

  it('maintains state across mode-set switches during workflow', async () => {
    const user = userEvent.setup();
    
    render(
      <StoreProvider>
        <App />
      </StoreProvider>
    );
    
    // Start in professional writer mode
    expect(useStore.getState().modeSet).toBe('professional-writer');
    
    // Navigate to scene and start editing
    await user.click(screen.getByText('My Novel'));
    await user.click(screen.getByText('Chapter 1'));
    await user.click(screen.getByText('Scene 1'));
    
    const editor = screen.getByRole('textbox');
    await user.click(editor);
    await user.type(editor, 'Additional content for the scene.');
    
    // Should show git panel in professional mode
    expect(screen.getByText('Git Status')).toBeInTheDocument();
    
    // Switch to AI-First mode
    await user.click(screen.getByTestId('mode-selector'));
    await user.click(screen.getByText('AI-First'));
    
    // Should hide git panel
    await waitFor(() => {
      expect(screen.queryByText('Git Status')).not.toBeInTheDocument();
    });
    
    // Should show AI assistant
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    
    // Content should be preserved
    expect(screen.getByText(/Additional content for the scene/)).toBeInTheDocument();
    
    // Switch back to professional mode
    await user.click(screen.getByTestId('mode-selector'));
    await user.click(screen.getByText('Professional Writer'));
    
    // Should restore git panel
    await waitFor(() => {
      expect(screen.getByText('Git Status')).toBeInTheDocument();
    });
    
    // Content should still be preserved
    expect(screen.getByText(/Additional content for the scene/)).toBeInTheDocument();
  });
});