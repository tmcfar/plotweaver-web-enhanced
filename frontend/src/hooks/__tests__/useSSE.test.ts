import { renderHook, act } from '@testing-library/react';
import { useSSE } from '../useSSE';

describe('useSSE', () => {
  let mockEventSource: {
    onopen: ((event: Event) => void) | null;
    onmessage: ((event: MessageEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    close: jest.MockedFunction<() => void>;
    readyState: number;
  };

  beforeEach(() => {
    mockEventSource = {
      onopen: null,
      onmessage: null,
      onerror: null,
      close: jest.fn(),
      readyState: 0
    };

    Object.defineProperty(window, 'EventSource', {
      writable: true,
      value: jest.fn(() => mockEventSource)
    });
  });

  it('connects to SSE endpoint', () => {
    const url = '/api/events';
    renderHook(() => useSSE(url));

    expect(EventSource).toHaveBeenCalledWith(url);
  });

  it('handles messages', async () => {
    const { result } = renderHook(() => useSSE('/api/events'));

    const testData = { value: 'test' };
    await act(async () => {
      if (mockEventSource.onmessage) {
        mockEventSource.onmessage(new MessageEvent('message', { data: JSON.stringify(testData) }));
      }
    });

    expect(result.current.data).toEqual(testData);
  });

  it('handles errors', async () => {
    const { result } = renderHook(() => useSSE('/api/events'));

    await act(async () => {
      if (mockEventSource.onerror) {
        mockEventSource.onerror(new Event('error'));
      }
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe('SSE connection error');
  });

  it('calls onMessage callback when provided', async () => {
    const onMessage = jest.fn();
    renderHook(() => useSSE('/api/events', { onMessage }));

    const testData = { value: 'test' };
    await act(async () => {
      if (mockEventSource.onmessage) {
        mockEventSource.onmessage(new MessageEvent('message', { data: JSON.stringify(testData) }));
      }
    });

    expect(onMessage).toHaveBeenCalledWith(testData);
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useSSE('/api/events'));

    unmount();

    expect(mockEventSource.close).toHaveBeenCalled();
  });
});

