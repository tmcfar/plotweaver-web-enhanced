'use client';

import React, { useState } from 'react';
import { GitCommit, User, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useFileHistory } from '@/hooks/useGitApi';
import { CommitInfo } from '@/types/git';
import { cn } from '@/lib/utils';

interface GitHistoryProps {
  projectId: string;
  filePath: string;
  className?: string;
}

interface CommitCardProps {
  commit: CommitInfo;
  isSelected?: boolean;
  onClick?: () => void;
}

function CommitCard({ commit, isSelected, onClick }: CommitCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  };

  return (
    <div 
      className={cn(
        'p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50',
        isSelected && 'border-blue-500 bg-blue-50'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-gray-900">
              {commit.author_name}
            </span>
            <span className="text-xs text-gray-500">
              {getRelativeTime(commit.date)}
            </span>
          </div>
          
          <div className="text-sm text-gray-700 mb-2">
            {commit.message}
          </div>
          
          {commit.body && (
            <div className="text-xs text-gray-600 mb-2">
              {commit.body.split('\n').slice(0, 3).map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <GitCommit className="w-3 h-3" />
            <span className="font-mono">{commit.hash.slice(0, 7)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PaginationControlsProps {
  currentPage: number;
  totalCommits: number;
  limit: number;
  onPageChange: (page: number) => void;
}

function PaginationControls({ currentPage, totalCommits, limit, onPageChange }: PaginationControlsProps) {
  const totalPages = Math.ceil(totalCommits / limit);
  const hasMore = currentPage < totalPages - 1;
  const hasPrevious = currentPage > 0;

  return (
    <div className="flex items-center justify-between p-3 border-t">
      <div className="text-xs text-gray-500">
        Showing {currentPage * limit + 1}-{Math.min((currentPage + 1) * limit, totalCommits)} of {totalCommits}
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevious}
          className="flex items-center gap-1 px-2 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <ChevronLeft className="w-3 h-3" />
          Previous
        </button>
        
        <span className="text-xs text-gray-500">
          Page {currentPage + 1} of {totalPages}
        </span>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasMore}
          className="flex items-center gap-1 px-2 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export function GitHistory({ projectId, filePath, className }: GitHistoryProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const limit = 10;
  
  const { history, loading, error } = useFileHistory(projectId, filePath, {
    limit,
    skip: currentPage * limit
  });

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm text-gray-600">Loading history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4 text-center', className)}>
        <div className="text-red-600 text-sm mb-2">Failed to load history</div>
        <p className="text-xs text-gray-500">{error}</p>
      </div>
    );
  }

  if (!history || history.history.length === 0) {
    return (
      <div className={cn('p-4 text-center text-gray-500 text-sm', className)}>
        <GitCommit className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <div>No commit history found</div>
        <div className="text-xs mt-1">This file may be new or not tracked</div>
      </div>
    );
  }

  return (
    <div className={cn('git-history border rounded-lg bg-white', className)}>
      <div className="border-b p-3">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <GitCommit className="w-4 h-4" />
          Commit History
        </h3>
        <div className="text-xs text-gray-500 mt-1">
          {filePath}
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        <div className="p-3 space-y-3">
          {history.history.map((commit) => (
            <CommitCard
              key={commit.hash}
              commit={commit}
              isSelected={selectedCommit === commit.hash}
              onClick={() => setSelectedCommit(
                selectedCommit === commit.hash ? null : commit.hash
              )}
            />
          ))}
        </div>
      </div>
      
      {history.pagination.total > limit && (
        <PaginationControls
          currentPage={currentPage}
          totalCommits={history.pagination.total}
          limit={limit}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}