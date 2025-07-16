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
  disabled?: boolean;
}

export const ConflictItem: FC<ConflictItemProps> = ({
  conflict,
  onSelectResolution,
  disabled = false
}) => {
  return (
    <div className="conflict-item border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <LockIndicator 
            componentId={conflict.componentId}
            lockLevel={conflict.lockLevel as any}
            size="sm"
          />
          <span className="font-medium ml-2">{conflict.componentType || conflict.componentId}</span>
        </div>
        <span className="text-sm text-gray-500">
          Locked by {conflict.lockedBy}
        </span>
      </div>

      {conflict.description && (
        <div className="text-sm text-gray-600 mb-3">{conflict.description}</div>
      )}

      <div className="space-y-2">
        <label className={`flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
          <input
            type="radio"
            name={`resolution-${conflict.componentId}`}
            onChange={() =>
              !disabled && onSelectResolution({
                type: 'unlock',
                componentId: conflict.componentId
              })
            }
            disabled={disabled}
            className="mr-2"
          />
          <span>Unlock and proceed</span>
        </label>

        <label className={`flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
          <input
            type="radio"
            name={`resolution-${conflict.componentId}`}
            onChange={() =>
              !disabled && onSelectResolution({
                type: 'skip',
                componentId: conflict.componentId
              })
            }
            disabled={disabled}
            className="mr-2"
          />
          <span>Skip this component</span>
        </label>
      </div>
    </div>
  );
};
