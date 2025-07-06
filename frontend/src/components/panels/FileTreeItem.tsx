import { FC, ReactNode } from 'react';
import { EditStatus } from '../ui/EditStatus';
import { GitStatus } from '../ui/GitStatus';
import { LockIndicator } from '../ui/LockIndicator';
import { Lock } from '../../hooks/useLockStore';

export interface ProjectFile {
  id: string;
  name: string;
  type: 'scene' | 'metadata';
  editStatus: 'saved' | 'unsaved' | 'error';
  gitStatus: 'untracked' | 'modified' | 'committed';
  content?: string;
}

interface FileTreeItemProps {
  file: ProjectFile;
  lock?: Lock;
  onSelect: (file: ProjectFile) => void;
  contextMenu?: ReactNode;
}

export const FileTreeItem: FC<FileTreeItemProps> = ({
  file,
  lock,
  onSelect,
  contextMenu
}) => {
  return (
    <div
      className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-100"
      onClick={() => onSelect(file)}
    >
      <span className="file-name">{file.name}</span>
      <div className="file-status flex items-center space-x-2">
        <EditStatus status={file.editStatus} />
        <GitStatus status={file.gitStatus} />
        {lock && <LockIndicator level={lock.level} />}
      </div>
      {contextMenu}
    </div>
  );
};
