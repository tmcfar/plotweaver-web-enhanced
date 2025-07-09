import { Profiler, ProfilerOnRenderCallback } from 'react';

interface DevProfilerProps {
  id: string;
  children: React.ReactNode;
  enabled?: boolean;
}

const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
  interactions
) => {
  if (process.env.NODE_ENV !== 'development') return;

  const perfData = {
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    interactions: Array.from(interactions),
    timestamp: Date.now(),
  };

  // Log slow renders (> 16ms is one frame)
  if (actualDuration > 16) {
    console.warn(`🐌 Slow render detected in ${id}:`, perfData);
  }

  // Store performance data for health assessment
  if (typeof window !== 'undefined') {
    const perfHistory = JSON.parse(
      localStorage.getItem('plotweaver_perf_history') || '[]'
    );
    
    perfHistory.push(perfData);
    
    // Keep only last 100 entries to avoid memory issues
    if (perfHistory.length > 100) {
      perfHistory.splice(0, perfHistory.length - 100);
    }
    
    localStorage.setItem('plotweaver_perf_history', JSON.stringify(perfHistory));
  }

  // Send to analytics if enabled
  if (process.env.NEXT_PUBLIC_ENABLE_PERF_ANALYTICS === 'true') {
    // You can integrate with your analytics service here
    console.log('📊 Performance data:', perfData);
  }
};

export function DevProfiler({ id, children, enabled = true }: DevProfilerProps) {
  // Only enable profiler in development or when explicitly enabled
  const shouldProfile = 
    (process.env.NODE_ENV === 'development' || 
     process.env.NEXT_PUBLIC_ENABLE_PROFILER === 'true') && 
    enabled;

  if (!shouldProfile) {
    return <>{children}</>;
  }

  return (
    <Profiler id={id} onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
}

// Hook to access performance data
export function usePerformanceData() {
  if (typeof window === 'undefined') return [];
  
  const perfHistory = JSON.parse(
    localStorage.getItem('plotweaver_perf_history') || '[]'
  );
  
  return perfHistory;
}

// Hook to clear performance data
export function useClearPerformanceData() {
  return () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('plotweaver_perf_history');
    }
  };
}

// Performance summary hook
export function usePerformanceSummary() {
  const data = usePerformanceData();
  
  if (data.length === 0) return null;
  
  const slowRenders = data.filter((d: any) => d.actualDuration > 16);
  const averageDuration = data.reduce((sum: number, d: any) => sum + d.actualDuration, 0) / data.length;
  
  return {
    totalRenders: data.length,
    slowRenders: slowRenders.length,
    averageDuration: averageDuration.toFixed(2),
    slowestRender: Math.max(...data.map((d: any) => d.actualDuration)).toFixed(2),
    components: [...new Set(data.map((d: any) => d.id))],
  };
}