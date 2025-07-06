import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoreProvider } from '../../src/components/providers/StoreProvider';
import { ModeSetCard } from '../../src/components/mode-sets/ModeSetCard';
import { Layout } from '../../src/components/layout/Layout';
import { useStore } from '../../src/lib/store/createStore';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
(globalThis as { localStorage: typeof localStorageMock }).localStorage = localStorageMock;

// Test wrapper with store provider
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>;
}

async function switchToModeSet(modeSet: string) {
  const user = userEvent.setup();
  // This would click the mode selector and select the mode
  // Implementation depends on how mode selection is implemented in the UI
  useStore.getState().setModeSet(modeSet as any);
}

describe('Mode-Set Switching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state
    useStore.setState({
      modeSet: 'professional-writer',
      user: null,
      currentProject: null,
      sidebarCollapsed: false,
      rightPanelCollapsed: false,
      bottomPanelCollapsed: false,
      panelSizes: {}
    }, true);
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
      expect(useStore.getState().bottomPanelCollapsed).toBe(true); // AI-First hides bottom panel
    });
  });

  it('persists mode-set preference', async () => {
    render(
      <TestWrapper>
        <ModeSetCard
          modeSet="ai-first"
          title="AI-First"
          description="AI-powered writing"
          features={['Auto-generation', 'Smart suggestions']}
          onSelect={() => useStore.getState().setModeSet('ai-first')}
        />
      </TestWrapper>
    );

    // Switch to AI-First
    await switchToModeSet('ai-first');

    // Verify persistence would be called
    expect(localStorageMock.setItem).toHaveBeenCalled();

    // Verify store state
    expect(useStore.getState().modeSet).toBe('ai-first');
  });

  it('applies correct panel configuration for each mode', async () => {
    const modes = [
      { id: 'professional-writer', leftVisible: true, rightVisible: true, bottomVisible: true },
      { id: 'ai-first', leftVisible: true, rightVisible: true, bottomVisible: false },
      { id: 'editor', leftVisible: true, rightVisible: true, bottomVisible: true },
      { id: 'hobbyist', leftVisible: true, rightVisible: false, bottomVisible: false }
    ];

    for (const mode of modes) {
      await switchToModeSet(mode.id);

      const state = useStore.getState();
      expect(state.modeSet).toBe(mode.id);
      expect(state.sidebarCollapsed).toBe(!mode.leftVisible);
      expect(state.rightPanelCollapsed).toBe(!mode.rightVisible);
      expect(state.bottomPanelCollapsed).toBe(!mode.bottomVisible);
    }
  });

  it('applies mode-specific feature availability', async () => {
    // Test Professional Writer mode features
    await switchToModeSet('professional-writer');
    let state = useStore.getState();
    expect(state.isFeatureEnabled('manualSave')).toBe(true);
    expect(state.isFeatureEnabled('gitOperations')).toBe(true);
    expect(state.isFeatureEnabled('autoSave')).toBe(false);

    // Test AI-First mode features
    await switchToModeSet('ai-first');
    state = useStore.getState();
    expect(state.isFeatureEnabled('autoSave')).toBe(true);
    expect(state.isFeatureEnabled('preGeneration')).toBe(true);
    expect(state.isFeatureEnabled('manualSave')).toBe(false);

    // Test Editor mode features
    await switchToModeSet('editor');
    state = useStore.getState();
    expect(state.isFeatureEnabled('readOnly')).toBe(true);
    expect(state.isFeatureEnabled('annotations')).toBe(true);
    expect(state.isFeatureEnabled('commenting')).toBe(true);

    // Test Hobbyist mode features
    await switchToModeSet('hobbyist');
    state = useStore.getState();
    expect(state.isFeatureEnabled('autoSave')).toBe(true);
    expect(state.isFeatureEnabled('templates')).toBe(true);
    expect(state.isFeatureEnabled('achievements')).toBe(true);
  });

  it('maintains proper editor settings per mode', async () => {
    // Professional Writer mode
    await switchToModeSet('professional-writer');
    let config = useStore.getState().getCurrentModeConfig();
    expect(config.editor.showLineNumbers).toBe(true);
    expect(config.editor.showMinimap).toBe(true);

    // AI-First mode
    await switchToModeSet('ai-first');
    config = useStore.getState().getCurrentModeConfig();
    expect(config.editor.showLineNumbers).toBe(false);
    expect(config.editor.showMinimap).toBe(false);

    // Editor mode
    await switchToModeSet('editor');
    config = useStore.getState().getCurrentModeConfig();
    expect(config.editor.readOnly).toBe(true);
    expect(config.editor.showLineNumbers).toBe(true);

    // Hobbyist mode
    await switchToModeSet('hobbyist');
    config = useStore.getState().getCurrentModeConfig();
    expect(config.editor.simplifiedToolbar).toBe(true);
    expect(config.editor.showLineNumbers).toBe(false);
  });
});