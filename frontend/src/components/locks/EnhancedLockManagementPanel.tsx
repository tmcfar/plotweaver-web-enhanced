import { FC, useState, useMemo } from 'react';
import { LockIndicator, LockLevel, LockType } from './LockIndicator';
import { useLockStore, useLockStoreSelectors } from '../../lib/store/lockStore';
import { useOptimisticLocks } from '../../hooks/useOptimisticLocks';
import { useNotifications } from '../notifications/NotificationSystem';

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

export interface BulkLockOperation {
  type: 'lock' | 'unlock' | 'change_level';
  componentIds: string[];
  lockLevel?: LockLevel;
  reason: string;
}

interface ProjectComponent {
  id: string;
  name: string;
  type: 'character' | 'setting' | 'plot' | 'scene' | 'chapter';
  path: string;
  children?: ProjectComponent[];
  parent?: string;
}

interface LockManagementPanelProps {
  projectId: string;
  projectComponents: ProjectComponent[];
  userRole: 'owner' | 'editor' | 'collaborator';
}

interface LockTreeViewProps {
  components: ProjectComponent[];
  selectedComponents: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  userRole: 'owner' | 'editor' | 'collaborator';
  level?: number;
}

// Individual tree node component to avoid hook violations
const TreeNode: FC<{
  component: ProjectComponent;
  isExpanded: boolean;
  isSelected: boolean;
  hasChildren: boolean;
  level: number;
  userRole: string;
  onToggleExpanded: (id: string) => void;
  onToggleSelection: (id: string) => void;
  onLockToggle: (id: string) => void;
}> = ({ 
  component, 
  isExpanded, 
  isSelected, 
  hasChildren, 
  level, 
  userRole, 
  onToggleExpanded, 
  onToggleSelection, 
  onLockToggle 
}) => {
  const { useComponentLock, useComponentLoading } = useLockStoreSelectors();
  const currentLock = useComponentLock(component.id);
  const isLoading = useComponentLoading(component.id);
  const indent = level * 20;

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

  return (
    <div className="tree-node">
      <div
        className={`
          flex items-center py-1 px-2 hover:bg-gray-50 cursor-pointer rounded transition-colors
          ${isSelected ? 'bg-blue-50 border border-blue-200' : ''}
        `}
        style={{ paddingLeft: `${indent + 8}px` }}
      >
        {hasChildren && (
          <button
            onClick={() => onToggleExpanded(component.id)}
            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 mr-1"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
        
        <span className="mr-2">{getTypeIcon(component.type)}</span>
        
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(component.id)}
          className="mr-2"
        />
        
        <span className="flex-1 text-sm">{component.name}</span>
        
        <LockIndicator
          lock={currentLock}
          isLoading={isLoading}
          onClick={() => onLockToggle(component.id)}
          canToggle={userRole === 'owner' || userRole === 'editor'}
          size="small"
        />
      </div>
      
      {isExpanded && hasChildren && (
        <div className="ml-4">
          {component.children?.map((child) => (
            <TreeNode
              key={child.id}
              component={child}
              isExpanded={false}
              isSelected={false}
              hasChildren={!!(child.children && child.children.length > 0)}
              level={level + 1}
              userRole={userRole}
              onToggleExpanded={onToggleExpanded}
              onToggleSelection={onToggleSelection}
              onLockToggle={onLockToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const LockTreeView: FC<LockTreeViewProps> = ({
  components,
  selectedComponents,
  onSelectionChange,
  userRole,
  level = 0
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const { updateLock, removeLock } = useOptimisticLocks('demo-project'); // TODO: Get actual project ID
  const { notifySuccess, notifyError } = useNotifications();

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

  const handleLockToggle = async (componentId: string) => {
    try {
      // Note: We can't call hooks here, so we need to check locks at component level
      // This should be handled by the TreeNode component
      await removeLock(componentId);
      notifySuccess(`Updated lock for ${componentId}`);
    } catch (error) {
      notifyError(`Failed to toggle lock for ${componentId}`);
    }
  };

  return (
    <div className="lock-tree-view">
      {components.map((component) => {
        const isExpanded = expandedNodes.has(component.id);
        const isSelected = selectedComponents.has(component.id);
        const hasChildren = component.children && component.children.length > 0;

        return (
          <TreeNode
            key={component.id}
            component={component}
            isExpanded={isExpanded}
            isSelected={isSelected}
            hasChildren={hasChildren}
            level={level}
            userRole={userRole}
            onToggleExpanded={toggleExpanded}
            onToggleSelection={toggleSelection}
            onLockToggle={handleLockToggle}
          />
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

export const EnhancedLockManagementPanel: FC<LockManagementPanelProps> = ({
  projectId,
  projectComponents,
  userRole
}) => {
  const [selectedComponents, setSelectedComponents] = useState<Set<string>>(new Set());
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [bulkLockLevel, setBulkLockLevel] = useState<LockLevel>('soft');
  const [bulkReason, setBulkReason] = useState('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  // Use enhanced store selectors
  const { useLockStats, useConflictsByPriority, useGlobalLoading, useWebsocketStatus } = useLockStoreSelectors();
  const lockStats = useLockStats();
  const conflictsByPriority = useConflictsByPriority();
  const isGlobalLoading = useGlobalLoading();
  const websocketStatus = useWebsocketStatus();

  const { bulkUpdateLocks } = useOptimisticLocks(projectId);
  const { notifySuccess, notifyError } = useNotifications();

  const handleBulkLock = () => {
    if (selectedComponents.size === 0) return;
    setShowBulkDialog(true);
  };

  const confirmBulkOperation = async () => {
    if (!bulkReason.trim()) return;

    try {
      const operation: BulkLockOperation = {
        type: 'lock',
        componentIds: Array.from(selectedComponents),
        lockLevel: bulkLockLevel,
        reason: bulkReason
      };
      
      await bulkUpdateLocks([operation]);
      
      setSelectedComponents(new Set());
      setShowBulkDialog(false);
      setBulkReason('');
      
      notifySuccess(`Applied ${bulkLockLevel} locks to ${selectedComponents.size} components`);
    } catch (error) {
      notifyError('Failed to apply bulk locks');
    }
  };

  const criticalConflictsCount = conflictsByPriority.critical.length + conflictsByPriority.high.length;

  return (
    <div className="lock-management-panel h-full flex flex-col bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Lock Management</h3>
          <div className="flex items-center space-x-2">
            {/* Connection Status */}
            <div className={`w-2 h-2 rounded-full ${
              websocketStatus === 'connected' ? 'bg-green-500' : 
              websocketStatus === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`} title={websocketStatus} />
            
            {/* Critical Conflicts */}
            {criticalConflictsCount > 0 && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                {criticalConflictsCount} critical
              </span>
            )}
            
            {/* Global Loading */}
            {isGlobalLoading && (
              <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
          </div>
        </div>

        {/* Lock Statistics */}
        <div className="flex space-x-4 text-sm text-gray-600 mb-3">
          <span>Total: {lockStats.total}</span>
          <span className="text-yellow-600">Soft: {lockStats.soft}</span>
          <span className="text-orange-600">Hard: {lockStats.hard}</span>
          <span className="text-red-600">Frozen: {lockStats.frozen}</span>
          {lockStats.conflicts > 0 && (
            <span className="text-red-600">Conflicts: {lockStats.conflicts}</span>
          )}
        </div>
        
        {/* Bulk Operations */}
        {selectedComponents.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800 font-medium">
                {selectedComponents.size} components selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkLock}
                  disabled={isGlobalLoading}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
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

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto p-2">
        <LockTreeView
          components={projectComponents}
          selectedComponents={selectedComponents}
          onSelectionChange={setSelectedComponents}
          userRole={userRole}
        />
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lock Level:
              </label>
              <select
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason:
              </label>
              <textarea
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
                disabled={!bulkReason.trim() || isGlobalLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isGlobalLoading ? 'Applying...' : 'Apply Locks'}
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