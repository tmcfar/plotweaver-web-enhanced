'use client'

import { useState, useEffect } from 'react';
import { useWebSocket } from '../src/hooks/useWebSocket';
import { useWebSocketLocks } from '../src/hooks/useWebSocketLocks';
import { useOptimisticLocks } from '../src/hooks/useOptimisticLocks';
import { usePreviewCapture } from '../src/hooks/usePreviewCapture';
import { ModeSetCard } from '../src/components/mode-sets/ModeSetCard';
import { ModeSetSelector, type ModeSet, type ModeSetId } from '../src/components/mode-sets/ModeSetSelector';
import { EnhancedLockManagementPanel } from '../src/components/locks/EnhancedLockManagementPanel';
import { ConflictResolutionDialog, type ConflictResolution } from '../src/components/locks/ConflictResolutionDialog';
import { NotificationSystem, useNotifications } from '../src/components/notifications/NotificationSystem';
import { useGlobalStore } from '../src/lib/store';
import { useLockStore, useLockStoreSelectors } from '../src/lib/store/lockStore';
import { modeSetAPI } from '../src/lib/api/modeSets';
import { Layout } from '../src/components/layout/Layout';

// Mock data for demonstration
const AVAILABLE_MODE_SETS: ModeSet[] = [
  {
    id: 'professional-writer',
    name: 'Professional Writer',
    description: 'Full control with AI assistance',
    features: ['Manual control', 'Advanced features', 'Git operations', 'Full customization'],
    color: 'blue',
    icon: '✍️'
  },
  {
    id: 'ai-first',
    name: 'AI-First Creation',
    description: 'Let AI lead the creative process',
    features: ['Auto-generation', 'Simplified UI', 'Quick results', 'Smart suggestions'],
    color: 'purple',
    icon: '🤖'
  },
  {
    id: 'editor',
    name: 'Editor & Reviewer',
    description: 'Review and annotate content',
    features: ['Read-only mode', 'Annotations', 'Reports', 'Collaboration'],
    color: 'green',
    icon: '📝'
  },
  {
    id: 'hobbyist',
    name: 'Creative Explorer',
    description: 'Fun, casual writing experience',
    features: ['Gamification', 'Templates', 'Community', 'Simple tools'],
    color: 'orange',
    icon: '🎨'
  }
];

const MOCK_PROJECT_COMPONENTS = [
  {
    id: 'story-root',
    name: 'My Novel',
    type: 'chapter' as const,
    path: '/story',
    children: [
      {
        id: 'characters',
        name: 'Characters',
        type: 'character' as const,
        path: '/story/characters',
        children: [
          {
            id: 'character-protagonist',
            name: 'John Doe (Protagonist)',
            type: 'character' as const,
            path: '/story/characters/john-doe'
          },
          {
            id: 'character-antagonist',
            name: 'Jane Smith (Antagonist)',
            type: 'character' as const,
            path: '/story/characters/jane-smith'
          }
        ]
      },
      {
        id: 'settings',
        name: 'Settings & Locations',
        type: 'setting' as const,
        path: '/story/settings',
        children: [
          {
            id: 'setting-hometown',
            name: 'Hometown',
            type: 'setting' as const,
            path: '/story/settings/hometown'
          },
          {
            id: 'setting-office',
            name: 'Corporate Office',
            type: 'setting' as const,
            path: '/story/settings/office'
          }
        ]
      },
      {
        id: 'plot',
        name: 'Plot Structure',
        type: 'plot' as const,
        path: '/story/plot',
        children: [
          {
            id: 'chapter-1',
            name: 'Chapter 1: The Beginning',
            type: 'chapter' as const,
            path: '/story/plot/chapter-1',
            children: [
              {
                id: 'scene-1-1',
                name: 'Opening Scene',
                type: 'scene' as const,
                path: '/story/plot/chapter-1/scene-1'
              },
              {
                id: 'scene-1-2',
                name: 'Inciting Incident',
                type: 'scene' as const,
                path: '/story/plot/chapter-1/scene-2'
              }
            ]
          }
        ]
      }
    ]
  }
];

export default function HomePage() {
  const { modeSet, setModeSet } = useGlobalStore();
  const [content, setContent] = useState('Welcome to PlotWeaver');
  const [showLockPanel, setShowLockPanel] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  // Enhanced hooks
  const { 
    conflicts,
    resolveConflict: resolveConflictInStore
  } = useLockStore();
  
  const { useLockStats, useWebsocketStatus } = useLockStoreSelectors();
  const lockStats = useLockStats();
  const websocketStatus = useWebsocketStatus();

  const { 
    connectionStatus, 
    broadcastConflictResolution,
    isOnline 
  } = useWebSocketLocks('demo-project');
  
  const { 
    isUpdating,
    hasErrors,
    retryFailedOperations 
  } = useOptimisticLocks('demo-project');

  const {
    notifySuccess,
    notifyError,
    notifyConnectionStatus
  } = useNotifications();

  const handleModeSetSelection = async (modeSetId: ModeSetId) => {
    try {
      await modeSetAPI.setUserModeSet(modeSetId);
      setModeSet(modeSetId);
      notifySuccess(`Switched to ${modeSetId} mode`);
    } catch (error) {
      notifyError('Failed to change mode set');
    }
  };

  // Legacy WebSocket for backward compatibility
  const { isConnected, lastMessage, sendMessage } = useWebSocket('ws://localhost:8000/ws')
  const { capturePreview } = usePreviewCapture()

  useEffect(() => {
    const interval = setInterval(() => {
      capturePreview('preview-content')
    }, 5000) // Capture every 5 seconds

    return () => clearInterval(interval)
  }, [capturePreview])

  // Notify on connection status changes
  useEffect(() => {
    notifyConnectionStatus(connectionStatus);
  }, [connectionStatus, notifyConnectionStatus]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    sendMessage(`content-update: ${e.target.value}`)
  }

  const handleConflictResolution = async (conflictId: string, resolution: ConflictResolution) => {
    try {
      // Resolve in store
      resolveConflictInStore(conflictId, resolution);
      
      // Broadcast to other clients
      broadcastConflictResolution(conflictId, resolution);
      
      notifySuccess('Conflict resolved successfully');

      // Close dialog if no more conflicts
      if (conflicts.length <= 1) {
        setShowConflictDialog(false);
      }
    } catch (error) {
      notifyError('Failed to resolve conflict');
    }
  };

  const currentModeSet = AVAILABLE_MODE_SETS.find(ms => ms.id === modeSet) || AVAILABLE_MODE_SETS[0];

  return (
    <div className="app min-h-screen bg-gray-50">
      {/* Notification System */}
      <NotificationSystem position="top-right" maxNotifications={5} />

      {!modeSet ? (
        /* Initial Mode Set Selection */
        <div className="h-screen flex items-center justify-center">
          <div className="max-w-6xl mx-auto p-8">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
              How do you want to write today?
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {AVAILABLE_MODE_SETS.map((modeSetData) => (
                <ModeSetCard
                  key={modeSetData.id}
                  id={modeSetData.id}
                  title={modeSetData.name}
                  description={modeSetData.description}
                  features={modeSetData.features}
                  onSelect={handleModeSetSelection}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Main Application Interface */
        <Layout>
          <div className="h-full flex flex-col">
            {/* Enhanced Top Bar */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <h1 className="text-xl font-semibold text-gray-900">PlotWeaver</h1>
                  
                  <ModeSetSelector
                    currentModeSet={modeSet}
                    availableModeSets={AVAILABLE_MODE_SETS}
                    onModeSetChange={handleModeSetSelection}
                    showMigrationWarning={true}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  {/* Enhanced Connection Status */}
                  <div className="flex items-center space-x-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connected' ? 'bg-green-500' : 
                      connectionStatus === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-gray-600">
                      {connectionStatus === 'connected' ? 'Online' : 
                       connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Offline'}
                    </span>
                    {isUpdating && (
                      <svg className="animate-spin h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                  </div>

                  {/* Enhanced Lock Management Toggle */}
                  <button
                    onClick={() => setShowLockPanel(!showLockPanel)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors relative ${
                      showLockPanel 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🔒 Locks ({lockStats.total})
                    {lockStats.conflicts > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                    )}
                  </button>

                  {/* Enhanced Conflicts Indicator */}
                  {conflicts.length > 0 && (
                    <button
                      onClick={() => setShowConflictDialog(true)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      ⚠️ {conflicts.length} Conflicts
                    </button>
                  )}

                  {/* Error Recovery */}
                  {hasErrors && (
                    <button
                      onClick={retryFailedOperations}
                      className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
                      title="Retry failed operations"
                    >
                      🔄 Retry
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex">
              {/* Enhanced Lock Management Panel */}
              {showLockPanel && (
                <div className="w-80 border-r border-gray-200 bg-white">
                  <EnhancedLockManagementPanel
                    projectId="demo-project"
                    projectComponents={MOCK_PROJECT_COMPONENTS}
                    userRole="owner"
                  />
                </div>
              )}

              {/* Main Editor/Content Area */}
              <div className="flex-1 p-6">
                <div className="bg-white rounded-lg border border-gray-200 h-full">
                  <div className="p-6">
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">Writing Interface</h2>
                      <p className="text-sm text-gray-600">
                        Current mode: <strong>{currentModeSet.name}</strong> - {currentModeSet.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-96">
                      {/* Editor Panel */}
                      <div className="flex flex-col">
                        <h3 className="font-medium text-gray-900 mb-2">Editor</h3>
                        <textarea
                          value={content}
                          onChange={handleContentChange}
                          placeholder="Start writing your story..."
                          className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      </div>

                      {/* Preview Panel */}
                      <div className="flex flex-col">
                        <h3 className="font-medium text-gray-900 mb-2">Live Preview</h3>
                        <div 
                          id="preview-content" 
                          className="flex-1 border border-gray-300 rounded-lg p-3 bg-gray-50 overflow-auto"
                        >
                          <div dangerouslySetInnerHTML={{ __html: content }} />
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Status Information */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <strong>Legacy WS:</strong> {isConnected ? '🟢' : '🔴'}
                        </div>
                        <div>
                          <strong>Enhanced WS:</strong> {websocketStatus}
                        </div>
                        <div>
                          <strong>Active Locks:</strong> {lockStats.total}
                        </div>
                        <div>
                          <strong>Sync Status:</strong> {isOnline ? 'Synced' : 'Offline'}
                        </div>
                      </div>
                      
                      {lastMessage && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                          <strong>Last message:</strong> {lastMessage}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Conflict Resolution Dialog */}
          {showConflictDialog && conflicts.length > 0 && (
            <ConflictResolutionDialog
              conflicts={conflicts}
              onResolution={handleConflictResolution}
              onCancel={() => setShowConflictDialog(false)}
              aiSuggestions={[
                {
                  id: 'ai-suggestion-1',
                  type: 'smart_override',
                  description: 'Allow override with notification',
                  confidence: 0.85,
                  explanation: 'The requesting user has sufficient permissions and the lock is not critical.',
                  resolution: {
                    type: 'accept_new',
                    reason: 'AI-recommended override based on user permissions'
                  }
                }
              ]}
            />
          )}
        </Layout>
      )}
    </div>
  );
}