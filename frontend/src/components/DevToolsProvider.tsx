import { useDevTools } from '@/hooks/useDevTools';
import { PerformancePanel } from './PerformancePanel';

interface DevToolsProviderProps {
  children: React.ReactNode;
}

export function DevToolsProvider({ children }: DevToolsProviderProps) {
  const { isPerformancePanelOpen, setIsPerformancePanelOpen } = useDevTools();

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <PerformancePanel
        isOpen={isPerformancePanelOpen}
        onClose={() => setIsPerformancePanelOpen(false)}
      />
      
      {/* Dev Tools Indicator */}
      <div className="fixed bottom-4 right-4 z-40">
        <div className="bg-gray-800 text-white px-2 py-1 rounded text-xs">
          DevTools: Press Ctrl+Shift+P
        </div>
      </div>
    </>
  );
}