import { FC } from 'react';
import { AgentJob } from '../../lib/store/agentProgressStore';

interface SimplifiedAgentStatusProps {
  active: AgentJob | undefined;
}

export const SimplifiedAgentStatus: FC<SimplifiedAgentStatusProps> = ({ active }) => {
  if (!active) return null;

  return (
    <div className="simplified-agent-status p-3 bg-blue-50 rounded-lg">
      <div className="flex items-center">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2" />
        <div>
          <div className="font-medium text-blue-700">{active.displayName}</div>
          <div className="text-sm text-blue-600">{active.currentTask}</div>
        </div>
      </div>
    </div>
  );
};
