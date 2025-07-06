import { FC } from 'react';
import { Lock, ShieldAlert, ShieldOff } from 'lucide-react';
import { LockLevel } from '../../hooks/useLockStore';

interface LockIndicatorProps {
  level: LockLevel;
}

export const LockIndicator: FC<LockIndicatorProps> = ({ level }) => {
  const icon = {
    soft: <ShieldOff className="w-4 h-4 text-yellow-500" />,
    hard: <ShieldAlert className="w-4 h-4 text-orange-500" />,
    frozen: <Lock className="w-4 h-4 text-red-500" />
  }[level];

  return (
    <div className="lock-indicator" title={`Lock level: ${level}`}>
      {icon}
    </div>
  );
};
