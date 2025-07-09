'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { File, Folder, GitCommit, ChevronRight, ChevronDown, Loader2, Search } from 'lucide-react';
import { gitApi, TreeItem } from '@/lib/api/git';
import { useProjectTree } from '@/hooks/useGitApi';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { DirectoryNode } from '@/types/git';
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
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { tree, loading, error } = useProjectTree(projectId, '');

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

  const renderTreeItem = (item: DirectoryNode | TreeItem, depth = 0) => {
    const isExpanded = expanded[item.path] || false;
    const isSelected = selectedPath === item.path;
    const Icon = item.type === 'directory' ? Folder : File;
    const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

    // Filter search if applicable
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return null;
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (item.type === 'directory') {
            toggleExpanded(item.path);
          } else {
            onFileSelect(item.path);
          }
          break;
        case 'ArrowRight':
          if (item.type === 'directory' && !isExpanded) {
            e.preventDefault();
            toggleExpanded(item.path);
          }
          break;
        case 'ArrowLeft':
          if (item.type === 'directory' && isExpanded) {
            e.preventDefault();
            toggleExpanded(item.path);
          }
          break;
      }
    };

    return (
      <div key={item.path} className="select-none">
        <div
          role={item.type === 'directory' ? 'treeitem' : 'option'}
          tabIndex={0}
          aria-selected={isSelected}
          aria-expanded={item.type === 'directory' ? isExpanded : undefined}
          aria-label={`${item.type === 'directory' ? 'Folder' : 'File'}: ${item.name}${item.size ? `, ${formatFileSize(item.size)}` : ''}`}
          aria-level={depth + 1}
          className={cn(
            'flex items-center gap-2 p-1 hover:bg-gray-100 cursor-pointer rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
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
          onKeyDown={handleKeyDown}
        >
          {item.type === 'directory' && (
            <ChevronIcon 
              className="w-3 h-3 text-gray-500" 
              aria-hidden="true"
            />
          )}
          <Icon className={cn(
            'w-4 h-4',
            item.type === 'directory' ? 'text-blue-600' : 'text-gray-600'
          )} 
          aria-hidden="true" />
          <span className="flex-1 truncate">{item.name}</span>
          {item.type === 'file' && item.size && (
            <span className="text-xs text-gray-400" aria-hidden="true">
              {formatFileSize(item.size)}
            </span>
          )}
          <GitCommit className="w-3 h-3 text-gray-400 opacity-50" aria-hidden="true" />
        </div>

        {/* Render children for expanded directories */}
        {item.type === 'directory' && isExpanded && expandedTrees?.[item.path] && (
          <div role="group" aria-label={`Contents of ${item.name}`}>
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

  if (loading) {
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

  if (!tree || !tree.tree || tree.tree.length === 0) {
    return (
      <div className={cn('p-4 text-center text-gray-500 text-sm', className)}>
        <Folder className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <div>No files found in this project</div>
        <div className="text-xs mt-1">Check if the git repository exists</div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn('git-file-tree overflow-y-auto', className)}
      role="application"
      aria-label="Git file tree"
    >
      <div className="p-2">
        <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
          <GitCommit className="w-3 h-3" aria-hidden="true" />
          Project Files
        </div>
        
        {/* Search bar */}
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-3 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Search files in project"
            aria-describedby="search-description"
          />
          <div id="search-description" className="sr-only">
            Type to filter files and folders in the project tree
          </div>
        </div>

        {/* Breadcrumb navigation */}
        {tree.path && (
          <nav aria-label="Current directory path" className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <span>/</span>
            <span>{tree.path}</span>
          </nav>
        )}

        <div 
          role="tree" 
          aria-label="Project files and folders"
          aria-multiselectable="false"
          className="focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 rounded"
        >
          {tree.tree.map(item => renderTreeItem(item))}
        </div>
        
        {/* Screen reader announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {searchTerm && tree.tree.length === 0 && `No files found matching "${searchTerm}"`}
          {searchTerm && tree.tree.length > 0 && `${tree.tree.length} file${tree.tree.length === 1 ? '' : 's'} found matching "${searchTerm}"`}
        </div>
      </div>
    </div>
  );
}