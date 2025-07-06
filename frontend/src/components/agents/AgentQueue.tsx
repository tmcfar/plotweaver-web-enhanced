import { FC } from 'react';
import { useGlobalStore } from '../../lib/store';
import { useAgentQueue } from '../../hooks/useAgentQueue';
import { AgentProgressCard } from './AgentProgressCard';
import { QueuedAgentItem } from './QueuedAgentItem';
import { CompletedAgentsList } from './CompletedAgentsList';
import { SimplifiedAgentStatus } from './SimplifiedAgentStatus';

export const AgentQueue: FC = () => {
  const { modeSet } = useGlobalStore();
  const { active, queue, completed } = useAgentQueue();

  if (modeSet === 'hobbyist') {
    return <SimplifiedAgentStatus active={active} />;
  }

  return (
    <div className="agent-queue p-4">
      <h3 className="text-lg font-semibold mb-4">Agent Activity</h3>

      {active && (
        <div className="mb-6">
          <AgentProgressCard
            agent={active}
            progress={active.progress}
            canCancel={modeSet === 'professional-writer'}
          />
        </div>
      )}

      {queue.length > 0 && (
        <div className="queued-agents mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Queued ({queue.length})
          </h4>
          <div className="space-y-2">
            {queue.map((agent) => (
              <QueuedAgentItem key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      )}

      {modeSet === 'professional-writer' && completed.length > 0 && (
        <CompletedAgentsList agents={completed} />
      )}
    </div>
  );
};
