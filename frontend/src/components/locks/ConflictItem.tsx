import { FC } from 'react';
import { LockConflict } from '../../lib/api/locks';
import { LockIndicator } from './LockIndicator';

export interface ConflictResolution {
  type: 'unlock' | 'skip';
  componentId: string;
}

interface ConflictItemProps {
  conflict: LockConflict;
  onSelectResolution: (resolution: ConflictResolution) => void;
}

export const ConflictItem: FC<ConflictItemProps> = ({
  conflict,
  onSelectResolution
}) => {
  return (
    <div className="conflict-item border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <LockIndicator level={conflict.lockLevel} />
          <span className="font-medium ml-2">{conflict.componentName}</span>
        </div>
        <span className="text-sm text-gray-500">
          Locked by {conflict.lockedBy}
        </span>
      </div>

      {conflict.reason && (
        <div className="text-sm text-gray-600 mb-3">{conflict.reason}</div>
      )}

      <div className="space-y-2">
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name={`resolution-${conflict.componentId}`}
            onChange={() =>
              onSelectResolution({
                type: 'unlock',
                componentId: conflict.componentId
              })
            }
            className="mr-2"
          />
          <span>Unlock and proceed</span>
        </label>

        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name={`resolution-${conflict.componentId}`}
            onChange={() =>
              onSelectResolution({
                type: 'skip',
                componentId: conflict.componentId
              })
            }
            className="mr-2"
          />
          <span>Skip this component</span>
        </label>
      </div>
    </div>
  );
};
