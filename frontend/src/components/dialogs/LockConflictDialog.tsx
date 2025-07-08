import { FC } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { LockConflict, Resolution } from '../../lib/api/locks';

export interface LockConflictDialogProps {
  conflicts: LockConflict[];
  onResolve: (resolution: Resolution) => void;
  onCancel: () => void;
}

export const LockConflictDialog: FC<LockConflictDialogProps> = ({
  conflicts,
  onResolve,
  onCancel
}) => {
  return (
    <Dialog.Root defaultOpen>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[480px]">
          <Dialog.Title className="text-xl font-bold mb-4">
            Lock Conflicts Detected
          </Dialog.Title>
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              The following components are locked and may be affected by this operation:
            </p>
            <ul className="space-y-3">
              {conflicts.map((conflict) => (
                <li
                  key={conflict.componentId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium">{conflict.componentType}</p>
                    <p className="text-sm text-gray-500">
                      Locked by {conflict.lockedBy}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-sm ${conflict.lockLevel === 'frozen'
                      ? 'bg-red-100 text-red-700'
                      : conflict.lockLevel === 'hard'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-yellow-100 text-yellow-700'
                      }`}
                  >
                    {conflict.lockLevel}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => onResolve({ cancelled: false })}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Continue Anyway
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
