import { StoreState } from '../createStore';
import { MODE_SET_CONFIGS } from '../../../config/modeSetConfigs';

export const selectors = {
  // Mode-set selectors
  getCurrentModeConfig: (state: StoreState) => 
    MODE_SET_CONFIGS[state.modeSet],
    
  isProfessionalMode: (state: StoreState) => 
    state.modeSet === 'professional-writer',
    
  isAIFirstMode: (state: StoreState) => 
    state.modeSet === 'ai-first',
    
  isEditorMode: (state: StoreState) => 
    state.modeSet === 'editor',
    
  isHobbyistMode: (state: StoreState) => 
    state.modeSet === 'hobbyist',
  
  // Editor selectors
  getActiveFile: (state: StoreState) => 
    state.openFiles.find(f => f.id === state.activeFileId),
    
  hasUnsavedChanges: (state: StoreState) => 
    Object.values(state.unsavedChanges).some(Boolean),
    
  getUnsavedFileCount: (state: StoreState) =>
    Object.values(state.unsavedChanges).filter(Boolean).length,
    
  isFileOpen: (fileId: string) => (state: StoreState) =>
    state.openFiles.some(f => f.id === fileId),
    
  isFileUnsaved: (fileId: string) => (state: StoreState) =>
    state.unsavedChanges[fileId] || false,
  
  // Lock selectors
  getComponentLock: (componentId: string) => (state: StoreState) => 
    state.locks[componentId],
    
  isComponentLocked: (componentId: string) => (state: StoreState) => 
    !!state.locks[componentId],
    
  getLockedComponentsCount: (state: StoreState) =>
    Object.keys(state.locks).length,
    
  hasLockConflicts: (state: StoreState) =>
    state.lockConflicts.length > 0,
  
  // Agent selectors
  getActiveJobCount: (state: StoreState) => 
    state.activeJobs.size,
    
  hasActiveJobs: (state: StoreState) => 
    state.activeJobs.size > 0,
    
  getQueuedJobCount: (state: StoreState) =>
    state.queuedJobs.length,
    
  getCompletedJobCount: (state: StoreState) =>
    state.completedJobs.length,
    
  getRecentJobs: (limit: number = 5) => (state: StoreState) =>
    state.completedJobs
      .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
      .slice(0, limit),
  
  // Continuity selectors
  getContinuityIssuesForScene: (sceneId: string) => (state: StoreState) =>
    state.continuityIssues[sceneId] || [],
    
  getTotalContinuityIssues: (state: StoreState) =>
    Object.values(state.continuityIssues).flat().length,
    
  getHighPriorityContinuityIssues: (state: StoreState) =>
    Object.values(state.continuityIssues)
      .flat()
      .filter(issue => issue.severity === 'high'),
      
  hasHighPriorityContinuityIssues: (state: StoreState) =>
    Object.values(state.continuityIssues)
      .flat()
      .some(issue => issue.severity === 'high'),
  
  // UI selectors
  isPanelVisible: (panel: 'left' | 'right' | 'bottom') => (state: StoreState) => {
    const config = MODE_SET_CONFIGS[state.modeSet];
    const panelConfig = config.panels[panel];
    
    switch (panel) {
      case 'left':
        return panelConfig.visible && !state.sidebarCollapsed;
      case 'right':
        return panelConfig.visible && !state.rightPanelCollapsed;
      case 'bottom':
        return panelConfig.visible && !state.bottomPanelCollapsed;
      default:
        return false;
    }
  },
  
  getPanelSize: (panel: string) => (state: StoreState) =>
    state.panelSizes[panel],
    
  // Feature selectors
  isFeatureEnabled: (feature: string) => (state: StoreState) => {
    const config = MODE_SET_CONFIGS[state.modeSet];
    return config.features[feature] || false;
  },
  
  getEnabledFeatures: (state: StoreState) => {
    const config = MODE_SET_CONFIGS[state.modeSet];
    return Object.keys(config.features).filter(feature => config.features[feature]);
  },
  
  // Project selectors
  hasCurrentProject: (state: StoreState) =>
    !!state.currentProject,
    
  getCurrentProjectId: (state: StoreState) =>
    state.currentProject?.id,
    
  // User selectors
  isUserLoggedIn: (state: StoreState) =>
    !!state.user,
    
  getUserPreferences: (state: StoreState) =>
    state.user?.preferences || {},
    
  // Combined selectors
  getWorkspaceState: (state: StoreState) => ({
    hasProject: !!state.currentProject,
    hasOpenFiles: state.openFiles.length > 0,
    hasUnsavedChanges: Object.values(state.unsavedChanges).some(Boolean),
    hasActiveJobs: state.activeJobs.size > 0,
    hasIssues: Object.values(state.continuityIssues).flat().length > 0,
    hasConflicts: state.lockConflicts.length > 0
  })
};