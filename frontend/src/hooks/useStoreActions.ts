import { useStore } from '../lib/store/createStore';
import { ProjectFile } from '../components/panels/FileTreeItem';
import { AgentJob } from '../types/store';

// Global actions
export function useGlobalActions() {
  const setUser = useStore(state => state.setUser);
  const setModeSet = useStore(state => state.setModeSet);
  const setModeSetPreferences = useStore(state => state.setModeSetPreferences);
  const setCurrentProject = useStore(state => state.setCurrentProject);
  const setWritingMode = useStore(state => state.setWritingMode);
  const toggleSidebar = useStore(state => state.toggleSidebar);
  const toggleRightPanel = useStore(state => state.toggleRightPanel);
  const toggleBottomPanel = useStore(state => state.toggleBottomPanel);
  const setPanelSize = useStore(state => state.setPanelSize);

  return {
    setUser,
    setModeSet,
    setModeSetPreferences,
    setCurrentProject,
    setWritingMode,
    toggleSidebar,
    toggleRightPanel,
    toggleBottomPanel,
    setPanelSize
  };
}

// Editor actions
export function useEditorActions() {
  const openFile = useStore(state => state.openFile);
  const closeFile = useStore(state => state.closeFile);
  const setActiveFile = useStore(state => state.setActiveFile);
  const markUnsaved = useStore(state => state.markUnsaved);
  const markSaved = useStore(state => state.markSaved);
  const updateFileContent = useStore(state => state.updateFileContent);
  const updateEditorSettings = useStore(state => state.updateEditorSettings);

  return {
    openFile,
    closeFile,
    setActiveFile,
    markUnsaved,
    markSaved,
    updateFileContent,
    updateEditorSettings
  };
}

// Lock actions
export function useLockActions() {
  const lockComponent = useStore(state => state.lockComponent);
  const unlockComponent = useStore(state => state.unlockComponent);
  const updateLock = useStore(state => state.updateLock);
  const addLockConflict = useStore(state => state.addLockConflict);
  const resolveLockConflict = useStore(state => state.resolveLockConflict);
  const clearLockConflicts = useStore(state => state.clearLockConflicts);

  return {
    lockComponent,
    unlockComponent,
    updateLock,
    addLockConflict,
    resolveLockConflict,
    clearLockConflicts
  };
}

// Agent actions
export function useAgentActions() {
  const addJob = useStore(state => state.addJob);
  const startJob = useStore(state => state.startJob);
  const updateJobProgress = useStore(state => state.updateJobProgress);
  const completeJob = useStore(state => state.completeJob);
  const failJob = useStore(state => state.failJob);
  const cancelJob = useStore(state => state.cancelJob);
  const removeJob = useStore(state => state.removeJob);
  const clearCompleted = useStore(state => state.clearCompleted);

  return {
    addJob,
    startJob,
    updateJobProgress,
    completeJob,
    failJob,
    cancelJob,
    removeJob,
    clearCompleted
  };
}

// Continuity actions
export function useContinuityActions() {
  const setContinuityIssues = useStore(state => state.setContinuityIssues);
  const addContinuityIssue = useStore(state => state.addContinuityIssue);
  const removeContinuityIssue = useStore(state => state.removeContinuityIssue);
  const setCheckingStatus = useStore(state => state.setCheckingStatus);
  const setFixes = useStore(state => state.setFixes);
  const clearIssuesForScene = useStore(state => state.clearIssuesForScene);
  const clearAllIssues = useStore(state => state.clearAllIssues);

  return {
    setContinuityIssues,
    addContinuityIssue,
    removeContinuityIssue,
    setCheckingStatus,
    setFixes,
    clearIssuesForScene,
    clearAllIssues
  };
}

// Composite actions for common workflows
export function useWorkflowActions() {
  const editorActions = useEditorActions();
  const lockActions = useLockActions();
  const agentActions = useAgentActions();

  // Open file with lock check
  const openFileWithLockCheck = async (file: ProjectFile) => {
    const isLocked = useStore.getState().isLocked(file.id);

    if (isLocked) {
      const lock = useStore.getState().getLock(file.id);
      console.warn(`File ${file.name} is locked:`, lock);
      // Could show a dialog or handle differently based on lock level
    }

    editorActions.openFile(file);
  };

  // Save file and update lock
  const saveFileWithLock = async (fileId: string, content: string) => {
    editorActions.updateFileContent(fileId, content);
    editorActions.markSaved(fileId);

    // Update lock timestamp if file is locked
    const lock = useStore.getState().getLock(fileId);
    if (lock) {
      lockActions.updateLock(fileId, { lockedAt: new Date().toISOString() });
    }
  };

  // Start agent job with conflict checking
  const startAgentWithConflictCheck = async (agentJob: Omit<AgentJob, 'id' | 'createdAt'>) => {
    const jobId = agentActions.addJob(agentJob);

    // Check for lock conflicts before starting
    const hasConflicts = useStore.getState().hasConflicts();
    if (hasConflicts) {
      console.warn('Lock conflicts detected, job may be delayed');
    }

    agentActions.startJob(jobId);
    return jobId;
  };

  return {
    openFileWithLockCheck,
    saveFileWithLock,
    startAgentWithConflictCheck
  };
}