import { FC } from 'react';
import { useFoundationStatus } from '../../hooks/useFoundationStatus';
import { ComponentStatus } from './ComponentStatus';
import { lockAPI } from '../../lib/api/locks';

interface FoundationCheckpointProps {
  onComplete: () => void;
}

export const FoundationCheckpoint: FC<FoundationCheckpointProps> = ({
  onComplete
}) => {
  const { status, loading, refresh } = useFoundationStatus();

  const handleLockComponent = async (componentType: string) => {
    try {
      await lockAPI.bulkLock({
        componentType,
        level: 'hard',
        reason: 'Foundation locked'
      });
      // Refresh status after locking
      refresh();
    } catch {
      // Error is handled by the store
    }
  };

  const hasAnyReady = () => {
    if (!status) return false;
    return (
      status.setting.ready ||
      status.characters.ready ||
      status.plot.ready
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">🎯 Ready to lock your foundation?</h2>
          <p className="text-gray-600">
            Lock completed components before moving to refinement
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <ComponentStatus
            title="Setting & World"
            ready={status.setting.ready}
            details={status.setting.details}
            onLock={() => handleLockComponent('setting')}
          />

          <ComponentStatus
            title="Characters"
            ready={status.characters.ready}
            details={status.characters.details}
            onLock={() => handleLockComponent('characters')}
          />

          <ComponentStatus
            title="Plot Structure"
            ready={status.plot.ready}
            details={status.plot.details}
            missing={status.plot.missing}
            onLock={() => handleLockComponent('plot')}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onComplete}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Skip for Now
          </button>
          <button
            onClick={() => {
              handleLockComponent('all');
              onComplete();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={!hasAnyReady()}
          >
            Lock Ready Components
          </button>
        </div>
      </div>
    </div>
  );
};
