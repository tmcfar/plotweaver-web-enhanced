import { useEffect, useState } from 'react';

export function useDevTools() {
  const [isPerformancePanelOpen, setIsPerformancePanelOpen] = useState(false);
  const [isProfilerEnabled, setIsProfilerEnabled] = useState(false);

  useEffect(() => {
    // Only enable in development
    if (process.env.NODE_ENV !== 'development') return;

    const enableProfiler = () => {
      setIsProfilerEnabled(true);
      console.log('🔍 React Profiler enabled');
    };

    const disableProfiler = () => {
      setIsProfilerEnabled(false);
      console.log('⏹️ React Profiler disabled');
    };

    const togglePerformancePanel = () => {
      setIsPerformancePanelOpen(prev => !prev);
    };

    const exportPerformanceData = () => {
      const data = localStorage.getItem('plotweaver_perf_history');
      if (data) {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plotweaver-performance-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        console.log('📊 Performance data exported');
      }
    };

    const logPerformanceSummary = () => {
      const data = JSON.parse(localStorage.getItem('plotweaver_perf_history') || '[]');
      if (data.length === 0) {
        console.log('No performance data available');
        return;
      }

      const slowRenders = data.filter((d: any) => d.actualDuration > 16);
      const averageDuration = data.reduce((sum: number, d: any) => sum + d.actualDuration, 0) / data.length;
      
      console.group('📈 Performance Summary');
      console.log('Total renders:', data.length);
      console.log('Slow renders (>16ms):', slowRenders.length);
      console.log('Average duration:', averageDuration.toFixed(2) + 'ms');
      console.log('Slowest render:', Math.max(...data.map((d: any) => d.actualDuration)).toFixed(2) + 'ms');
      console.log('Components:', [...new Set(data.map((d: any) => d.id))]);
      console.groupEnd();
    };

    // Global dev tools
    (window as any).PlotWeaverDevTools = {
      enableProfiler,
      disableProfiler,
      togglePerformancePanel,
      exportPerformanceData,
      logPerformanceSummary,
      clearPerformanceData: () => {
        localStorage.removeItem('plotweaver_perf_history');
        console.log('🗑️ Performance data cleared');
      },
    };

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + P = Toggle Performance Panel
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        togglePerformancePanel();
      }
      
      // Ctrl/Cmd + Shift + R = Start/Stop Profiler
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        if (isProfilerEnabled) {
          disableProfiler();
        } else {
          enableProfiler();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    console.log('🛠️ PlotWeaver DevTools loaded');
    console.log('Available commands:');
    console.log('- PlotWeaverDevTools.enableProfiler()');
    console.log('- PlotWeaverDevTools.disableProfiler()');
    console.log('- PlotWeaverDevTools.togglePerformancePanel()');
    console.log('- PlotWeaverDevTools.exportPerformanceData()');
    console.log('- PlotWeaverDevTools.logPerformanceSummary()');
    console.log('- PlotWeaverDevTools.clearPerformanceData()');
    console.log('Shortcuts: Ctrl+Shift+P (Performance Panel), Ctrl+Shift+R (Toggle Profiler)');

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      delete (window as any).PlotWeaverDevTools;
    };
  }, [isProfilerEnabled]);

  return {
    isPerformancePanelOpen,
    setIsPerformancePanelOpen,
    isProfilerEnabled,
    setIsProfilerEnabled,
  };
}