import { StateCreator, User, Project, WritingMode, Preferences } from '../../../types/store';
import { ModeSetId, MODE_SET_CONFIGS } from '../../../config/modeSetConfigs';

export interface GlobalSlice {
  // User & Mode State
  user: User | null;
  modeSet: ModeSetId;
  modeSetPreferences: Record<ModeSetId, Preferences>;

  // Project State
  currentProject: Project | null;
  writingMode: WritingMode;

  // UI State
  sidebarCollapsed: boolean;
  rightPanelCollapsed: boolean;
  bottomPanelCollapsed: boolean;
  panelSizes: Record<string, number>;

  // Actions
  setUser: (user: User | null) => void;
  setModeSet: (modeSet: ModeSetId) => void;
  setModeSetPreferences: (modeSet: ModeSetId, preferences: Preferences) => void;
  setCurrentProject: (project: Project | null) => void;
  setWritingMode: (mode: WritingMode) => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  toggleBottomPanel: () => void;
  setPanelSize: (panel: string, size: number) => void;

  // Selectors
  getCurrentModeConfig: () => typeof MODE_SET_CONFIGS[ModeSetId];
  isFeatureEnabled: (feature: string) => boolean;
  isProfessionalMode: () => boolean;
  isAIFirstMode: () => boolean;
}

export const createGlobalSlice: StateCreator<GlobalSlice> = (set, get) => ({
  // Initial state
  user: null,
  modeSet: 'professional-writer',
  modeSetPreferences: {
    'professional-writer': {
      panelSizes: {},
      editorSettings: {},
      shortcuts: {}
    },
    'ai-first': {
      panelSizes: {},
      editorSettings: {},
      shortcuts: {}
    },
    'editor': {
      panelSizes: {},
      editorSettings: {},
      shortcuts: {}
    },
    'hobbyist': {
      panelSizes: {},
      editorSettings: {},
      shortcuts: {}
    }
  },
  currentProject: null,
  writingMode: { primary: 'discovery' },
  sidebarCollapsed: false,
  rightPanelCollapsed: false,
  bottomPanelCollapsed: false,
  panelSizes: {},

  // Actions
  setUser: (user) => set(() => ({ user })),

  setModeSet: (modeSet) => {
    const config = MODE_SET_CONFIGS[modeSet];

    set((state) => ({
      modeSet,
      // Apply default panel sizes from config
      panelSizes: {
        ...state.panelSizes,
        left: config.panels.left.defaultWidth || 250,
        right: config.panels.right.defaultWidth || 300,
        bottom: config.panels.bottom.defaultHeight || 200
      },
      // Reset panel collapsed states based on mode config
      sidebarCollapsed: !config.panels.left.visible,
      rightPanelCollapsed: !config.panels.right.visible,
      bottomPanelCollapsed: !config.panels.bottom.visible
    }));

    // Apply mode-specific configurations
    applyModeSetConfig(modeSet);
  },

  setModeSetPreferences: (modeSet, preferences) => set((state) => ({
    modeSetPreferences: {
      ...state.modeSetPreferences,
      [modeSet]: preferences
    }
  })),

  setCurrentProject: (project) => set(() => ({ currentProject: project })),

  setWritingMode: (mode) => set(() => ({ writingMode: mode })),

  toggleSidebar: () => set((state) => ({
    sidebarCollapsed: !state.sidebarCollapsed
  })),

  toggleRightPanel: () => set((state) => ({
    rightPanelCollapsed: !state.rightPanelCollapsed
  })),

  toggleBottomPanel: () => set((state) => ({
    bottomPanelCollapsed: !state.bottomPanelCollapsed
  })),

  setPanelSize: (panel, size) => set((state) => ({
    panelSizes: { ...state.panelSizes, [panel]: size }
  })),

  // Selectors
  getCurrentModeConfig: () => {
    const state = get();
    return MODE_SET_CONFIGS[state.modeSet];
  },

  isFeatureEnabled: (feature) => {
    const state = get();
    const config = MODE_SET_CONFIGS[state.modeSet];
    return config.features[feature] || false;
  },

  isProfessionalMode: () => {
    const state = get();
    return state.modeSet === 'professional-writer';
  },

  isAIFirstMode: () => {
    const state = get();
    return state.modeSet === 'ai-first';
  }
});

// Helper function to apply mode-set specific configurations
function applyModeSetConfig(modeSet: ModeSetId) {
  const config = MODE_SET_CONFIGS[modeSet];

  // Apply CSS classes or other DOM manipulations
  document.body.className = document.body.className
    .replace(/mode-\w+/g, '')
    .trim() + ` mode-${modeSet}`;

  // Apply editor settings globally if needed
  if (config.editor) {
    // This would be handled by editor components listening to the store
    console.log('Applying editor config for mode:', modeSet, config.editor);
  }

  // Track mode change for analytics
  if (typeof window !== 'undefined' && (window as unknown as { analytics?: unknown }).analytics) {
    (window as unknown as { analytics: { track: (event: string, data: Record<string, unknown>) => void } }).analytics.track('Mode Set Changed', {
      modeSet,
      features: Object.keys(config.features).filter(f => config.features[f])
    });
  }
}