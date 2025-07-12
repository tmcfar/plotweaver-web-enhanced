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
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResolution = (componentId: string, resolution: ConflictResolution) => {
    setResolutions((prev) => ({
      ...prev,
      [componentId]: resolution
    }));
  };

  const isComplete = () => {
    if (conflicts.length === 0) return true;
    return conflicts.every((conflict) => resolutions[conflict.componentId]);
  };

  const getUnresolvedCount = () => {
    return conflicts.filter((conflict) => !resolutions[conflict.componentId]).length;
  };

  const handleConfirm = async () => {
    if (!isComplete() || isResolving) return;
    
    setIsResolving(true);
    setError(null);
    
    try {
      const componentIds = conflicts
        .filter(
          (conflict) =>
            resolutions[conflict.componentId]?.type === 'skip'
        )
        .map((conflict) => conflict.componentId);

      await onResolve({ cancelled: false, componentIds });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while resolving conflicts');
    } finally {
      setIsResolving(false);
    }
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
              disabled={isResolving}
            />
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 font-medium mr-2">Failed to resolve conflicts</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Validation Messages */}
        {!isComplete() && conflicts.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              {getUnresolvedCount()} conflict{getUnresolvedCount() !== 1 ? 's' : ''} need{getUnresolvedCount() === 1 ? 's' : ''} resolution
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => onResolve({ cancelled: true })}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={isResolving}
          >
            Cancel Operation
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded transition-colors ${
              !isComplete() || isResolving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            disabled={!isComplete() || isResolving}
          >
            {isResolving
              ? 'Resolving conflicts...'
              : isComplete()
              ? 'Continue'
              : 'Select All Resolutions'}
          </button>
        </div>
      </div>
    </div>
  );
};
