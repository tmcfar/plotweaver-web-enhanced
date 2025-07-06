import { FC } from 'react';
import { Clock } from 'lucide-react';
import { AgentJob } from '../../lib/store/agentProgressStore';

interface QueuedAgentItemProps {
  agent: AgentJob;
}

export const QueuedAgentItem: FC<QueuedAgentItemProps> = ({ agent }) => {
  return (
    <div className="queued-agent p-3 bg-gray-50 rounded flex items-center justify-between">
      <div className="flex items-center">
        <Clock className="w-4 h-4 text-gray-400 mr-2" />
        <div>
          <div className="font-medium">{agent.displayName}</div>
          <div className="text-sm text-gray-500">
            Queued at {agent.startedAt.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};
