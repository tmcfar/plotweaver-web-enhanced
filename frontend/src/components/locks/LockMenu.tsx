import { FC, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { LockLevel, ComponentLock } from '../../lib/api/locks';
import { useLockStore } from '../../lib/store/lockStore';
import { LockIndicator } from './LockIndicator';
import { LockReasonDialog } from './LockReasonDialog';

interface LockMenuProps {
  componentId: string;
  currentLock?: ComponentLock;
  onLockChange?: () => void;
}

export const LockMenu: FC<LockMenuProps> = ({
  componentId,
  currentLock,
  onLockChange
}) => {
  const { lockComponent, unlockComponent } = useLockStore();
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<LockLevel>();
  const [showMenu, setShowMenu] = useState(false);

  const handleLock = (level: LockLevel) => {
    setSelectedLevel(level);
    setShowMenu(false);
    setShowReasonDialog(true);
  };

  const handleUnlock = async () => {
    try {
      await unlockComponent(componentId);
      onLockChange?.();
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div className="lock-menu relative inline-block">
      <button
        className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-100"
        onClick={() => setShowMenu(!showMenu)}
        aria-label="Lock menu"
      >
        <LockIndicator 
          componentId={componentId}
          lockLevel={currentLock?.level} 
          showDetails={false}
          size="sm"
          interactive={false}
        />
        <ChevronDown className="w-4 h-4" />
      </button>

      {/* Lock Menu */}
      <div
        className={`absolute z-10 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 ${!showMenu ? 'hidden' : ''}`}
      >
        <div className="py-1">
          <button
            className="flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => handleLock('soft')}
            aria-label="Soft Lock"
          >
            <span className="mr-2">🔐</span>
            Soft Lock (AI suggestions only)
          </button>
          <button
            className="flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => handleLock('hard')}
            aria-label="Hard Lock"
          >
            <span className="mr-2">🔒</span>
            Hard Lock (Confirm edits)
          </button>
          <button
            className="flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => handleLock('frozen')}
            aria-label="Freeze"
          >
            <span className="mr-2">🧯</span>
            Freeze (No changes)
          </button>
          {currentLock && (
            <div className="border-t border-gray-100">
              <button
                className="flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100"
                onClick={handleUnlock}
              >
                <span className="mr-2">🔓</span>
                Unlock
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lock Reason Dialog */}
      {showReasonDialog && selectedLevel && (
        <LockReasonDialog
          onConfirm={async (reason) => {
            try {
              await lockComponent(componentId, selectedLevel, reason);
              onLockChange?.();
            } catch {
              // Error is handled by the store
            }
            setShowReasonDialog(false);
          }}
          onCancel={() => setShowReasonDialog(false)}
        />
      )}
    </div>
  );
};
