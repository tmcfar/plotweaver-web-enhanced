import { renderHook, waitFor, act } from '@testing-library/react';
import { useContinuityCheck } from '../useContinuityCheck';
import { continuityAPI } from '../../lib/api/continuity';

// Mock the API
jest.mock('../../lib/api/continuity');

const mockContinuityAPI = continuityAPI as jest.Mocked<typeof continuityAPI>;

const mockIssues = [
  {
    id: 'issue-1',
    type: 'character' as const,
    severity: 'high' as const,
    description: 'Character inconsistency',
    affectedScenes: ['scene-1']
  }
];

describe('useContinuityCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts checking when sceneId is provided', async () => {
    mockContinuityAPI.checkScene.mockResolvedValue(mockIssues);

    const { result } = renderHook(() => useContinuityCheck('test-scene'));

    expect(result.current.checking).toBe(false);
    expect(result.current.issues).toEqual([]);

    // Fast forward past the debounce delay
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.checking).toBe(false);
      expect(result.current.issues).toEqual(mockIssues);
    });

    expect(mockContinuityAPI.checkScene).toHaveBeenCalledWith('test-scene');
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockContinuityAPI.checkScene.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useContinuityCheck('test-scene'));

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.checking).toBe(false);
    });

    expect(result.current.issues).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('Continuity check failed:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('can fix issues', async () => {
    mockContinuityAPI.checkScene.mockResolvedValue(mockIssues);
    mockContinuityAPI.applyFix.mockResolvedValue();

    const { result } = renderHook(() => useContinuityCheck('test-scene'));

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.issues).toEqual(mockIssues);
    });

    // Updated issues after fix
    const updatedIssues = [];
    mockContinuityAPI.checkScene.mockResolvedValue(updatedIssues);

    await act(async () => {
      await result.current.fixIssue('issue-1', 'fix-1');
    });

    expect(mockContinuityAPI.applyFix).toHaveBeenCalledWith('fix-1');
    expect(mockContinuityAPI.checkScene).toHaveBeenCalledTimes(2);
  });

  it('handles fix errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockContinuityAPI.checkScene.mockResolvedValue(mockIssues);
    mockContinuityAPI.applyFix.mockRejectedValue(new Error('Fix failed'));

    const { result } = renderHook(() => useContinuityCheck('test-scene'));

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.issues).toEqual(mockIssues);
    });

    await act(async () => {
      await result.current.fixIssue('issue-1', 'fix-1');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to fix issue:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('debounces multiple scene changes', async () => {
    mockContinuityAPI.checkScene.mockResolvedValue([]);

    const { rerender } = renderHook(
      ({ sceneId }) => useContinuityCheck(sceneId),
      { initialProps: { sceneId: 'scene-1' } }
    );

    // Change scene multiple times quickly
    rerender({ sceneId: 'scene-2' });
    rerender({ sceneId: 'scene-3' });
    rerender({ sceneId: 'scene-4' });

    // Fast forward past debounce
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(mockContinuityAPI.checkScene).toHaveBeenCalledTimes(1);
    });

    // Should only check the final scene
    expect(mockContinuityAPI.checkScene).toHaveBeenCalledWith('scene-4');
  });
});