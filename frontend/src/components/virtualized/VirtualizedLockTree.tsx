// src/components/virtualized/VirtualizedLockTree.tsx
'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Lock, Folder, FolderOpen, File, Search, Filter, ChevronRight } from 'lucide-react';
import { useLockStore } from '../../hooks/useLockStore';

interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: TreeNode[];
  isOpen?: boolean;
  depth: number;
  parent?: string;
  size?: number;
  lastModified?: Date;
}

interface FlattenedNode extends TreeNode {
  index: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

interface VirtualizedLockTreeProps {
  projectId: string;
  height: number;
  itemHeight: number;
  onItemSelect: (itemId: string) => void;
  onItemLock: (itemId: string, lockLevel: 'soft' | 'hard' | 'frozen') => void;
  searchTerm?: string;
  filterLocked?: boolean;
}

// Mock tree data generator for testing
const generateMockTreeData = (depth: number = 0, maxDepth: number = 4, parentId: string = ''): TreeNode[] => {
  if (depth >= maxDepth) return [];
  
  const itemCount = depth === 0 ? 5 : Math.floor(Math.random() * 8) + 2;
  
  return Array.from({ length: itemCount }, (_, i) => {
    const id = parentId ? `${parentId}-${i}` : `root-${i}`;
    const isFolder = depth < maxDepth - 1 && Math.random() > 0.4;
    
    return {
      id,
      name: isFolder ? `Folder ${id}` : `Component ${id}`,
      type: isFolder ? 'folder' : 'file',
      depth,
      parent: parentId || undefined,
      size: isFolder ? undefined : Math.floor(Math.random() * 50000) + 1000,
      lastModified: new Date(Date.now() - Math.random() * 86400000 * 30),
      children: isFolder ? generateMockTreeData(depth + 1, maxDepth, id) : undefined
    };
  });
};

export const VirtualizedLockTree: React.FC<VirtualizedLockTreeProps> = ({
  projectId,
  height,
  itemHeight,
  onItemSelect,
  onItemLock,
  searchTerm = '',
  filterLocked = false
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root-0', 'root-1']));
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [treeData] = useState<TreeNode[]>(() => generateMockTreeData());
  const [internalSearch, setInternalSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const listRef = useRef<List>(null);

  const { locks, isLoading } = useLockStore(projectId);

  // Use internal search if no external search provided
  const effectiveSearch = searchTerm || internalSearch;

  // Flatten tree structure for virtualization with memoization
  const flattenedNodes: FlattenedNode[] = useMemo(() => {
    const flatten = (
      nodes: TreeNode[], 
      result: FlattenedNode[] = [],
      searchFilter: string = '',
      lockedFilter: boolean = false
    ): FlattenedNode[] => {
      
      const filterNode = (node: TreeNode): boolean => {
        if (searchFilter && !node.name.toLowerCase().includes(searchFilter.toLowerCase())) {
          return false;
        }
        if (lockedFilter && !locks[node.id]) {
          return false;
        }
        return true;
      };

      const hasMatchingChildren = (node: TreeNode): boolean => {
        if (!node.children) return false;
        return node.children.some(child => 
          filterNode(child) || hasMatchingChildren(child)
        );
      };

      nodes.forEach(node => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const shouldShow = filterNode(node) || hasMatchingChildren(node);
        
        if (shouldShow) {
          result.push({
            ...node,
            index: result.length,
            hasChildren: !!hasChildren,
            isExpanded,
            isOpen: isExpanded
          });
        }
        
        // Add children if expanded and parent should be shown
        if (isExpanded && node.children && shouldShow) {
          flatten(node.children, result, searchFilter, lockedFilter);
        }
      });
      
      return result;
    };
    
    return flatten(treeData, [], effectiveSearch, filterLocked);
  }, [treeData, expandedNodes, effectiveSearch, filterLocked, locks]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!selectedNode) return;

    const currentIndex = flattenedNodes.findIndex(node => node.id === selectedNode);
    if (currentIndex === -1) return;

    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        newIndex = Math.min(currentIndex + 1, flattenedNodes.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'ArrowRight':
        event.preventDefault();
        const currentNode = flattenedNodes[currentIndex];
        if (currentNode.hasChildren && !currentNode.isExpanded) {
          toggleExpanded(currentNode.id);
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        const node = flattenedNodes[currentIndex];
        if (node.hasChildren && node.isExpanded) {
          toggleExpanded(node.id);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onItemSelect(selectedNode);
        break;
      case 'l':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onItemLock(selectedNode, 'soft');
        }
        break;
    }

    if (newIndex !== currentIndex) {
      setSelectedNode(flattenedNodes[newIndex].id);
      // Scroll to selected item
      listRef.current?.scrollToItem(newIndex, 'smart');
    }
  }, [selectedNode, flattenedNodes, onItemSelect, onItemLock]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const handleNodeClick = useCallback((node: FlattenedNode, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedNode(node.id);
    onItemSelect(node.id);
    
    if (node.hasChildren) {
      toggleExpanded(node.id);
    }
  }, [onItemSelect, toggleExpanded]);

  const handleLockToggle = useCallback((nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const currentLock = locks[nodeId];
    
    if (currentLock) {
      // Cycle through lock levels
      const nextLevel = currentLock.level === 'soft' ? 'hard' : 
                       currentLock.level === 'hard' ? 'frozen' : 'soft';
      onItemLock(nodeId, nextLevel);
    } else {
      onItemLock(nodeId, 'soft');
    }
  }, [locks, onItemLock]);

  const expandAll = useCallback(() => {
    const allFolderIds = new Set<string>();
    const collectFolders = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'folder') {
          allFolderIds.add(node.id);
          if (node.children) {
            collectFolders(node.children);
          }
        }
      });
    };
    collectFolders(treeData);
    setExpandedNodes(allFolderIds);
  }, [treeData]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // Virtualized row renderer with optimized performance
  const Row = React.memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const node = flattenedNodes[index];
    if (!node) return null;

    const isSelected = selectedNode === node.id;
    const isLocked = locks[node.id];
    const indentLevel = node.depth * 20;

    return (
      <div
        style={style}
        className={`flex items-center px-2 py-1 cursor-pointer select-none transition-colors ${
          isSelected 
            ? 'bg-blue-100 border-l-2 border-blue-500' 
            : 'hover:bg-gray-50'
        }`}
        onClick={(e) => handleNodeClick(node, e)}
        role="treeitem"
        aria-expanded={node.hasChildren ? node.isExpanded : undefined}
        aria-selected={isSelected}
        aria-level={node.depth + 1}
        tabIndex={isSelected ? 0 : -1}
      >
        <div 
          style={{ marginLeft: indentLevel }} 
          className="flex items-center space-x-2 flex-1 min-w-0"
        >
          {/* Expand/Collapse Button */}
          {node.hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.id);
              }}
              className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
              aria-label={node.isExpanded ? 'Collapse' : 'Expand'}
            >
              <ChevronRight 
                className={`w-3 h-3 transition-transform ${
                  node.isExpanded ? 'rotate-90' : ''
                }`} 
              />
            </button>
          ) : (
            <div className="w-5 h-5 flex-shrink-0" />
          )}

          {/* File/Folder Icon */}
          <div className="flex-shrink-0">
            {node.type === 'folder' ? (
              node.isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-500" />
              ) : (
                <Folder className="w-4 h-4 text-blue-600" />
              )
            ) : (
              <File className="w-4 h-4 text-gray-500" />
            )}
          </div>

          {/* Node Name */}
          <span className="text-sm text-gray-900 truncate flex-1 min-w-0">
            {node.name}
          </span>

          {/* File Size */}
          {node.type === 'file' && node.size && (
            <span className="text-xs text-gray-500 flex-shrink-0">
              {(node.size / 1024).toFixed(1)}KB
            </span>
          )}

          {/* Lock Status */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            {isLocked && (
              <span className={`px-1 py-0.5 text-xs rounded ${
                isLocked.level === 'soft' ? 'bg-yellow-100 text-yellow-800' :
                isLocked.level === 'hard' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {isLocked.level}
              </span>
            )}
            
            <button
              onClick={(e) => handleLockToggle(node.id, e)}
              className={`p-1 rounded hover:bg-gray-200 ${
                isLocked ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-label={isLocked ? `Unlock ${node.name}` : `Lock ${node.name}`}
            >
              <Lock className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  });

  Row.displayName = 'TreeRow';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search and Filter Controls */}
      <div className="p-3 border-b bg-white space-y-3">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search components..."
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 border rounded-md hover:bg-gray-50 ${
              showFilters ? 'bg-gray-100 text-blue-600' : 'text-gray-600'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
        
        {showFilters && (
          <div className="flex items-center justify-between pt-2 border-t">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={filterLocked}
                onChange={(e) => setShowFilters(false)} // This would be passed as prop
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700">Show locked only</span>
            </label>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={expandAll}
                className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1"
              >
                Collapse All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Virtualized Tree */}
      <div className="flex-1">
        {flattenedNodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p>No components found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          </div>
        ) : (
          <List
            ref={listRef}
            height={height - 80} // Account for header
            itemCount={flattenedNodes.length}
            itemSize={itemHeight}
            width="100%"
            overscanCount={5}
            role="tree"
            aria-label="Component tree"
          >
            {Row}
          </List>
        )}
      </div>

      {/* Status Bar */}
      <div className="px-3 py-2 bg-gray-50 border-t text-xs text-gray-600 flex items-center justify-between">
        <div>
          {flattenedNodes.length} items • {Object.keys(locks).length} locked
        </div>
        <div>
          {selectedNode && (
            <span>Selected: {flattenedNodes.find(n => n.id === selectedNode)?.name}</span>
          )}
        </div>
      </div>
    </div>
  );
};