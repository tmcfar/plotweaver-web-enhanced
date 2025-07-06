import { FC, ReactNode } from 'react';
import { Lock } from 'lucide-react';

interface LockedMessageProps {
  children: ReactNode;
}

export const LockedMessage: FC<LockedMessageProps> = ({ children }) => {
  return (
    <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
      <Lock className="w-4 h-4 text-gray-400 mr-2" />
      <span className="text-sm text-gray-600">{children}</span>
    </div>
  );
};
