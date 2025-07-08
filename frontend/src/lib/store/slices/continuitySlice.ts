import { StateCreator } from '../../../types/store';
import { ContinuityIssue, Fix } from '../../../types/continuity';

export interface ContinuitySlice {
  // State
  continuityIssues: Record<string, ContinuityIssue[]>; // sceneId -> issues
  isChecking: Record<string, boolean>; // sceneId -> checking status
  lastChecked: Record<string, Date>; // sceneId -> last check time
  fixes: Record<string, Fix[]>; // issueId -> available fixes

  // Actions
  setContinuityIssues: (sceneId: string, issues: ContinuityIssue[]) => void;
  addContinuityIssue: (sceneId: string, issue: ContinuityIssue) => void;
  removeContinuityIssue: (sceneId: string, issueId: string) => void;
  setCheckingStatus: (sceneId: string, isChecking: boolean) => void;
  setFixes: (issueId: string, fixes: Fix[]) => void;
  clearIssuesForScene: (sceneId: string) => void;
  clearAllIssues: () => void;

  // Selectors
  getIssuesForScene: (sceneId: string) => ContinuityIssue[];
  getIssuesBySeverity: (severity: 'low' | 'medium' | 'high') => ContinuityIssue[];
  getTotalIssueCount: () => number;
  getHighPriorityIssues: () => ContinuityIssue[];
  isSceneChecking: (sceneId: string) => boolean;
}

export const createContinuitySlice: StateCreator<ContinuitySlice> = (set, get) => ({
  // Initial state
  continuityIssues: {},
  isChecking: {},
  lastChecked: {},
  fixes: {},

  // Actions
  setContinuityIssues: (sceneId, issues) => set((state) => ({
    continuityIssues: { ...state.continuityIssues, [sceneId]: issues },
    lastChecked: { ...state.lastChecked, [sceneId]: new Date() }
  })),

  addContinuityIssue: (sceneId, issue) => set((state) => {
    const existingIssues = state.continuityIssues[sceneId] || [];
    return {
      continuityIssues: {
        ...state.continuityIssues,
        [sceneId]: [...existingIssues, issue]
      }
    };
  }),

  removeContinuityIssue: (sceneId, issueId) => set((state) => {
    const existingIssues = state.continuityIssues[sceneId] || [];
    return {
      continuityIssues: {
        ...state.continuityIssues,
        [sceneId]: existingIssues.filter(issue => issue.id !== issueId)
      }
    };
  }),

  setCheckingStatus: (sceneId, isChecking) => set((state) => ({
    isChecking: { ...state.isChecking, [sceneId]: isChecking }
  })),

  setFixes: (issueId, fixes) => set((state) => ({
    fixes: { ...state.fixes, [issueId]: fixes }
  })),

  clearIssuesForScene: (sceneId) => set((state) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [sceneId]: _removed, ...remainingIssues } = state.continuityIssues;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [sceneId]: _removedChecking, ...remainingChecking } = state.isChecking;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [sceneId]: _removedLastChecked, ...remainingLastChecked } = state.lastChecked;

    return {
      continuityIssues: remainingIssues,
      isChecking: remainingChecking,
      lastChecked: remainingLastChecked
    };
  }),

  clearAllIssues: () => set(() => ({
    continuityIssues: {},
    isChecking: {},
    lastChecked: {},
    fixes: {}
  })),

  // Selectors
  getIssuesForScene: (sceneId) => {
    const state = get();
    return state.continuityIssues[sceneId] || [];
  },

  getIssuesBySeverity: (severity) => {
    const state = get();
    const allIssues = Object.values(state.continuityIssues).flat();
    return allIssues.filter(issue => (issue as ContinuityIssue).severity === severity);
  },

  getTotalIssueCount: () => {
    const state = get();
    return Object.values(state.continuityIssues).flat().length;
  },

  getHighPriorityIssues: () => {
    const state = get();
    const allIssues = Object.values(state.continuityIssues).flat();
    return allIssues.filter(issue => (issue as ContinuityIssue).severity === 'high');
  },

  isSceneChecking: (sceneId) => {
    const state = get();
    return state.isChecking[sceneId] || false;
  }
});