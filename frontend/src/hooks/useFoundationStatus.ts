import { useState, useEffect } from 'react';

export interface ComponentStatusDetail {
  ready: boolean;
  text: string;
}

export interface FoundationStatus {
  setting: {
    ready: boolean;
    details: ComponentStatusDetail[];
  };
  characters: {
    ready: boolean;
    details: ComponentStatusDetail[];
  };
  plot: {
    ready: boolean;
    details: ComponentStatusDetail[];
    missing?: string[];
  };
}

export function useFoundationStatus() {
  const [status, setStatus] = useState<FoundationStatus>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/foundation/status');
      if (!response.ok) {
        throw new Error('Failed to load foundation status');
      }
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error loading foundation status:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    status,
    loading,
    refresh: loadStatus
  };
}
