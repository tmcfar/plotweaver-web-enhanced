import { FC, useState } from 'react';
import { cn } from '@/lib/utils';

export type LockLevel = 'soft' | 'hard' | 'frozen';
export type LockType = 'personal' | 'editorial' | 'collaborative';

interface LockIndicatorProps {
  componentId: string;
  lockLevel: LockLevel | null;
  lockType?: LockType;
  canOverride?: boolean;
  sharedWith?: string[];
  reason?: string;
  lockedBy?: string;
  lockedAt?: Date;
  onLockToggle?: (componentId: string) => void;
  onOverrideRequest?: (componentId: string, reason: string) => void;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  interactive?: boolean;
  isLoading?: boolean;
  ariaLabel?: string;
}

const LOCK_CONFIG = {
  soft: {
    icon: '🟡',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'Soft Lock',
    description: 'AI can suggest but not modify'
  },
  hard: {
    icon: '🟠',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    label: 'Hard Lock',
    description: 'Edits require confirmation'
  },
  frozen: {
    icon: '🔴',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Frozen',
    description: 'Completely immutable'
  }
};

const TYPE_CONFIG = {
  personal: {
    icon: '👤',
    label: 'Personal Lock',
    description: 'Locked by you'
  },
  editorial: {
    icon: '✏️',
    label: 'Editorial Lock',
    description: 'Editorial review lock'
  },
  collaborative: {
    icon: '👥',
    label: 'Collaborative Lock',
    description: 'Shared team lock'
  }
};

const SIZE_CONFIG = {
  sm: {
    icon: 'text-sm',
    text: 'text-xs',
    padding: 'px-2 py-1'
  },
  md: {
    icon: 'text-base',
    text: 'text-sm',
    padding: 'px-3 py-2'
  },
  lg: {
    icon: 'text-lg',
    text: 'text-base',
    padding: 'px-4 py-3'
  }
};

export const LockIndicator: FC<LockIndicatorProps> = ({
  componentId,
  lockLevel,
  lockType = 'personal',
  canOverride = false,
  sharedWith = [],
  reason,
  lockedBy,
  lockedAt,
  onLockToggle,
  onOverrideRequest,
  size = 'md',
  showDetails = true,
  interactive = true,
  isLoading = false,
  ariaLabel
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="lock-indicator relative">
        <div
          className={cn(
            'flex items-center space-x-1 rounded-lg transition-all animate-pulse',
            'bg-gray-100 border-gray-200 border',
            SIZE_CONFIG[size].padding,
            'cursor-not-allowed'
          )}
        >
          <span className={cn(SIZE_CONFIG[size].icon, 'text-gray-400')}>⏳</span>
        </div>
      </div>
    );
  }

  if (!lockLevel) {
    if (!interactive) {
      return (
        <span 
          className="lock-indicator-empty opacity-30"
          title="No lock"
        >
          <span className={cn(SIZE_CONFIG[size].icon, 'text-gray-400')}>🔓</span>
        </span>
      );
    }
    
    return (
      <button
        onClick={() => onLockToggle?.(componentId)}
        className="lock-indicator-empty opacity-30 hover:opacity-60 transition-opacity"
        title="Click to lock"
        aria-label={ariaLabel || 'Unlock button - click to lock'}
        disabled={isLoading}
      >
        <span className={cn(SIZE_CONFIG[size].icon, 'text-gray-400')}>🔓</span>
      </button>
    );
  }

  const lockConfig = LOCK_CONFIG[lockLevel];
  const typeConfig = TYPE_CONFIG[lockType];
  const sizeConfig = SIZE_CONFIG[size];

  const handleOverrideSubmit = () => {
    if (overrideReason.trim()) {
      onOverrideRequest?.(componentId, overrideReason);
      setShowOverrideDialog(false);
      setOverrideReason('');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date);
  };

  const defaultAriaLabel = `${lockConfig.label} - ${lockConfig.description}${reason ? ` - ${reason}` : ''}`;

  return (
    <div className="lock-indicator relative">
      <div
        className={cn(
          'flex items-center space-x-1 rounded-lg transition-all',
          lockConfig.bgColor, lockConfig.borderColor, 'border',
          sizeConfig.padding,
          interactive && !isLoading ? 'cursor-pointer hover:shadow-sm' : 'cursor-not-allowed'
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={interactive && !isLoading ? () => onLockToggle?.(componentId) : undefined}
        aria-label={ariaLabel || defaultAriaLabel}
        title={lockConfig.label}
      >
        {/* Lock Level Icon */}
        <span className={cn(sizeConfig.icon, lockConfig.color)}>
          {lockConfig.icon}
        </span>

        {/* Lock Type Icon */}
        {showDetails && (
          <span className={cn(sizeConfig.icon, 'text-gray-600')}>
            {typeConfig.icon}
          </span>
        )}

        {/* Collaborative Indicators */}
        {lockType === 'collaborative' && sharedWith.length > 0 && (
          <div className="flex -space-x-1">
            {sharedWith.slice(0, 3).map((user, index) => (
              <div
                key={user}
                className="w-4 h-4 bg-blue-500 rounded-full border border-white text-xs text-white flex items-center justify-center"
                title={user}
              >
                {user.charAt(0).toUpperCase()}
              </div>
            ))}
            {sharedWith.length > 3 && (
              <div className="w-4 h-4 bg-gray-400 rounded-full border border-white text-xs text-white flex items-center justify-center">
                +{sharedWith.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Override Button */}
        {canOverride && interactive && !isLoading && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowOverrideDialog(true);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 ml-1"
            title="Request override"
            aria-label="Request override"
          >
            ⚡
          </button>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 max-w-xs">
            <div className="font-medium">{lockConfig.label}</div>
            <div className="text-gray-300">{lockConfig.description}</div>
            
            {reason && (
              <div className="mt-1 pt-1 border-t border-gray-700">
                <div className="text-gray-300">Reason: {reason}</div>
              </div>
            )}
            
            {lockedBy && (
              <div className="text-gray-300">By: {lockedBy}</div>
            )}
            
            {lockedAt && (
              <div className="text-gray-300">
                {formatDate(lockedAt)}
              </div>
            )}

            {lockType === 'collaborative' && sharedWith.length > 0 && (
              <div className="mt-1 pt-1 border-t border-gray-700">
                <div className="text-gray-300">
                  Shared with: {sharedWith.join(', ')}
                </div>
              </div>
            )}

            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}

      {/* Override Request Dialog */}
      {showOverrideDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Request Lock Override</h3>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                Request to override the {lockConfig.label.toLowerCase()} on this component.
              </p>
              <div className="text-sm text-gray-500">
                Component: <code className="bg-gray-100 px-1 rounded">{componentId}</code>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="override-reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for override:
              </label>
              <textarea
                id="override-reason"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Explain why you need to override this lock..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleOverrideSubmit}
                disabled={!overrideReason.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Request Override
              </button>
              <button
                onClick={() => {
                  setShowOverrideDialog(false);
                  setOverrideReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};