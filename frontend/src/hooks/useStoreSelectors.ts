import { useStore } from '../lib/store/createStore';
import { selectors } from '../lib/store/utils/selectors';

// Mode-set hooks
export function useModeSet() {
  return useStore(state => state.modeSet);
}

export function useIsProfessionalMode() {
  return useStore(selectors.isProfessionalMode);
}

export function useIsAIFirstMode() {
  return useStore(selectors.isAIFirstMode);
}

export function useIsEditorMode() {
  return useStore(selectors.isEditorMode);
}

export function useIsHobbyistMode() {
  return useStore(selectors.isHobbyistMode);
}

export function useCurrentModeConfig() {
  return useStore(selectors.getCurrentModeConfig);
}

export function useIsFeatureEnabled(feature: string) {
  return useStore(selectors.isFeatureEnabled(feature));
}

// Editor hooks
export function useActiveFile() {
  return useStore(selectors.getActiveFile);
}

export function useOpenFiles() {
  return useStore(state => state.openFiles);
}

export function useHasUnsavedChanges() {
  return useStore(selectors.hasUnsavedChanges);
}

export function useUnsavedFileCount() {
  return useStore(selectors.getUnsavedFileCount);
}

export function useIsFileOpen(fileId: string) {
  return useStore(selectors.isFileOpen(fileId));
}

export function useIsFileUnsaved(fileId: string) {
  return useStore(selectors.isFileUnsaved(fileId));
}

// Lock hooks
export function useIsLocked(componentId: string) {
  return useStore(selectors.isComponentLocked(componentId));
}

export function useComponentLock(componentId: string) {
  return useStore(selectors.getComponentLock(componentId));
}

export function useLockedComponentsCount() {
  return useStore(selectors.getLockedComponentsCount);
}

export function useHasLockConflicts() {
  return useStore(selectors.hasLockConflicts);
}

export function useLockConflicts() {
  return useStore(state => state.lockConflicts);
}

// Agent hooks
export function useActiveJobs() {
  return useStore(state => Array.from(state.activeJobs.values()));
}

export function useActiveJobCount() {
  return useStore(selectors.getActiveJobCount);
}

export function useHasActiveJobs() {
  return useStore(selectors.hasActiveJobs);
}

export function useQueuedJobs() {
  return useStore(state => state.queuedJobs);
}

export function useQueuedJobCount() {
  return useStore(selectors.getQueuedJobCount);
}

export function useCompletedJobs() {
  return useStore(state => state.completedJobs);
}

export function useRecentJobs(limit = 5) {
  return useStore(selectors.getRecentJobs(limit));
}

// Continuity hooks
export function useContinuityIssuesForScene(sceneId: string) {
  return useStore(selectors.getContinuityIssuesForScene(sceneId));
}

export function useTotalContinuityIssues() {
  return useStore(selectors.getTotalContinuityIssues);
}

export function useHighPriorityContinuityIssues() {
  return useStore(selectors.getHighPriorityContinuityIssues);
}

export function useHasHighPriorityContinuityIssues() {
  return useStore(selectors.hasHighPriorityContinuityIssues);
}

export function useIsSceneChecking(sceneId: string) {
  return useStore(state => state.isChecking[sceneId] || false);
}

// UI hooks
export function useIsPanelVisible(panel: 'left' | 'right' | 'bottom') {
  return useStore(selectors.isPanelVisible(panel));
}

export function usePanelSize(panel: string) {
  return useStore(selectors.getPanelSize(panel));
}

export function useSidebarCollapsed() {
  return useStore(state => state.sidebarCollapsed);
}

export function useRightPanelCollapsed() {
  return useStore(state => state.rightPanelCollapsed);
}

export function useBottomPanelCollapsed() {
  return useStore(state => state.bottomPanelCollapsed);
}

// Project hooks
export function useCurrentProject() {
  return useStore(state => state.currentProject);
}

export function useHasCurrentProject() {
  return useStore(selectors.hasCurrentProject);
}

export function useCurrentProjectId() {
  return useStore(selectors.getCurrentProjectId);
}

export function useWritingMode() {
  return useStore(state => state.writingMode);
}

// User hooks
export function useUser() {
  return useStore(state => state.user);
}

export function useIsUserLoggedIn() {
  return useStore(selectors.isUserLoggedIn);
}

export function useUserPreferences() {
  return useStore(selectors.getUserPreferences);
}

// Combined state hooks
export function useWorkspaceState() {
  return useStore(selectors.getWorkspaceState);
}

export function useEnabledFeatures() {
  return useStore(selectors.getEnabledFeatures);
}