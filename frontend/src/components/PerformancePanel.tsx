import { useState, useEffect } from 'react';
import { usePerformanceData, usePerformanceSummary, useClearPerformanceData } from './DevProfiler';

interface PerformancePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PerformancePanel({ isOpen, onClose }: PerformancePanelProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const performanceData = usePerformanceData();
  const summary = usePerformanceSummary();
  const clearData = useClearPerformanceData();

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setRefreshKey(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-11/12 max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">React Performance Profiler</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                clearData();
                setRefreshKey(prev => prev + 1);
              }}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Data
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          {summary ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Total Renders</div>
                  <div className="text-2xl font-bold text-blue-600">{summary.totalRenders}</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Slow Renders</div>
                  <div className="text-2xl font-bold text-yellow-600">{summary.slowRenders}</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Avg Duration</div>
                  <div className="text-2xl font-bold text-green-600">{summary.averageDuration}ms</div>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Slowest Render</div>
                  <div className="text-2xl font-bold text-red-600">{summary.slowestRender}ms</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Components Profiled</h3>
                <div className="flex flex-wrap gap-2">
                  {summary.components.map((component) => (
                    <span
                      key={String(component)}
                      className="px-2 py-1 bg-gray-100 rounded text-sm"
                    >
                      {String(component)}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Recent Performance Data</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Component</th>
                        <th className="text-left p-2">Phase</th>
                        <th className="text-left p-2">Duration</th>
                        <th className="text-left p-2">Base Duration</th>
                        <th className="text-left p-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData.slice(-20).reverse().map((item: any, index: number) => (
                        <tr
                          key={index}
                          className={`border-b ${
                            item.actualDuration > 16 ? 'bg-red-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="p-2 font-medium">{item.id}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.phase === 'mount' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {item.phase}
                            </span>
                          </td>
                          <td className="p-2">
                            <span className={`font-mono ${
                              item.actualDuration > 16 ? 'text-red-600 font-bold' : 'text-gray-900'
                            }`}>
                              {item.actualDuration.toFixed(2)}ms
                            </span>
                          </td>
                          <td className="p-2 font-mono text-gray-600">
                            {item.baseDuration.toFixed(2)}ms
                          </td>
                          <td className="p-2 text-gray-500">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No performance data available.</p>
              <p className="text-sm mt-2">Wrap components with DevProfiler to start collecting data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}