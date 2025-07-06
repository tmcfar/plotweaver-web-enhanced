import { FC } from 'react';
import { Lock } from 'lucide-react';
import { LockLevel } from '../../hooks/useLockStore';

interface EditorToolbarProps {
  lock?: {
    level: LockLevel;
    owner?: string;
  };
  onSave?: () => void;
  readOnly?: boolean;
}

export const EditorToolbar: FC<EditorToolbarProps> = ({ lock, onSave, readOnly }) => {
  const getLockMessage = (level: LockLevel) => {
    switch (level) {
      case 'soft':
        return 'AI suggestions only';
      case 'hard':
        return 'Changes require confirmation';
      case 'frozen':
        return 'Read-only';
      default:
        return '';
    }
  };

  return (
    <div className="editor-toolbar flex items-center justify-between p-2 border-b">
      <div className="flex items-center space-x-2">
        {lock && (
          <div className="flex items-center text-sm text-gray-600">
            <Lock className="w-4 h-4 mr-1" />
            <span>{getLockMessage(lock.level)}</span>
            {lock.owner && (
              <span className="ml-2 text-gray-500">by {lock.owner}</span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {!readOnly && onSave && (
          <button
            onClick={onSave}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        )}
      </div>
    </div>
  );
};
