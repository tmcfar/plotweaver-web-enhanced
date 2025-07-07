import { renderHook, act } from '@testing-library/react';
import { useStore } from '../createStore';

// Clear localStorage before each test to ensure clean state
beforeEach(() => {
  localStorage.clear();
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
(globalThis as unknown as { localStorage: typeof localStorageMock }).localStorage = localStorageMock;

describe('Zustand Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state
    useStore.getState = jest.fn().mockReturnValue(useStore.getInitialState());
  });

  describe('Global State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useStore());

      expect(result.current.modeSet).toBe('professional-writer');
      expect(result.current.user).toBeNull();
      expect(result.current.currentProject).toBeNull();
      expect(result.current.sidebarCollapsed).toBe(false);
    });

    it('should change mode set and apply configuration', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setModeSet('ai-first');
      });

      expect(result.current.modeSet).toBe('ai-first');
      expect(result.current.sidebarCollapsed).toBe(false); // ai-first has visible left panel
      expect(result.current.rightPanelCollapsed).toBe(false);
      expect(result.current.bottomPanelCollapsed).toBe(true); // ai-first has hidden bottom panel
    });

    it('should toggle panels correctly', () => {
      const { result } = renderHook(() => useStore());

      expect(result.current.sidebarCollapsed).toBe(false);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarCollapsed).toBe(true);
    });

    it('should set panel sizes', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setPanelSize('left', 300);
      });

      expect(result.current.panelSizes.left).toBe(300);
    });
  });

  describe('Editor State', () => {
    it('should handle opening files', () => {
      const { result } = renderHook(() => useStore());

      const mockFile = {
        id: 'file-1',
        name: 'Test File',
        type: 'scene' as const,
        content: 'Test content',
        editStatus: 'saved' as const,
        gitStatus: 'committed' as const
      };

      act(() => {
        result.current.openFile(mockFile);
      });

      expect(result.current.openFiles).toHaveLength(1);
      expect(result.current.activeFileId).toBe('file-1');
      expect(result.current.openFiles[0].name).toBe('Test File');
    });

    it('should handle closing files', () => {
      const { result } = renderHook(() => useStore());

      const mockFile = {
        id: 'file-1',
        name: 'Test File',
        type: 'scene' as const,
        content: 'Test content',
        editStatus: 'saved' as const,
        gitStatus: 'committed' as const
      };

      act(() => {
        result.current.openFile(mockFile);
        result.current.closeFile('file-1');
      });

      expect(result.current.openFiles).toHaveLength(0);
      expect(result.current.activeFileId).toBeNull();
    });

    it('should track unsaved changes', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.markUnsaved('file-1');
      });

      expect(result.current.unsavedChanges['file-1']).toBe(true);

      act(() => {
        result.current.markSaved('file-1');
      });

      expect(result.current.unsavedChanges['file-1']).toBe(false);
    });
  });

  describe('Agent State', () => {
    it('should add and start jobs', () => {
      const { result } = renderHook(() => useStore());

      const jobData = {
        agentName: 'Test Agent',
        status: 'queued' as const
      };

      let jobId: string;

      act(() => {
        jobId = result.current.addJob(jobData);
      });

      expect(result.current.queuedJobs).toHaveLength(1);
      expect(result.current.activeJobs.size).toBe(0);

      act(() => {
        result.current.startJob(jobId);
      });

      expect(result.current.queuedJobs).toHaveLength(0);
      expect(result.current.activeJobs.size).toBe(1);
    });

    it('should complete jobs', () => {
      const { result } = renderHook(() => useStore());

      // Clear any existing jobs first
      act(() => {
        result.current.clearCompleted();
        // Clear active jobs by creating a fresh state
        result.current.activeJobs.forEach((_, jobId) => {
          result.current.removeJob(jobId);
        });
      });

      const jobData = {
        agentName: 'Test Agent',
        status: 'queued' as const
      };

      let jobId: string;

      // Add and start job first
      act(() => {
        jobId = result.current.addJob(jobData);
      });

      act(() => {
        result.current.startJob(jobId);
      });

      // Verify job is active
      expect(result.current.activeJobs.has(jobId)).toBe(true);
      expect(result.current.activeJobs.size).toBe(1);

      // Complete the job
      act(() => {
        result.current.completeJob(jobId, { success: true });
      });

      // Verify job is completed and removed from active
      expect(result.current.activeJobs.size).toBe(0);
      expect(result.current.completedJobs).toHaveLength(1);
      expect(result.current.completedJobs[0].result).toEqual({ success: true });
    });
  });

  describe('Continuity State', () => {
    it('should manage continuity issues per scene', () => {
      const { result } = renderHook(() => useStore());

      const issue = {
        id: 'issue-1',
        type: 'character' as const,
        severity: 'high' as const,
        description: 'Test issue',
        affectedScenes: ['scene-1']
      };

      act(() => {
        result.current.setContinuityIssues('scene-1', [issue]);
      });

      expect(result.current.continuityIssues['scene-1']).toHaveLength(1);
      expect(result.current.getIssuesForScene('scene-1')).toHaveLength(1);

      act(() => {
        result.current.removeContinuityIssue('scene-1', 'issue-1');
      });

      expect(result.current.continuityIssues['scene-1']).toHaveLength(0);
    });

    it('should track checking status', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setCheckingStatus('scene-1', true);
      });

      expect(result.current.isSceneChecking('scene-1')).toBe(true);

      act(() => {
        result.current.setCheckingStatus('scene-1', false);
      });

      expect(result.current.isSceneChecking('scene-1')).toBe(false);
    });
  });

  describe('Selectors', () => {
    it('should compute mode-specific selectors correctly', () => {
      const { result } = renderHook(() => useStore());

      // Reset to known state first
      act(() => {
        result.current.setModeSet('professional-writer');
      });

      expect(result.current.isProfessionalMode()).toBe(true);
      expect(result.current.isAIFirstMode()).toBe(false);

      act(() => {
        result.current.setModeSet('ai-first');
      });

      expect(result.current.isProfessionalMode()).toBe(false);
      expect(result.current.isAIFirstMode()).toBe(true);
    });

    it('should compute feature availability correctly', () => {
      const { result } = renderHook(() => useStore());

      // Reset to known state first
      act(() => {
        result.current.setModeSet('professional-writer');
      });

      // Professional writer mode has manual save
      expect(result.current.isFeatureEnabled('manualSave')).toBe(true);
      expect(result.current.isFeatureEnabled('autoSave')).toBe(false);

      act(() => {
        result.current.setModeSet('ai-first');
      });

      // AI-first mode has auto save
      expect(result.current.isFeatureEnabled('manualSave')).toBe(false);
      expect(result.current.isFeatureEnabled('autoSave')).toBe(true);
    });
  });
});