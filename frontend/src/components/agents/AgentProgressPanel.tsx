import { FC } from 'react';
import { useAgentQueue } from '../../hooks/useAgentQueue';
import { useAgentProgress } from '../../hooks/useAgentProgress';
import { AgentProgressItem } from './AgentProgressItem';

// Wrapper component to handle the useAgentProgress hook
const AgentProgressItemWrapper: FC<{ job: { id: string; agentName: string } }> = ({ job }) => {
  const { progress } = useAgentProgress(job.id);
  return <AgentProgressItem job={job} progress={progress} />;
};

export const AgentProgressPanel: FC = () => {
  const { active, queue, completed } = useAgentQueue();
  
  if (!active && queue.length === 0) {
    return (
      <div className="agent-progress-panel p-4">
        <h3 className="font-semibold mb-3">Agent Progress</h3>
        <div className="text-center text-gray-500 py-8">
          <p>No active agent jobs</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="agent-progress-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Agent Progress</h3>
        <span className="text-sm text-gray-500">
          {active ? 1 : 0} active job{active ? '' : 's'}
        </span>
      </div>
      
      <div className="space-y-3">
        {active && (
          <AgentProgressItemWrapper
            key={active.id}
            job={active}
          />
        )}
        {queue.map(job => (
          <AgentProgressItemWrapper
            key={job.id}
            job={job}
          />
        ))}
      </div>
    </div>
  );
};