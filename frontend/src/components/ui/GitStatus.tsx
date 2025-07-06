import { FC } from 'react';
import { GitBranch, Plus, FileEdit } from 'lucide-react';

export type GitStatus = 'untracked' | 'modified' | 'committed';

interface GitStatusProps {
  status: GitStatus;
}

export const GitStatus: FC<GitStatusProps> = ({ status }) => {
  const icon = {
    untracked: <Plus className="w-4 h-4 text-blue-500" />,
    modified: <FileEdit className="w-4 h-4 text-yellow-500" />,
    committed: <GitBranch className="w-4 h-4 text-green-500" />
  }[status];

  return (
    <div className="git-status" title={`Git status: ${status}`}>
      {icon}
    </div>
  );
};
