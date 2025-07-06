import { FC, useState } from 'react';
import { LockConflict } from '../../lib/api/locks';
import { ConflictItem, ConflictResolution } from './ConflictItem';

interface LockConflictDialogProps {
  conflicts: LockConflict[];
  operation: {
    type: string;
    componentIds: string[];
  };
  onResolve: (resolution: { cancelled: boolean; componentIds?: string[] }) => void;
}

export const LockConflictDialog: FC<LockConflictDialogProps> = ({
  conflicts,
  onResolve
}) => {
  const [resolutions, setResolutions] = useState<Record<string, ConflictResolution>>({});

  const handleResolution = (componentId: string, resolution: ConflictResolution) => {
    setResolutions((prev) => ({
      ...prev,
      [componentId]: resolution
    }));
  };

  const isComplete = () => {
    return conflicts.every((conflict) => resolutions[conflict.componentId]);
  };

  const handleConfirm = () => {
    const componentIds = conflicts
      .filter(
        (conflict) =>
          resolutions[conflict.componentId]?.type === 'skip'
      )
      .map((conflict) => conflict.componentId);

    onResolve({ cancelled: false, componentIds });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Lock Conflict Detected</h2>
          <p className="text-gray-600">
            The following components are locked and would be affected by this operation:
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {conflicts.map((conflict) => (
            <ConflictItem
              key={conflict.componentId}
              conflict={conflict}
              onSelectResolution={(resolution) =>
                handleResolution(conflict.componentId, resolution)
              }
            />
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => onResolve({ cancelled: true })}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel Operation
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={!isComplete()}
          >
            {isComplete() ? 'Continue' : 'Select All Resolutions'}
          </button>
        </div>
      </div>
    </div>
  );
};
