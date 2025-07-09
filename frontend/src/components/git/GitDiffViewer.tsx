'use client';

import React, { useState } from 'react';
import { GitCommit, ChevronDown, ChevronUp, Loader2, Eye, EyeOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useGitApi } from '@/hooks/useGitApi';
import { cn } from '@/lib/utils';

interface GitDiffViewerProps {
  projectId: string;
  baseRef: string;
  headRef: string;
  className?: string;
}

interface DiffStats {
  files_changed: number;
  insertions: number;
  deletions: number;
}

interface DiffStatsProps {
  stats: DiffStats;
}

function DiffStatsDisplay({ stats }: DiffStatsProps) {
  return (
    <div className="flex items-center gap-4 text-xs">
      <span className="text-gray-600">
        {stats.files_changed} file{stats.files_changed === 1 ? '' : 's'} changed
      </span>
      {stats.insertions > 0 && (
        <span className="text-green-600">
          +{stats.insertions} insertion{stats.insertions === 1 ? '' : 's'}
        </span>
      )}
      {stats.deletions > 0 && (
        <span className="text-red-600">
          -{stats.deletions} deletion{stats.deletions === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );
}

interface DiffLineProps {
  line: string;
  lineNumber?: number;
  type: 'added' | 'removed' | 'context' | 'header';
}

function DiffLine({ line, lineNumber, type }: DiffLineProps) {
  const getLineClasses = () => {
    switch (type) {
      case 'added':
        return 'bg-green-50 text-green-800 border-l-2 border-green-300';
      case 'removed':
        return 'bg-red-50 text-red-800 border-l-2 border-red-300';
      case 'context':
        return 'bg-gray-50 text-gray-700';
      case 'header':
        return 'bg-blue-50 text-blue-800 font-medium';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getPrefix = () => {
    switch (type) {
      case 'added':
        return '+';
      case 'removed':
        return '-';
      case 'context':
        return ' ';
      case 'header':
        return '@@';
      default:
        return ' ';
    }
  };

  return (
    <div className={cn('flex items-start text-xs font-mono', getLineClasses())}>
      <div className="w-8 text-right pr-2 text-gray-500 select-none">
        {lineNumber}
      </div>
      <div className="w-4 text-center text-gray-500 select-none">
        {getPrefix()}
      </div>
      <div className="flex-1 pl-2 pr-4 whitespace-pre-wrap break-all">
        {line}
      </div>
    </div>
  );
}

interface DiffPanelProps {
  diff: string;
  showContext: boolean;
}

function DiffPanel({ diff, showContext }: DiffPanelProps) {
  const parseDiff = (diffText: string) => {
    const lines = diffText.split('\n');
    const parsedLines: { content: string; type: DiffLineProps['type']; lineNumber?: number }[] = [];
    
    let currentLineNumber = 1;
    
    lines.forEach((line, index) => {
      if (line.startsWith('@@')) {
        // Header line
        parsedLines.push({
          content: line,
          type: 'header'
        });
        
        // Extract line numbers from header
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
        if (match) {
          currentLineNumber = parseInt(match[2]);
        }
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        // Added line
        parsedLines.push({
          content: line.slice(1),
          type: 'added',
          lineNumber: currentLineNumber++
        });
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        // Removed line
        parsedLines.push({
          content: line.slice(1),
          type: 'removed'
        });
      } else if (line.startsWith(' ')) {
        // Context line
        if (showContext) {
          parsedLines.push({
            content: line.slice(1),
            type: 'context',
            lineNumber: currentLineNumber++
          });
        }
      } else if (line.startsWith('diff --git') || line.startsWith('index ') || line.startsWith('+++') || line.startsWith('---')) {
        // Skip git diff headers
      } else if (line.trim() && !line.startsWith('\\')) {
        // Other content
        parsedLines.push({
          content: line,
          type: 'context',
          lineNumber: currentLineNumber++
        });
      }
    });
    
    return parsedLines;
  };

  const parsedLines = parseDiff(diff);

  if (parsedLines.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No differences found
      </div>
    );
  }

  return (
    <div className="bg-white border rounded overflow-hidden">
      <div className="max-h-96 overflow-y-auto">
        {parsedLines.map((line, index) => (
          <DiffLine
            key={index}
            line={line.content}
            lineNumber={line.lineNumber}
            type={line.type}
          />
        ))}
      </div>
    </div>
  );
}

interface ContextToggleProps {
  showContext: boolean;
  onToggle: () => void;
}

function ContextToggle({ showContext, onToggle }: ContextToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border rounded"
    >
      {showContext ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
      {showContext ? 'Hide' : 'Show'} Context
    </button>
  );
}

export function GitDiffViewer({ projectId, baseRef, headRef, className }: GitDiffViewerProps) {
  const [showContext, setShowContext] = useState(true);
  const gitApi = useGitApi();
  
  const { data: diffData, isLoading, error } = useQuery({
    queryKey: ['git', 'diff', projectId, baseRef, headRef],
    queryFn: () => gitApi.getGitDiff(projectId, baseRef, headRef),
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm text-gray-600">Loading diff...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4 text-center', className)}>
        <div className="text-red-600 text-sm mb-2">Failed to load diff</div>
        <p className="text-xs text-gray-500">{error.message}</p>
      </div>
    );
  }

  if (!diffData) {
    return (
      <div className={cn('p-4 text-center text-gray-500 text-sm', className)}>
        No diff data available
      </div>
    );
  }

  if (!diffData.diff || diffData.diff.trim() === '') {
    return (
      <div className={cn('p-4 text-center text-gray-500 text-sm', className)}>
        <GitCommit className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <div>No differences found</div>
        <div className="text-xs mt-1">
          {baseRef} and {headRef} are identical
        </div>
      </div>
    );
  }

  return (
    <div className={cn('git-diff-viewer', className)}>
      <div className="border rounded-lg bg-white">
        <div className="border-b p-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm flex items-center gap-2">
                <GitCommit className="w-4 h-4" />
                Diff View
              </h3>
              <div className="text-xs text-gray-500 mt-1">
                {baseRef} → {headRef}
              </div>
            </div>
            <ContextToggle showContext={showContext} onToggle={() => setShowContext(!showContext)} />
          </div>
          
          <div className="mt-2">
            <DiffStatsDisplay stats={diffData.stats} />
          </div>
          
          {diffData.files_changed.length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-medium text-gray-700 mb-1">Changed Files:</div>
              <div className="flex flex-wrap gap-1">
                {diffData.files_changed.map((file, index) => (
                  <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {file}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-3">
          <DiffPanel diff={diffData.diff} showContext={showContext} />
        </div>
      </div>
    </div>
  );
}