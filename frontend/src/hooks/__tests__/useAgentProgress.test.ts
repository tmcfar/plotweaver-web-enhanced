import { renderHook, act } from '@testing-library/react';
import { useAgentProgress } from '../useAgentProgress';
import { sseManager } from '../../lib/sse/SSEConnectionManager';

// Mock the SSE manager
jest.mock('../../lib/sse/SSEConnectionManager');

const mockSSEManager = sseManager as jest.Mocked<typeof sseManager>;

const mockProgress = {
  jobId: 'job-1',
  agentName: 'Test Agent',
  percentage: 50,
  currentStep: 'Processing...',
  status: 'running' as const
};

describe('useAgentProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not connect when no jobId provided', () => {
    renderHook(() => useAgentProgress(''));

    expect(mockSSEManager.connect).not.toHaveBeenCalled();
  });

  it('connects to SSE when jobId is provided', () => {
    renderHook(() => useAgentProgress('job-1'));

    expect(mockSSEManager.connect).toHaveBeenCalledWith('job-1', expect.any(Object));
  });

  it('handles progress updates', () => {
    let onMessage: ((data: unknown) => void) | undefined;

    mockSSEManager.connect.mockImplementation((_jobId, options) => {
      onMessage = options?.onMessage;
      return {} as EventSource;
    });

    const { result } = renderHook(() => useAgentProgress('job-1'));

    expect(result.current.progress).toBeUndefined();
    expect(result.current.connectionError).toBe(false);

    // Simulate progress update
    act(() => {
      onMessage?.(mockProgress);
    });

    expect(result.current.progress).toEqual(mockProgress);
  });

  it('handles connection errors', () => {
    let onError: ((error: Event) => void) | undefined;

    mockSSEManager.connect.mockImplementation((_jobId, options) => {
      onError = options?.onError;
      return {} as EventSource;
    });

    const { result } = renderHook(() => useAgentProgress('job-1'));

    expect(result.current.connectionError).toBe(false);

    // Simulate connection error
    act(() => {
      onError?.(new Event('error'));
    });

    expect(result.current.connectionError).toBe(true);
  });

  it('handles max reconnect attempts reached', () => {
    let onMaxReconnectAttemptsReached: (() => void) | undefined;

    mockSSEManager.connect.mockImplementation((_jobId, options) => {
      onMaxReconnectAttemptsReached = options?.onMaxReconnectAttemptsReached;
      return {} as EventSource;
    });

    const { result } = renderHook(() => useAgentProgress('job-1'));

    expect(result.current.connectionError).toBe(false);

    // Simulate max reconnect attempts reached
    act(() => {
      onMaxReconnectAttemptsReached?.();
    });

    expect(result.current.connectionError).toBe(true);
  });

  it('disconnects on unmount', () => {
    const { unmount } = renderHook(() => useAgentProgress('job-1'));

    unmount();

    expect(mockSSEManager.disconnect).toHaveBeenCalledWith('job-1');
  });

  it('reconnects when jobId changes', () => {
    const { rerender } = renderHook(
      ({ jobId }) => useAgentProgress(jobId),
      { initialProps: { jobId: 'job-1' } }
    );

    expect(mockSSEManager.connect).toHaveBeenCalledWith('job-1', expect.any(Object));

    rerender({ jobId: 'job-2' });

    expect(mockSSEManager.disconnect).toHaveBeenCalledWith('job-1');
    expect(mockSSEManager.connect).toHaveBeenCalledWith('job-2', expect.any(Object));
  });
});