import { StoreState } from '../lib/store/createStore';
import { ModeSetId } from '../config/modeSetConfigs';

// Complete default state that matches all store slices
export const createDefaultStoreState = (): StoreState => ({
  // GlobalSlice
  user: null,
  modeSet: 'professional-writer' as ModeSetId,
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

  // EditorSlice
  openFiles: [],
  activeFileId: null,
  unsavedChanges: {},
  editorSettings: {
    showLineNumbers: true,
    showMinimap: true,
    wordWrap: 'on'
  },

  // AgentSlice
  activeJobs: new Map(),
  queuedJobs: [],
  completedJobs: [],

  // LockSlice
  locks: {},
  lockConflicts: [],
  lockHistory: [],

  // ContinuitySlice
  continuityIssues: {},
  isChecking: {},
  lastChecked: {},
  fixes: {},

  // Action methods - these will be replaced by actual store methods
  setUser: jest.fn(),
  setModeSet: jest.fn(),
  setModeSetPreferences: jest.fn(),
  setCurrentProject: jest.fn(),
  setWritingMode: jest.fn(),
  toggleSidebar: jest.fn(),
  toggleRightPanel: jest.fn(),
  toggleBottomPanel: jest.fn(),
  setPanelSize: jest.fn(),
  getCurrentModeConfig: jest.fn(() => ({
    features: {
      manualSave: true,
      gitOperations: true,
      autoSave: false,
      preGeneration: false,
      readOnly: false,
      annotations: false,
      commenting: false,
      templates: false,
      achievements: false,
      simplifiedUI: false
    },
    panels: {
      left: { visible: true, defaultWidth: 250 },
      right: { visible: true, defaultWidth: 300 },
      bottom: { visible: true, defaultHeight: 200 }
    },
    editor: {
      showLineNumbers: true,
      showMinimap: true,
      wordWrap: 'on',
      readOnly: false,
      simplifiedToolbar: false
    }
  })),
  isFeatureEnabled: jest.fn((feature: string) => {
    // Return appropriate defaults based on feature
    const features: Record<string, boolean> = {
      manualSave: true,
      gitOperations: true,
      autoSave: false,
      preGeneration: false,
      readOnly: false,
      annotations: false,
      commenting: false,
      templates: false,
      achievements: false,
      simplifiedUI: false
    };
    return features[feature] || false;
  }),
  isProfessionalMode: jest.fn(() => true),
  isAIFirstMode: jest.fn(() => false),

  openFile: jest.fn(),
  closeFile: jest.fn(),
  setActiveFile: jest.fn(),
  markUnsaved: jest.fn(),
  markSaved: jest.fn(),
  updateFileContent: jest.fn(),
  updateEditorSettings: jest.fn(),

  addJob: jest.fn(() => 'mock-job-id'),
  startJob: jest.fn(),
  updateJobProgress: jest.fn(),
  completeJob: jest.fn(),
  failJob: jest.fn(),
  cancelJob: jest.fn(),
  removeJob: jest.fn(),
  clearCompleted: jest.fn(),

  lockComponent: jest.fn(),
  unlockComponent: jest.fn(),
  updateLock: jest.fn(),
  addLockConflict: jest.fn(),
  resolveLockConflict: jest.fn(),
  clearLockConflicts: jest.fn(),
  isLocked: jest.fn(() => false),
  getLock: jest.fn(() => undefined),
  getLockedComponents: jest.fn(() => []),
  hasConflicts: jest.fn(() => false),

  setContinuityIssues: jest.fn(),
  addContinuityIssue: jest.fn(),
  removeContinuityIssue: jest.fn(),
  setCheckingStatus: jest.fn(),
  setFixes: jest.fn(),
  clearIssuesForScene: jest.fn(),
  clearAllIssues: jest.fn(),
  getIssuesForScene: jest.fn(() => []),
  getIssuesBySeverity: jest.fn(() => []),
  getTotalIssueCount: jest.fn(() => 0),
  getHighPriorityIssues: jest.fn(() => []),
  isSceneChecking: jest.fn(() => false)
});

/**
 * Creates a mock store with all properties initialized and optionally overridden
 */
export const createMockStore = (overrides: Partial<StoreState> = {}) => {
  const defaultState = createDefaultStoreState();
  return {
    ...defaultState,
    ...overrides
  };
};

/**
 * Creates a complete Zustand store mock for testing
 */
export const createMockZustandStore = (initialState: Partial<StoreState> = {}) => {
  const state = createMockStore(initialState);
  
  return {
    getState: () => state,
    setState: jest.fn((partial: any) => {
      if (typeof partial === 'function') {
        Object.assign(state, partial(state));
      } else {
        Object.assign(state, partial);
      }
    }),
    subscribe: jest.fn(() => jest.fn()), // Return unsubscribe function
    destroy: jest.fn(),
  };
};

/**
 * Reset store to clean state between tests
 */
export const resetStoreForTesting = (store: any, overrides: Partial<StoreState> = {}) => {
  const cleanState = createMockStore(overrides);
  store.setState(cleanState, true); // Replace entire state
};