'use client';

import React, { useState } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';

interface ConflictDiff {
  field: string;
  local: any;
  remote: any;
}

export function ConflictResolver() {
  const { conflicts, resolveConflict } = useOfflineSync();
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null);
  const [resolution, setResolution] = useState<'local' | 'remote' | 'merge'>('local');
  const [mergedData, setMergedData] = useState<any>({});

  const currentConflict = conflicts.find(c => c.id === selectedConflict);

  const getDifferences = (local: any, remote: any): ConflictDiff[] => {
    const diffs: ConflictDiff[] = [];
    const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);

    allKeys.forEach(key => {
      if (JSON.stringify(local[key]) !== JSON.stringify(remote[key])) {
        diffs.push({
          field: key,
          local: local[key],
          remote: remote[key],
        });
      }
    });

    return diffs;
  };

  const handleResolve = async () => {
    if (!currentConflict) return;

    await resolveConflict(currentConflict.id, {
      strategy: resolution,
      resolver: resolution === 'merge' ? () => mergedData : undefined,
    });

    setSelectedConflict(null);
    setResolution('local');
    setMergedData({});
  };

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <>
      {/* Conflict notification badge */}
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setSelectedConflict(conflicts[0]?.id)}
          className="shadow-lg"
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          {conflicts.length} sync {conflicts.length === 1 ? 'conflict' : 'conflicts'}
        </Button>
      </div>

      {/* Conflict resolution dialog */}
      <Dialog open={!!selectedConflict} onOpenChange={(open) => !open && setSelectedConflict(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resolve Sync Conflict</DialogTitle>
            <DialogDescription>
              Changes were made both locally and on the server. Choose how to resolve this conflict.
            </DialogDescription>
          </DialogHeader>

          {currentConflict && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">
                  {currentConflict.type} {currentConflict.entity}
                </p>
                <p className="text-xs text-muted-foreground">
                  Local change: {new Date(currentConflict.timestamp).toLocaleString()}
                </p>
              </div>

              <RadioGroup value={resolution} onValueChange={(value: any) => setResolution(value)}>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="local" id="local" />
                    <Label htmlFor="local" className="cursor-pointer">
                      <span className="font-medium">Keep local changes</span>
                      <p className="text-sm text-muted-foreground">
                        Use your offline changes and discard server changes
                      </p>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="remote" id="remote" />
                    <Label htmlFor="remote" className="cursor-pointer">
                      <span className="font-medium">Keep server changes</span>
                      <p className="text-sm text-muted-foreground">
                        Use server changes and discard your offline changes
                      </p>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="merge" id="merge" />
                    <Label htmlFor="merge" className="cursor-pointer">
                      <span className="font-medium">Merge changes</span>
                      <p className="text-sm text-muted-foreground">
                        Manually select which changes to keep
                      </p>
                    </Label>
                  </div>
                </div>
              </RadioGroup>

              {/* Show differences */}
              <ScrollArea className="h-64 rounded-lg border p-4">
                <h4 className="mb-3 text-sm font-medium">Differences:</h4>
                {getDifferences(currentConflict.data, currentConflict.remoteData).map((diff) => (
                  <div key={diff.field} className="mb-4 space-y-2">
                    <p className="text-sm font-medium">{diff.field}:</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={cn(
                          'rounded border p-2',
                          resolution === 'local' && 'border-primary bg-primary/5'
                        )}
                      >
                        <p className="text-xs font-medium text-muted-foreground mb-1">Local</p>
                        <pre className="text-xs">{JSON.stringify(diff.local, null, 2)}</pre>
                      </div>
                      <div
                        className={cn(
                          'rounded border p-2',
                          resolution === 'remote' && 'border-primary bg-primary/5'
                        )}
                      >
                        <p className="text-xs font-medium text-muted-foreground mb-1">Server</p>
                        <pre className="text-xs">{JSON.stringify(diff.remote, null, 2)}</pre>
                      </div>
                    </div>
                    {resolution === 'merge' && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="xs"
                          variant={mergedData[diff.field] === diff.local ? 'default' : 'outline'}
                          onClick={() => setMergedData(prev => ({ ...prev, [diff.field]: diff.local }))}
                        >
                          Use Local
                        </Button>
                        <Button
                          size="xs"
                          variant={mergedData[diff.field] === diff.remote ? 'default' : 'outline'}
                          onClick={() => setMergedData(prev => ({ ...prev, [diff.field]: diff.remote }))}
                        >
                          Use Server
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedConflict(null)}>
              Cancel
            </Button>
            <Button onClick={handleResolve}>
              <Check className="mr-2 h-4 w-4" />
              Apply Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
