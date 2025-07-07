import React from 'react';
import { WifiOff, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function OfflineIndicator() {
  const { isOnline, pendingChanges, isSyncing, syncPendingChanges, changeCount } = useOfflineSync();

  if (isOnline && changeCount === 0) {
    // Everything is synced and online
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 shadow-lg transition-all',
                isOnline
                  ? 'bg-yellow-500/10 border border-yellow-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
              )}
            >
              {!isOnline ? (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-500">Offline</span>
                </>
              ) : (
                <>
                  <CloudOff className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-500">
                    {changeCount} unsaved {changeCount === 1 ? 'change' : 'changes'}
                  </span>
                </>
              )}

              {isOnline && changeCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={syncPendingChanges}
                  disabled={isSyncing}
                  className="h-6 px-2"
                >
                  {isSyncing ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Cloud className="h-3 w-3" />
                  )}
                  <span className="ml-1">{isSyncing ? 'Syncing...' : 'Sync'}</span>
                </Button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-semibold">
                {isOnline ? 'Changes pending sync' : 'Working offline'}
              </p>
              {!isOnline && (
                <p className="text-sm text-muted-foreground">
                  Your changes will sync when you reconnect
                </p>
              )}
              {changeCount > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium">Pending changes:</p>
                  {pendingChanges.slice(0, 3).map((change) => (
                    <div key={change.id} className="text-xs text-muted-foreground">
                      • {change.type} {change.entity} ({new Date(change.timestamp).toLocaleTimeString()})
                    </div>
                  ))}
                  {changeCount > 3 && (
                    <p className="text-xs text-muted-foreground">
                      ...and {changeCount - 3} more
                    </p>
                  )}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
