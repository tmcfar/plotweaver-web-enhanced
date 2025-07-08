'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { File, Folder, GitCommit, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { gitApi, TreeItem } from '@/lib/api/git';
import { cn } from '@/lib/utils';

interface GitFileTreeProps {
  projectId: string;
  onFileSelect: (path: string) => void;
  selectedPath?: string;
  className?: string;
}

interface ExpandedState {
  [path: string]: boolean;
}

export function GitFileTree({ 
  projectId, 
  onFileSelect, 
  selectedPath, 
  className 
}: GitFileTreeProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({ '': true });
  
  const { data: rootTree, isLoading, error } = useQuery({
    queryKey: ['git', 'tree', projectId, ''],
    queryFn: () => gitApi.getTree(projectId, ''),
    refetchInterval: 30000, // Poll every 30s for updates
    retry: 2,
  });

  const { data: expandedTrees } = useQuery({
    queryKey: ['git', 'trees', projectId, Object.keys(expanded).filter(path => expanded[path] && path !== '')],
    queryFn: async () => {
      const expandedPaths = Object.keys(expanded).filter(path => expanded[path] && path !== '');
      const trees = await Promise.all(
        expandedPaths.map(async path => ({
          path,
          items: await gitApi.getTree(projectId, path)
        }))
      );
      return trees.reduce((acc, { path, items }) => {
        acc[path] = items;
        return acc;
      }, {} as Record<string, TreeItem[]>);
    },
    enabled: Object.values(expanded).some(Boolean),
  });

  const toggleExpanded = (path: string) => {
    setExpanded(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const renderTreeItem = (item: TreeItem, depth = 0) => {
    const isExpanded = expanded[item.path] || false;
    const isSelected = selectedPath === item.path;
    const Icon = item.type === 'directory' ? Folder : File;
    const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

    return (
      <div key={item.path} className="select-none">
        <div
          className={cn(
            'flex items-center gap-2 p-1 hover:bg-gray-100 cursor-pointer rounded-sm text-sm',
            isSelected && 'bg-blue-100 text-blue-800',
            'transition-colors duration-150'
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (item.type === 'directory') {
              toggleExpanded(item.path);
            } else {
              onFileSelect(item.path);
            }
          }}
        >
          {item.type === 'directory' && (
            <ChevronIcon className="w-3 h-3 text-gray-500" />
          )}
          <Icon className={cn(
            'w-4 h-4',
            item.type === 'directory' ? 'text-blue-600' : 'text-gray-600'
          )} />
          <span className="flex-1 truncate">{item.name}</span>
          {item.type === 'file' && item.size && (
            <span className="text-xs text-gray-400">
              {formatFileSize(item.size)}
            </span>
          )}
          <GitCommit className="w-3 h-3 text-gray-400 opacity-50" />
        </div>

        {/* Render children for expanded directories */}
        {item.type === 'directory' && isExpanded && expandedTrees?.[item.path] && (
          <div>
            {expandedTrees[item.path].map(childItem => 
              renderTreeItem(childItem, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-4', className)}>
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm text-gray-600">Loading project files...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4 text-center', className)}>
        <div className="text-red-600 text-sm mb-2">Failed to load project files</div>
        <button 
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:text-blue-800 text-sm underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!rootTree || rootTree.length === 0) {
    return (
      <div className={cn('p-4 text-center text-gray-500 text-sm', className)}>
        <Folder className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <div>No files found in this project</div>
        <div className="text-xs mt-1">Check if the git repository exists</div>
      </div>
    );
  }

  return (
    <div className={cn('git-file-tree overflow-y-auto', className)}>
      <div className="p-2">
        <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
          <GitCommit className="w-3 h-3" />
          Project Files
        </div>
        {rootTree.map(item => renderTreeItem(item))}
      </div>
    </div>
  );
}