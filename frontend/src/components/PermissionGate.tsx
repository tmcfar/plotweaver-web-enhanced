import { FC, ReactNode } from 'react';
import { useWritingModeStore } from '../lib/store/writingModeStore';

interface PermissionGateProps {
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionGate: FC<PermissionGateProps> = ({
  action,
  children,
  fallback
}) => {
  const { checkPermission } = useWritingModeStore();

  if (!checkPermission(action)) {
    return fallback as JSX.Element || null;
  }

  return <>{children}</>;
};
