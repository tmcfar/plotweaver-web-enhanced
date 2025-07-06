import { useState, useEffect } from 'react';

export interface SSEOptions {
  onOpen?: () => void;
  onMessage?: (data: unknown) => void;
  onError?: (error: Event) => void;
}

export function useSSE(url: string | null, options: SSEOptions = {}) {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<Error | null>(null);
  const [readyState, setReadyState] = useState<number>(0);

  useEffect(() => {
    if (!url) return;

    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setReadyState(eventSource.readyState);
      options.onOpen?.();
    };

    eventSource.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);
      setData(parsedData);
      options.onMessage?.(parsedData);
    };

    eventSource.onerror = (error) => {
      setError(new Error('SSE connection error'));
      setReadyState(eventSource.readyState);
      options.onError?.(error);
    };

    return () => {
      eventSource.close();
    };
  }, [url, options]);

  return { data, error, readyState };
}
