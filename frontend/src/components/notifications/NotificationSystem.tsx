import { FC, useEffect, useState } from 'react';
import { useLockStore } from '../../lib/store/lockStore';
import { useGlobalStore } from '../../lib/store';

interface NotificationProps {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
  autoClose?: boolean;
  duration?: number;
  onDismiss: (id: string) => void;
}

const NotificationItem: FC<NotificationProps> = ({
  id,
  type,
  title,
  message,
  timestamp,
  actions = [],
  autoClose = true,
  duration = 5000,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);

    // Auto-close if enabled
    if (autoClose) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(id);
    }, 300); // Match animation duration
  };

  const typeConfig = {
    info: {
      icon: 'ℹ️',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      titleColor: 'text-blue-900',
    },
    success: {
      icon: '✅',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      titleColor: 'text-green-900',
    },
    warning: {
      icon: '⚠️',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      titleColor: 'text-yellow-900',
    },
    error: {
      icon: '❌',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      titleColor: 'text-red-900',
    },
  };

  const config = typeConfig[type];

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <div
      className={`
        notification-item transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg
        max-w-sm w-full mb-3 overflow-hidden
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <span className="text-lg mr-3 mt-0.5">{config.icon}</span>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className={`font-medium ${config.titleColor} truncate`}>
                {title}
              </h4>
              <button
                onClick={handleDismiss}
                className={`ml-2 ${config.textColor} hover:opacity-70 transition-opacity`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className={`text-sm ${config.textColor} mb-2`}>
              {message}
            </p>
            
            <div className="flex items-center justify-between">
              <span className={`text-xs ${config.textColor} opacity-75`}>
                {formatTime(timestamp)}
              </span>
              
              {actions.length > 0 && (
                <div className="flex space-x-2">
                  {actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className={`
                        text-xs px-2 py-1 rounded transition-colors
                        ${action.style === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                          action.style === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' :
                          'bg-gray-200 text-gray-800 hover:bg-gray-300'}
                      `}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress bar for auto-close */}
      {autoClose && (
        <div className="h-1 bg-gray-200">
          <div
            className={`h-full bg-current ${config.textColor} transition-all ease-linear`}
            style={{
              width: '100%',
              animation: `shrink ${duration}ms linear`,
            }}
          />
        </div>
      )}
    </div>
  );
};

interface NotificationSystemProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxNotifications?: number;
}

export const NotificationSystem: FC<NotificationSystemProps> = ({
  position = 'top-right',
  maxNotifications = 5,
}) => {
  const { notifications, removeNotification } = useGlobalStore();
  const { errors } = useLockStore();
  const [lockNotifications, setLockNotifications] = useState<Array<any>>([]);

  // Convert lock errors to notifications
  useEffect(() => {
    const newLockNotifications = errors.map(error => ({
      id: `lock-error-${error.id}`,
      type: 'error' as const,
      title: 'Lock Operation Failed',
      message: error.message,
      timestamp: error.timestamp,
      actions: [
        {
          label: 'Retry',
          action: () => {
            // TODO: Implement retry logic
            console.log('Retrying failed operation');
          },
          style: 'primary' as const,
        },
        {
          label: 'Dismiss',
          action: () => {
            setLockNotifications(prev => prev.filter(n => n.id !== `lock-error-${error.id}`));
          },
          style: 'secondary' as const,
        }
      ],
      autoClose: false,
    }));

    setLockNotifications(newLockNotifications);
  }, [errors]);

  // Combine all notifications
  const allNotifications = [
    ...notifications.map(notif => ({
      ...notif,
      title: notif.type.charAt(0).toUpperCase() + notif.type.slice(1),
      onDismiss: removeNotification,
    })),
    ...lockNotifications.map(notif => ({
      ...notif,
      onDismiss: (id: string) => {
        setLockNotifications(prev => prev.filter(n => n.id !== id));
      },
    })),
  ];

  // Limit number of notifications
  const visibleNotifications = allNotifications.slice(0, maxNotifications);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <>
      {/* CSS for shrink animation */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      
      <div
        className={`
          fixed ${positionClasses[position]} z-50
          pointer-events-none flex flex-col
          ${position.includes('bottom') ? 'flex-col-reverse' : ''}
        `}
      >
        <div className="pointer-events-auto">
          {visibleNotifications.map((notification) => (
            <NotificationItem key={notification.id} {...notification} />
          ))}
        </div>
        
        {/* Overflow indicator */}
        {allNotifications.length > maxNotifications && (
          <div className="pointer-events-auto bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg mt-2">
            +{allNotifications.length - maxNotifications} more notifications
          </div>
        )}
      </div>
    </>
  );
};

// Hook for easier notification creation
export const useNotifications = () => {
  const { addNotification, removeNotification, clearNotifications } = useGlobalStore();
  const { addError } = useLockStore();

  const notifyLockUpdate = (componentId: string, lockType: string, userName?: string) => {
    addNotification('info', `${componentId} was ${lockType} ${userName ? `by ${userName}` : ''}`);
  };

  const notifyConflict = (componentId: string, conflictType: string) => {
    addNotification('warning', `Lock conflict on ${componentId}: ${conflictType}`);
  };

  const notifySuccess = (message: string) => {
    addNotification('success', message);
  };

  const notifyError = (message: string, componentId?: string) => {
    if (componentId) {
      addError({
        message,
        componentId,
        type: 'validation',
      });
    } else {
      addNotification('error', message);
    }
  };

  const notifyConnectionStatus = (status: 'connected' | 'disconnected' | 'reconnecting') => {
    const messages = {
      connected: 'Connected to server',
      disconnected: 'Disconnected from server',
      reconnecting: 'Reconnecting to server...',
    };

    const types = {
      connected: 'success' as const,
      disconnected: 'error' as const,
      reconnecting: 'warning' as const,
    };

    addNotification(types[status], messages[status]);
  };

  return {
    addNotification,
    notifyLockUpdate,
    notifyConflict,
    notifySuccess,
    notifyError,
    notifyConnectionStatus,
    removeNotification,
    clearNotifications,
  };
};