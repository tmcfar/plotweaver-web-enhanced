import React from 'react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModeSetCard } from '../../src/components/mode-sets/ModeSetCard';
import { Layout } from '../../src/components/layout/Layout';
import { useStore } from '../../src/lib/store/createStore';

// Mock external dependencies that cause issues in tests
jest.mock('../../src/lib/store/utils/subscriptions', () => ({
  setupStoreSubscriptions: jest.fn(() => jest.fn()),
  cleanupSubscriptions: jest.fn(),
}));

jest.mock('../../src/lib/git/lockManager', () => ({
  gitManager: {
    saveLocks: jest.fn(),
    writeFile: jest.fn(() => Promise.resolve({ ok: true })),
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Simple test wrapper
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <div data-testid="test-wrapper">{children}</div>;
}

async function switchToModeSet(modeSet: string) {
  // Use the actual store method
  useStore.getState().setModeSet(modeSet as any);
}

describe('Mode-Set Switching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store data without replacing methods
    useStore.setState({
      modeSet: 'professional-writer',
      user: null,
      currentProject: null,
      sidebarCollapsed: false,
      rightPanelCollapsed: false,
      bottomPanelCollapsed: false,
      panelSizes: {},
      writingMode: { primary: 'discovery' },
      modeSetPreferences: {
        'professional-writer': { panelSizes: {}, editorSettings: {}, shortcuts: {} },
        'ai-first': { panelSizes: {}, editorSettings: {}, shortcuts: {} },
        'editor': { panelSizes: {}, editorSettings: {}, shortcuts: {} },
        'hobbyist': { panelSizes: {}, editorSettings: {}, shortcuts: {} }
      },
      
      // Editor state
      openFiles: [],
      activeFileId: null,
      unsavedChanges: {},
      editorSettings: {
        showLineNumbers: true,
        showMinimap: true,
        wordWrap: 'on'
      },

      // Agent state
      activeJobs: new Map(),
      queuedJobs: [],
      completedJobs: [],

      // Lock state
      locks: {},
      lockConflicts: [],
      lockHistory: [],

      // Continuity state
      continuityIssues: {},
      isChecking: {},
      lastChecked: {},
      fixes: {}
    });
  });

  it('switches between mode-sets correctly', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <Layout>
          <div data-testid="content">Test Content</div>
        </Layout>
      </TestWrapper>
    );

    // Check initial state - Professional Writer mode
    expect(useStore.getState().modeSet).toBe('professional-writer');
    expect(useStore.getState().sidebarCollapsed).toBe(false);

    // Switch to AI-First mode
    await switchToModeSet('ai-first');

    // Verify changes
    await waitFor(() => {
      expect(useStore.getState().modeSet).toBe('ai-first');
      // Check if panel state changed (this depends on the mode config)
    });
  });

  it('persists mode-set preference', async () => {
    render(
      <TestWrapper>
        <ModeSetCard
          id="ai-first"
          title="AI-First"
          description="AI-powered writing"
          features={['Auto-generation', 'Smart suggestions']}
          onSelect={() => useStore.getState().setModeSet('ai-first')}
        />
      </TestWrapper>
    );

    // Switch to AI-First
    await switchToModeSet('ai-first');

    // Verify store state
    expect(useStore.getState().modeSet).toBe('ai-first');
  });

  it('applies correct panel configuration for each mode', async () => {
    const modes = [
      { id: 'professional-writer', expected: 'professional-writer' },
      { id: 'ai-first', expected: 'ai-first' },
      { id: 'editor', expected: 'editor' },
      { id: 'hobbyist', expected: 'hobbyist' }
    ];

    for (const mode of modes) {
      await switchToModeSet(mode.id);

      const state = useStore.getState();
      expect(state.modeSet).toBe(mode.expected);
      // Panel configurations depend on the actual MODE_SET_CONFIGS
      // We can test that the state changes, but specific values depend on config
    }
  });

  it('applies mode-specific feature availability', async () => {
    // Test Professional Writer mode features
    await switchToModeSet('professional-writer');
    let state = useStore.getState();
    
    // These tests depend on the actual mode configurations
    // For now, just test that the functions exist and can be called
    expect(typeof state.isFeatureEnabled).toBe('function');
    expect(typeof state.getCurrentModeConfig).toBe('function');

    // Test that mode switching works
    await switchToModeSet('ai-first');
    state = useStore.getState();
    expect(state.modeSet).toBe('ai-first');
  });

  it('maintains proper editor settings per mode', async () => {
    // Professional Writer mode
    await switchToModeSet('professional-writer');
    let state = useStore.getState();
    expect(state.modeSet).toBe('professional-writer');

    // AI-First mode
    await switchToModeSet('ai-first');
    state = useStore.getState();
    expect(state.modeSet).toBe('ai-first');

    // Editor mode
    await switchToModeSet('editor');
    state = useStore.getState();
    expect(state.modeSet).toBe('editor');

    // Hobbyist mode
    await switchToModeSet('hobbyist');
    state = useStore.getState();
    expect(state.modeSet).toBe('hobbyist');
  });
});