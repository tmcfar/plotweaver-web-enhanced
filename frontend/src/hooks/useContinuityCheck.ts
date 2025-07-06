import { useState, useEffect } from 'react';
import { ContinuityIssue } from '../types/continuity';
import { continuityAPI } from '../lib/api/continuity';

function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: number;

  const debounced = ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T & { cancel: () => void };

  debounced.cancel = () => clearTimeout(timeoutId);

  return debounced;
}

export function useContinuityCheck(sceneId: string) {
  const [issues, setIssues] = useState<ContinuityIssue[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const checkContinuity = debounce(async () => {
      setChecking(true);
      try {
        const results = await continuityAPI.checkScene(sceneId);
        setIssues(results);
      } catch (error) {
        console.error('Continuity check failed:', error);
        setIssues([]);
      } finally {
        setChecking(false);
      }
    }, 2000);

    checkContinuity();

    return () => checkContinuity.cancel();
  }, [sceneId]);

  const fixIssue = async (_issueId: string, fixId: string) => {
    try {
      await continuityAPI.applyFix(fixId);
      // Refresh issues
      const results = await continuityAPI.checkScene(sceneId);
      setIssues(results);
    } catch (error) {
      console.error('Failed to fix issue:', error);
    }
  };

  return { issues, checking, fixIssue };
}