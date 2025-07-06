import { FC } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { AgentJob } from '../../lib/store/agentProgressStore';

interface CompletedAgentsListProps {
  agents: AgentJob[];
}

export const CompletedAgentsList: FC<CompletedAgentsListProps> = ({ agents }) => {
  return (
    <div className="completed-agents">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Completed</h4>
      <div className="space-y-2">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="p-3 bg-gray-50 rounded flex items-center justify-between"
          >
            <div className="flex items-center">
              {agent.status === 'completed' ? (
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 mr-2" />
              )}
              <div>
                <div className="font-medium">{agent.displayName}</div>
                <div className="text-sm text-gray-500">
                  {agent.status === 'completed'
                    ? 'Completed'
                    : agent.error || 'Failed'}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {agent.completedAt?.toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
