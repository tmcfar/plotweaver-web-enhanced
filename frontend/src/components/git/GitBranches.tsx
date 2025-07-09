'use client';

import React, { useState } from 'react';
import { GitBranch, Check, Plus, ArrowRightLeft, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useGitApi } from '@/hooks/useGitApi';
import { Branch } from '@/types/git';
import { cn } from '@/lib/utils';

interface GitBranchesProps {
  projectId: string;
  className?: string;
}

interface BranchCardProps {
  branch: Branch;
  isLocal: boolean;
  isCurrent: boolean;
  onSwitch?: (branchName: string) => void;
}

function BranchCard({ branch, isLocal, isCurrent, onSwitch }: BranchCardProps) {
  return (
    <div 
      className={cn(
        'flex items-center justify-between p-2 rounded border transition-colors',
        isCurrent ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
      )}
      role="option"
      aria-selected={isCurrent}
      aria-label={`${isLocal ? 'Local' : 'Remote'} branch: ${branch.name}${isCurrent ? ' (current)' : ''}`}
    >
      <div className="flex items-center gap-2">
        <GitBranch className={cn(
          'w-4 h-4',
          isCurrent ? 'text-blue-600' : 'text-gray-600'
        )} 
        aria-hidden="true" />
        <span className={cn(
          'text-sm font-medium',
          isCurrent ? 'text-blue-900' : 'text-gray-900'
        )}>
          {branch.name}
        </span>
        {isCurrent && (
          <Check className="w-3 h-3 text-blue-600" aria-label="Current branch" />
        )}
        {!isLocal && (
          <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded" aria-label="Remote branch">
            remote
          </span>
        )}
      </div>
      
      {!isCurrent && isLocal && onSwitch && (
        <button
          onClick={() => onSwitch(branch.name)}
          className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={`Switch to ${branch.name} branch`}
        >
          Switch
        </button>
      )}
    </div>
  );
}

interface BranchActionsProps {
  onCreateBranch: () => void;
  onMerge: () => void;
  disabled?: boolean;
}

function BranchActions({ onCreateBranch, onMerge, disabled }: BranchActionsProps) {
  return (
    <div className="flex items-center gap-2 p-2 border-t">
      <button
        onClick={onCreateBranch}
        disabled={disabled}
        className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="w-3 h-3" />
        New Branch
      </button>
      
      <button
        onClick={onMerge}
        disabled={disabled}
        className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:text-green-800 border border-green-200 hover:border-green-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowRightLeft className="w-3 h-3" />
        Merge
      </button>
    </div>
  );
}

interface CreateBranchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (branchName: string) => void;
}

function CreateBranchDialog({ isOpen, onClose, onConfirm }: CreateBranchDialogProps) {
  const [branchName, setBranchName] = useState('');
  
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (branchName.trim()) {
      onConfirm(branchName.trim());
      setBranchName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg border shadow-lg max-w-md w-full mx-4">
        <h3 className="font-medium text-sm mb-3">Create New Branch</h3>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="Branch name"
            className="w-full p-2 text-sm border rounded mb-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!branchName.trim()}
              className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function GitBranches({ projectId, className }: GitBranchesProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const gitApi = useGitApi();
  
  const { data: branches, isLoading, error } = useQuery({
    queryKey: ['git', 'branches', projectId],
    queryFn: () => gitApi.getProjectBranches(projectId),
    refetchInterval: 30000, // Poll every 30 seconds
    retry: 2,
  });

  const handleSwitchBranch = (branchName: string) => {
    console.log('Switch to branch:', branchName);
    // TODO: Implement branch switching
  };

  const handleCreateBranch = (branchName: string) => {
    console.log('Create branch:', branchName);
    // TODO: Implement branch creation
  };

  const handleMerge = () => {
    console.log('Merge branch');
    // TODO: Implement branch merging
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-4', className)}>
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm text-gray-600">Loading branches...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4 text-center', className)}>
        <div className="text-red-600 text-sm mb-2">Failed to load branches</div>
        <p className="text-xs text-gray-500">{error.message}</p>
      </div>
    );
  }

  if (!branches) {
    return (
      <div className={cn('p-4 text-center text-gray-500 text-sm', className)}>
        No branch information available
      </div>
    );
  }

  return (
    <>
      <div className={cn('git-branches border rounded-lg bg-white', className)}>
        <div className="border-b p-3">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Branches
          </h3>
          <div className="text-xs text-gray-500 mt-1">
            Current: {branches.current_branch}
          </div>
        </div>
        
        <div className="max-h-64 overflow-y-auto">
          {branches.local_branches.length > 0 && (
            <div className="p-3">
              <div className="text-xs font-medium text-gray-700 mb-2">Local Branches</div>
              <div className="space-y-1">
                {branches.local_branches.map((branch) => (
                  <BranchCard
                    key={branch.name}
                    branch={branch}
                    isLocal={true}
                    isCurrent={branch.name === branches.current_branch}
                    onSwitch={handleSwitchBranch}
                  />
                ))}
              </div>
            </div>
          )}
          
          {branches.remote_branches.length > 0 && (
            <div className="p-3 border-t">
              <div className="text-xs font-medium text-gray-700 mb-2">Remote Branches</div>
              <div className="space-y-1">
                {branches.remote_branches.map((branch) => (
                  <BranchCard
                    key={branch.name}
                    branch={branch}
                    isLocal={false}
                    isCurrent={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        <BranchActions
          onCreateBranch={() => setShowCreateDialog(true)}
          onMerge={handleMerge}
          disabled={isLoading}
        />
      </div>
      
      <CreateBranchDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onConfirm={handleCreateBranch}
      />
    </>
  );
}