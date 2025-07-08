import { FC } from 'react';
import { AgentJobWithTask } from '../../lib/store/agentProgressStore';

interface AgentProgressCardProps {
  agent: AgentJobWithTask;
  progress: number;
  canCancel: boolean;
}

export const AgentProgressCard: FC<AgentProgressCardProps> = ({
  agent,
  progress,
  canCancel
}) => {
  return (
    <div className="agent-progress-card p-4 bg-white rounded-lg border shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium">{agent.displayName}</span>
        {canCancel && (
          <button
            onClick={() => {
              // TODO: Implement cancel
            }}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="text-sm text-gray-600 mb-3">{agent.currentTask}</div>

      <div className="h-2 bg-gray-100 rounded overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-2 text-sm text-gray-500 text-right">
        {progress}% complete
      </div>
    </div>
  );
};
