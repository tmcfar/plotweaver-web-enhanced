'use client';

import React, { useState } from 'react';
import { GitBranch, ArrowUp, ArrowDown, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useGitApi } from '@/hooks/useGitApi';
import { cn } from '@/lib/utils';

interface GitStatusProps {
  projectId: string;
  className?: string;
}

interface StatusBadgeProps {
  status: 'clean' | 'dirty' | 'ahead' | 'behind' | 'diverged';
  className?: string;
}

function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = {
    clean: {
      icon: CheckCircle,
      text: 'Clean',
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    dirty: {
      icon: AlertCircle,
      text: 'Modified',
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
    },
    ahead: {
      icon: ArrowUp,
      text: 'Ahead',
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    behind: {
      icon: ArrowDown,
      text: 'Behind',
      color: 'text-red-600 bg-red-50 border-red-200'
    },
    diverged: {
      icon: AlertCircle,
      text: 'Diverged',
      color: 'text-orange-600 bg-orange-50 border-orange-200'
    }
  };

  const { icon: Icon, text, color } = config[status];

  return (
    <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full border text-xs', color, className)}>
      <Icon className="w-3 h-3" />
      <span>{text}</span>
    </div>
  );
}

interface BranchSelectorProps {
  currentBranch: string;
}

function BranchSelector({ currentBranch }: BranchSelectorProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
      <GitBranch className="w-4 h-4 text-gray-600" />
      <span className="text-sm font-medium">{currentBranch}</span>
    </div>
  );
}

interface ChangesListProps {
  modifiedFiles: string[];
  stagedFiles: string[];
  untrackedFiles: string[];
}

function ChangesList({ modifiedFiles, stagedFiles, untrackedFiles }: ChangesListProps) {
  const allFiles = [
    ...modifiedFiles.map(f => ({ path: f, status: 'modified' as const })),
    ...stagedFiles.map(f => ({ path: f, status: 'staged' as const })),
    ...untrackedFiles.map(f => ({ path: f, status: 'untracked' as const }))
  ];

  if (allFiles.length === 0) {
    return (
      <div className="text-sm text-gray-500 p-3 text-center">
        No changes detected
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'modified': return 'text-yellow-600';
      case 'staged': return 'text-green-600';
      case 'untracked': return 'text-gray-500';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'modified': return 'M';
      case 'staged': return 'A';
      case 'untracked': return '?';
      default: return '';
    }
  };

  return (
    <div className="max-h-40 overflow-y-auto">
      <div className="p-2 space-y-1">
        {allFiles.map((file, index) => (
          <div key={index} className="flex items-center gap-2 p-1 rounded hover:bg-gray-50">
            <span className={cn('text-xs font-mono w-4', getStatusColor(file.status))}>
              {getStatusText(file.status)}
            </span>
            <FileText className="w-3 h-3 text-gray-500" />
            <span className="text-sm font-mono flex-1 truncate">{file.path}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SyncIndicatorProps {
  aheadBy: number;
  behindBy: number;
  hasRemote: boolean;
}

function SyncIndicator({ aheadBy, behindBy, hasRemote }: SyncIndicatorProps) {
  if (!hasRemote) {
    return (
      <div className="text-xs text-gray-500 p-2 text-center">
        No remote repository
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4 p-2 bg-gray-50 rounded">
      {aheadBy > 0 && (
        <div className="flex items-center gap-1 text-xs text-blue-600">
          <ArrowUp className="w-3 h-3" />
          <span>{aheadBy}</span>
        </div>
      )}
      {behindBy > 0 && (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <ArrowDown className="w-3 h-3" />
          <span>{behindBy}</span>
        </div>
      )}
      {aheadBy === 0 && behindBy === 0 && (
        <div className="text-xs text-green-600">
          <CheckCircle className="w-3 h-3 inline mr-1" />
          In sync
        </div>
      )}
    </div>
  );
}

export function GitStatus({ projectId, className }: GitStatusProps) {
  const gitApi = useGitApi();
  
  const { data: status, isLoading, error } = useQuery({
    queryKey: ['git', 'status', projectId],
    queryFn: () => gitApi.getRepositoryStatus(projectId),
    refetchInterval: 10000, // Poll every 10 seconds
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-4', className)}>
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm text-gray-600">Loading status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4 text-center', className)}>
        <div className="text-red-600 text-sm mb-2">Failed to load status</div>
        <p className="text-xs text-gray-500">{error.message}</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className={cn('p-4 text-center text-gray-500 text-sm', className)}>
        No status information available
      </div>
    );
  }

  const getOverallStatus = () => {
    if (!status.is_clean) return 'dirty';
    if (status.ahead_by > 0 && status.behind_by > 0) return 'diverged';
    if (status.ahead_by > 0) return 'ahead';
    if (status.behind_by > 0) return 'behind';
    return 'clean';
  };

  return (
    <div className={cn('git-status border rounded-lg bg-white', className)}>
      <div className="border-b p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">Repository Status</h3>
          <StatusBadge status={getOverallStatus()} />
        </div>
      </div>
      
      <div className="p-3 space-y-3">
        <BranchSelector currentBranch={status.current_branch} />
        
        <SyncIndicator 
          aheadBy={status.ahead_by} 
          behindBy={status.behind_by} 
          hasRemote={status.has_remote}
        />
        
        <div className="border-t pt-3">
          <div className="text-sm font-medium mb-2">Changes</div>
          <ChangesList 
            modifiedFiles={status.modified_files}
            stagedFiles={status.staged_files}
            untrackedFiles={status.untracked_files}
          />
        </div>
      </div>
    </div>
  );
}