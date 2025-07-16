import { FC, useState, useMemo } from 'react';
import { LockIndicator, LockLevel, LockType } from './LockIndicator';
import { LockTreeSkeleton } from '@/components/ui/skeleton';
import { NoLocksState, SearchEmptyState, ErrorState } from '@/components/design-system/empty-states';

export interface ComponentLock {
  id: string;
  componentId: string;
  level: LockLevel;
  type: LockType;
  reason: string;
  lockedBy: string;
  lockedAt: Date;
  sharedWith?: string[];
  canOverride?: boolean;
}

export interface LockState {
  locks: Record<string, ComponentLock>;
  conflicts: LockConflict[];
}

export interface LockConflict {
  id: string;
  componentId: string;
  type: string;
  description: string;
  currentState: any;
  conflictingState: any;
}

export interface BulkLockOperation {
  type: 'lock' | 'unlock' | 'change_level';
  componentIds: string[];
  lockLevel?: LockLevel;
  reason: string;
}

export interface ProjectComponent {
  id: string;
  name: string;
  type: 'character' | 'setting' | 'plot' | 'scene' | 'chapter';
  path: string;
  children?: ProjectComponent[];
  parent?: string;
}

interface LockManagementPanelProps {
  projectId: string;
  lockState: LockState;
  userRole: 'owner' | 'editor' | 'collaborator';
  projectComponents: ProjectComponent[];
  onLockUpdate: (locks: ComponentLock[]) => void;
  onBulkOperation: (operation: BulkLockOperation) => void;
  isLoading?: boolean;
  error?: Error;
  onRetry?: () => void;
}

interface LockTreeViewProps {
  components: ProjectComponent[];
  lockState: LockState;
  selectedComponents: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onLockUpdate: (componentId: string, lock: ComponentLock | null) => void;
  userRole: 'owner' | 'editor' | 'collaborator';
  level?: number;
  searchTerm?: string;
  levelFilter?: LockLevel | 'all' | 'unlocked';
}

const LockTreeView: FC<LockTreeViewProps> = ({
  components,
  lockState,
  selectedComponents,
  onSelectionChange,
  onLockUpdate,
  userRole,
  level = 0,
  searchTerm = '',
  levelFilter = 'all'
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    // Expand all root level components by default
    const rootComponents = components.filter(c => !c.parent).map(c => c.id)
    return new Set(['root', ...rootComponents])
  });

  const filteredComponents = useMemo(() => {
    return components.filter(component => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        component.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Level filter
      const currentLock = lockState.locks[component.id];
      const matchesLevel = levelFilter === 'all' || 
        (levelFilter && currentLock?.level === levelFilter) ||
        (levelFilter === 'unlocked' && !currentLock);
      
      return matchesSearch && matchesLevel;
    });
  }, [components, searchTerm, levelFilter, lockState.locks]);

  const toggleExpanded = (componentId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(componentId)) {
      newExpanded.delete(componentId);
    } else {
      newExpanded.add(componentId);
    }
    setExpandedNodes(newExpanded);
  };

  const toggleSelection = (componentId: string) => {
    const newSelected = new Set(selectedComponents);
    if (newSelected.has(componentId)) {
      newSelected.delete(componentId);
    } else {
      newSelected.add(componentId);
    }
    onSelectionChange(newSelected);
  };

  const handleLockToggle = (componentId: string) => {
    const currentLock = lockState.locks[componentId];
    if (currentLock) {
      onLockUpdate(componentId, null); // Remove lock
    } else {
      // Create new soft lock
      const newLock: ComponentLock = {
        id: `lock-${Date.now()}`,
        componentId,
        level: 'soft',
        type: 'personal',
        reason: 'Manual lock',
        lockedBy: 'current-user', // TODO: Get from auth
        lockedAt: new Date(),
        canOverride: userRole === 'owner'
      };
      onLockUpdate(componentId, newLock);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      character: '👤',
      setting: '🏛️',
      plot: '📚',
      scene: '🎬',
      chapter: '📄'
    };
    return icons[type as keyof typeof icons] || '📁';
  };

  if (filteredComponents.length === 0 && searchTerm) {
    return (
      <div className="p-4">
        <SearchEmptyState 
          query={searchTerm} 
          onClearSearch={() => {}} 
        />
      </div>
    );
  }

  return (
    <div className="lock-tree-view">
      {filteredComponents.map((component) => {
        const isExpanded = expandedNodes.has(component.id);
        const isSelected = selectedComponents.has(component.id);
        const hasChildren = component.children && component.children.length > 0;
        const currentLock = lockState.locks[component.id];
        const indent = level * 20;

        return (
          <div key={component.id} className="tree-node">
            <div
              className={`
                flex items-center py-1 px-2 hover:bg-gray-50 cursor-pointer rounded
                ${isSelected ? 'bg-blue-50 border border-blue-200' : ''}
              `}
              style={{ paddingLeft: `${indent + 8}px` }}
            >
              {/* Expand/Collapse Button */}
              {hasChildren && (
                <button
                  onClick={() => toggleExpanded(component.id)}
                  className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 mr-1"
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              )}
              {!hasChildren && <div className="w-5" />}

              {/* Selection Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelection(component.id)}
                className="mr-2"
              />

              {/* Component Icon */}
              <span className="mr-2 text-sm">{getTypeIcon(component.type)}</span>

              {/* Component Name */}
              <span className="flex-1 text-sm truncate">{component.name}</span>

              {/* Lock Indicator */}
              <div className="ml-2">
                <LockIndicator
                  componentId={component.id}
                  lockLevel={currentLock?.level || null}
                  lockType={currentLock?.type}
                  canOverride={currentLock?.canOverride}
                  sharedWith={currentLock?.sharedWith}
                  reason={currentLock?.reason}
                  lockedBy={currentLock?.lockedBy}
                  lockedAt={currentLock?.lockedAt}
                  onLockToggle={handleLockToggle}
                  size="sm"
                  showDetails={false}
                />
              </div>
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
              <LockTreeView
                components={component.children!}
                lockState={lockState}
                selectedComponents={selectedComponents}
                onSelectionChange={onSelectionChange}
                onLockUpdate={onLockUpdate}
                userRole={userRole}
                level={level + 1}
                searchTerm={searchTerm}
                levelFilter={levelFilter}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

interface AuditTrailModalProps {
  projectId: string;
  onClose: () => void;
}

const AuditTrailModal: FC<AuditTrailModalProps> = ({ projectId, onClose }) => {
  // Mock audit trail data - would come from API
  const auditEntries = [
    {
      id: '1',
      action: 'Lock Created',
      componentId: 'character-john',
      user: 'Alice Smith',
      timestamp: new Date(),
      details: 'Hard lock applied - Character development complete'
    },
    {
      id: '2',
      action: 'Lock Removed',
      componentId: 'scene-intro',
      user: 'Bob Jones',
      timestamp: new Date(Date.now() - 3600000),
      details: 'Unlocked for final edits'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Lock Audit Trail</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close audit trail"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {auditEntries.map((entry) => (
              <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">{entry.action}</h3>
                  <span className="text-sm text-gray-500">
                    {entry.timestamp.toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  Component: <code className="bg-gray-100 px-1 rounded">{entry.componentId}</code>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  By: {entry.user}
                </div>
                <div className="text-sm text-gray-700">
                  {entry.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const LockManagementPanel: FC<LockManagementPanelProps> = ({
  projectId,
  lockState,
  userRole,
  projectComponents,
  onLockUpdate,
  onBulkOperation,
  isLoading = false,
  error,
  onRetry
}) => {
  const [selectedComponents, setSelectedComponents] = useState<Set<string>>(new Set());
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [bulkLockLevel, setBulkLockLevel] = useState<LockLevel>('soft');
  const [bulkReason, setBulkReason] = useState('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<LockLevel | 'all' | 'unlocked'>('all');

  const lockStats = useMemo(() => {
    const locks = Object.values(lockState.locks);
    return {
      total: locks.length,
      soft: locks.filter(l => l.level === 'soft').length,
      hard: locks.filter(l => l.level === 'hard').length,
      frozen: locks.filter(l => l.level === 'frozen').length,
      conflicts: lockState.conflicts.length
    };
  }, [lockState]);

  const handleBulkLock = () => {
    if (selectedComponents.size === 0) return;
    setShowBulkDialog(true);
  };

  const confirmBulkOperation = () => {
    if (!bulkReason.trim()) return;

    const operation: BulkLockOperation = {
      type: 'lock',
      componentIds: Array.from(selectedComponents),
      lockLevel: bulkLockLevel,
      reason: bulkReason
    };
    
    onBulkOperation(operation);
    setSelectedComponents(new Set());
    setShowBulkDialog(false);
    setBulkReason('');
  };

  const handleLockUpdate = (componentId: string, lock: ComponentLock | null) => {
    if (lock) {
      onLockUpdate([lock]);
    } else {
      // Remove lock - would need API call
      const updatedLocks = Object.values(lockState.locks).filter(l => l.componentId !== componentId);
      onLockUpdate(updatedLocks);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  // Handle error state
  if (error) {
    return (
      <div className="lock-management-panel h-full flex flex-col bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lock Management</h3>
        </div>
        <div className="flex-1">
          <ErrorState
            title="Error loading locks"
            description={error.message}
            onRetry={onRetry}
          />
        </div>
      </div>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="lock-management-panel h-full flex flex-col bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lock Management</h3>
        </div>
        <div className="flex-1" data-testid="lock-panel-skeleton">
          <LockTreeSkeleton />
        </div>
      </div>
    );
  }

  const hasComponents = projectComponents.length > 0;
  const hasLocks = Object.keys(lockState.locks).length > 0;

  return (
    <div className="lock-management-panel h-full flex flex-col bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Lock Management</h3>
          {lockState.conflicts.length > 0 && (
            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
              {lockState.conflicts.length} conflicts
            </span>
          )}
        </div>

        {/* Lock Statistics */}
        <div className="flex space-x-4 text-sm text-gray-600 mb-3">
          <span>Total: {lockStats.total}</span>
          <span className="text-yellow-600">Soft: {lockStats.soft}</span>
          <span className="text-orange-600">Hard: {lockStats.hard}</span>
          <span className="text-red-600">Frozen: {lockStats.frozen}</span>
        </div>

        {/* Search and Filter Controls */}
        {hasComponents && (
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search components..."
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Level Filter */}
            <div className="flex items-center space-x-3">
              <label htmlFor="level-filter" className="text-sm font-medium text-gray-700">
                Filter by lock level:
              </label>
              <select
                id="level-filter"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as LockLevel | 'all' | 'unlocked')}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="unlocked">Unlocked</option>
                <option value="soft">Soft Lock</option>
                <option value="hard">Hard Lock</option>
                <option value="frozen">Frozen</option>
              </select>
            </div>
          </div>
        )}
        
        {/* Bulk Operations */}
        {selectedComponents.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800 font-medium">
                {selectedComponents.size} components selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkLock}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Bulk Lock
                </button>
                <button
                  onClick={() => setSelectedComponents(new Set())}
                  className="px-3 py-1 text-xs border border-blue-300 text-blue-700 rounded hover:bg-blue-100"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tree View / Empty State */}
      <div className="flex-1 overflow-y-auto">
        {!hasComponents ? (
          <div className="p-4">
            <div className="text-center text-gray-500 py-8">
              <p>No components in context</p>
              <p className="text-sm">Add components from the browser to build scene context</p>
            </div>
          </div>
        ) : !hasLocks && searchTerm === '' && levelFilter === 'all' ? (
          <NoLocksState />
        ) : searchTerm && !hasComponents ? (
          <div className="p-4">
            <div className="text-center text-gray-500 py-8">
              <p>No components match your search</p>
            </div>
          </div>
        ) : (
          <div className="p-2">
            <LockTreeView
              components={projectComponents}
              lockState={lockState}
              selectedComponents={selectedComponents}
              onSelectionChange={setSelectedComponents}
              onLockUpdate={handleLockUpdate}
              userRole={userRole}
              searchTerm={searchTerm}
              levelFilter={levelFilter}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => setShowAuditTrail(true)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View Audit Trail
        </button>
      </div>

      {/* Audit Trail Modal */}
      {showAuditTrail && (
        <AuditTrailModal
          projectId={projectId}
          onClose={() => setShowAuditTrail(false)}
        />
      )}

      {/* Bulk Lock Dialog */}
      {showBulkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Bulk Lock Components</h3>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                Apply locks to {selectedComponents.size} selected components.
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="bulk-lock-level" className="block text-sm font-medium text-gray-700 mb-2">
                Lock Level:
              </label>
              <select
                id="bulk-lock-level"
                value={bulkLockLevel}
                onChange={(e) => setBulkLockLevel(e.target.value as LockLevel)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="soft">Soft Lock</option>
                <option value="hard">Hard Lock</option>
                <option value="frozen">Frozen</option>
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="bulk-reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason:
              </label>
              <textarea
                id="bulk-reason"
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Explain why these components should be locked..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={confirmBulkOperation}
                disabled={!bulkReason.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Apply Locks
              </button>
              <button
                onClick={() => {
                  setShowBulkDialog(false);
                  setBulkReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};