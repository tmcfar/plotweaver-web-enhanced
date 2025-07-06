import { FC, useState } from 'react';
import { AgentProgressItemProps } from '../../types/sse';

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
};

export const AgentProgressItem: FC<AgentProgressItemProps> = ({ job, progress }) => {
  const [expanded, setExpanded] = useState(true);

  if (!progress) {
    return (
      <div className="agent-progress-item p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="font-medium">{job.agentName}</span>
          <span className="text-sm text-gray-500">Connecting...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-progress-item bg-white border rounded-lg">
      <div
        className="progress-header p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {progress.status === 'running' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : progress.status === 'completed' ? (
              <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            ) : (
              <div className="h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✗</span>
              </div>
            )}
            <span className="font-medium">{job.agentName}</span>
          </div>
          <span className="text-sm text-gray-500">
            {progress.percentage || 0}%
          </span>
        </div>

        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage || 0}%` }}
            />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="progress-details p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600 mb-3">
            {progress.currentStep}
          </div>

          {progress.subSteps && (
            <ul className="space-y-2 mb-4">
              {progress.subSteps.map((step, i) => (
                <li key={i} className="text-sm flex items-center gap-2">
                  {step.completed ? (
                    <div className="h-3 w-3 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  ) : (
                    <div className="h-3 w-3 border-2 border-gray-300 rounded-full" />
                  )}
                  <span className={step.completed ? 'text-green-700' : 'text-gray-600'}>
                    {step.label}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {progress.estimatedTimeRemaining && (
            <div className="text-xs text-gray-500">
              Est. {formatDuration(progress.estimatedTimeRemaining)} remaining
            </div>
          )}
        </div>
      )}
    </div>
  );
};