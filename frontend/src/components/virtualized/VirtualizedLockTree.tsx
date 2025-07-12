// src/components/virtualized/VirtualizedLockTree.tsx
'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect, forwardRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Lock, Folder, FolderOpen, File, Search, Filter, ChevronRight } from 'lucide-react';
import { useLockStore } from '../../hooks/useLockStore';

interface TreeItem {
  id: string;
  name: string;
  type: string;
  locked?: { level: 'soft' | 'hard' | 'frozen'; reason: string } | null;
  children?: TreeItem[];
}

interface FlattenedNode {
  id: string;
  name: string;
  type: string;
  locked?: { level: 'soft' | 'hard' | 'frozen'; reason: string } | null;
  children?: TreeItem[];
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

interface VirtualizedLockTreeProps {
  items: TreeItem[];
  height: number;
  width?: number;
  itemHeight?: number;
  onLockToggle?: (itemId: string) => void;
  searchable?: boolean;
  showControls?: boolean;
  projectId?: string;
  rowComponent?: React.ComponentType<any>;
}


export const VirtualizedLockTree = forwardRef<List, VirtualizedLockTreeProps>((
  {
    items = [],
    height,
    width = '100%',
    itemHeight = 40,
    onLockToggle,
    searchable = false,
    showControls = false,
    projectId,
    rowComponent,
  },
  ref
) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [focusedNode, setFocusedNode] = useState<string | null>(null);
  const [internalSearch, setInternalSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const listRef = useRef<List>(null);

  const { locks } = useLockStore();

  // Use internal search for searchable components
  const effectiveSearch = searchable ? internalSearch : '';

  // Flatten tree structure for virtualization with memoization
  const flattenedNodes: FlattenedNode[] = useMemo(() => {
    const flatten = (
      nodes: TreeItem[],
      result: FlattenedNode[] = [],
      depth: number = 0,
      searchFilter: string = ''
    ): FlattenedNode[] => {

      const filterNode = (node: TreeItem): boolean => {
        if (searchFilter && !node.name.toLowerCase().includes(searchFilter.toLowerCase())) {
          return false;
        }
        return true;
      };

      const hasMatchingChildren = (node: TreeItem): boolean => {
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
            depth,
            hasChildren: !!hasChildren,
            isExpanded
          });
        }

        // Add children if expanded and parent should be shown
        if (isExpanded && node.children && shouldShow) {
          flatten(node.children, result, depth + 1, searchFilter);
        }
      });

      return result;
    };

    return flatten(items, [], 0, effectiveSearch);
  }, [items, expandedNodes, effectiveSearch]);

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

  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!focusedNode) return;

    const currentIndex = flattenedNodes.findIndex(node => node.id === focusedNode);
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
        setSelectedNode(focusedNode);
        break;
      case 'l':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onLockToggle?.(focusedNode);
        }
        break;
    }

    if (newIndex !== currentIndex && flattenedNodes[newIndex]) {
      setFocusedNode(flattenedNodes[newIndex].id);
      // Scroll to focused item
      listRef.current?.scrollToItem(newIndex, 'smart');
    }
  }, [focusedNode, flattenedNodes, onLockToggle, toggleExpanded]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleNodeClick = useCallback((node: FlattenedNode, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedNode(node.id);
    setFocusedNode(node.id);
  }, []);

  const handleExpandClick = useCallback((nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    toggleExpanded(nodeId);
  }, [toggleExpanded]);

  const handleLockToggle = useCallback((nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onLockToggle?.(nodeId);
  }, [onLockToggle]);

  const expandAll = useCallback(() => {
    const allFolderIds = new Set<string>();
    const collectFolders = (nodes: TreeItem[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          allFolderIds.add(node.id);
          collectFolders(node.children);
        }
      });
    };
    collectFolders(items);
    setExpandedNodes(allFolderIds);
  }, [items]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // Virtualized row renderer with optimized performance
  const Row = React.memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const node = flattenedNodes[index];
    if (!node) return null;

    const isSelected = selectedNode === node.id;
    const isFocused = focusedNode === node.id;
    const isLocked = node.locked;
    const indentLevel = node.depth * 20;

    return (
      <div
        style={style}
        className={`flex items-center px-2 py-1 cursor-pointer select-none transition-colors ${isSelected
          ? 'bg-blue-100 border-l-2 border-blue-500'
          : 'hover:bg-gray-50'
          } ${isFocused ? 'focused bg-blue-50' : ''
          }`}
        onClick={(e) => handleNodeClick(node, e)}
        data-testid={`tree-item-${node.id}`}
        role="treeitem"
        aria-expanded={node.hasChildren ? node.isExpanded : undefined}
        aria-selected={isSelected}
        aria-level={node.depth + 1}
        aria-posinset={index + 1}
        aria-setsize={flattenedNodes.length}
        tabIndex={isFocused ? 0 : -1}
      >
        <div
          style={{ marginLeft: indentLevel }}
          className="flex items-center space-x-2 flex-1 min-w-0"
        >
          {/* Expand/Collapse Button */}
          {node.hasChildren ? (
            <button
              onClick={(e) => handleExpandClick(node.id, e)}
              className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
              aria-label={node.isExpanded ? 'Collapse' : 'Expand'} aria-expanded={node.isExpanded}
              data-testid={`expand-${node.id}`}
            >
              <ChevronRight
                className={`w-3 h-3 transition-transform ${node.isExpanded ? 'rotate-90' : ''
                  }`}
              />
            </button>
          ) : (
            <div className="w-5 h-5 flex-shrink-0" />
          )}

          {/* File/Folder Icon */}
          <div className="flex-shrink-0">
            {node.children && node.children.length > 0 ? (
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
            {effectiveSearch && node.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ? (
              <>
                {node.name.split(new RegExp(`(${effectiveSearch})`, 'gi')).map((part, i) =>
                  part.toLowerCase() === effectiveSearch.toLowerCase() ? (
                    <span key={i} data-testid="highlight" className="bg-yellow-200">{part}</span>
                  ) : (
                    part
                  )
                )}
              </>
            ) : (
              node.name
            )}
          </span>

          {/* Lock Status */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            {isLocked && (
              <>
                <span
                  className={`px-1 py-0.5 text-xs rounded ${isLocked.level === 'soft' ? 'bg-yellow-100 text-yellow-800' :
                    isLocked.level === 'hard' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}
                >
                  {isLocked.level}
                </span>
                <Lock
                  className={`w-3 h-3 ${isLocked.level === 'soft' ? 'text-yellow-500' :
                    isLocked.level === 'hard' ? 'text-orange-500' :
                      'text-red-500'
                    }`}
                  data-testid={`lock-${isLocked.level}-${node.id}`}
                />
              </>
            )}

            <button
              onClick={(e) => handleLockToggle(node.id, e)}
              className={`p-1 rounded hover:bg-gray-200 ${isLocked ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
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

  if (false) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search and Filter Controls */}
      {(searchable || showControls) && (
        <div className="p-3 border-b bg-white space-y-3">
          {searchable && (
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
                className={`p-2 border rounded-md hover:bg-gray-50 ${showFilters ? 'bg-gray-100 text-blue-600' : 'text-gray-600'
                  }`}
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          )}

          {showControls && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div></div>
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
      )}

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
            ref={ref || listRef}
            height={typeof height === 'string' ? parseInt(height) : height}
            itemCount={flattenedNodes.length}
            itemSize={itemHeight}
            width={width}
            overscanCount={5}
          >
            {rowComponent || Row}
          </List>
        )}
      </div>

      {/* Status Bar */}
      <div className="px-3 py-2 bg-gray-50 border-t text-xs text-gray-600 flex items-center justify-between">
        <div>
          {flattenedNodes.length} items • {items.filter(item => item.locked).length} locked
        </div>
        <div>
          {selectedNode && (
            <span>Selected: {flattenedNodes.find(n => n.id === selectedNode)?.name}</span>
          )}
        </div>
      </div>
    </div>
  );
});

VirtualizedLockTree.displayName = 'VirtualizedLockTree';