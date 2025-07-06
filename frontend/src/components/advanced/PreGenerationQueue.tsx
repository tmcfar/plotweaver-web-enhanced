// src/components/advanced/PreGenerationQueue.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, X, ChevronUp, ChevronDown, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { useNotifications } from '../notifications/NotificationProvider';

interface QueuedScene {
  id: string;
  title: string;
  chapterId: string;
  chapterTitle: string;
  position: number;
  status: 'queued' | 'generating' | 'completed' | 'failed' | 'paused';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimatedTokens: number;
  estimatedCost: number;
  estimatedTime: number; // in seconds
  queuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress?: number; // 0-100
  error?: string;
  context: {
    characters: string[];
    settings: string[];
    plotPoints: string[];
  };
  generatedContent?: string;
  wordCount?: number;
}

interface PreGenerationQueueProps {
  projectId: string;
  queuedScenes: QueuedScene[];
  onQueueUpdate: (scenes: QueuedScene[]) => void;
  onGenerationStart: (sceneId: string) => void;
  onGenerationCancel: (sceneId: string) => void;
  onGenerationPause: (sceneId: string) => void;
  onGenerationResume: (sceneId: string) => void;
  isProcessing: boolean;
}

export const PreGenerationQueue: React.FC<PreGenerationQueueProps> = ({
  projectId,
  queuedScenes,
  onQueueUpdate,
  onGenerationStart,
  onGenerationCancel,
  onGenerationPause,
  onGenerationResume,
  isProcessing
}) => {
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'queued' | 'generating' | 'completed' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'position' | 'queuedAt'>('priority');

  const { addNotification } = useNotifications();

  // Auto-refresh queue status
  useEffect(() => {
    const interval = setInterval(() => {
      // Mock progress updates for generating scenes
      const updatedScenes = queuedScenes.map(scene => {
        if (scene.status === 'generating' && scene.progress !== undefined) {
          const newProgress = Math.min(scene.progress + Math.random() * 10, 100);
          if (newProgress >= 100) {
            return {
              ...scene,
              status: 'completed' as const,
              progress: 100,
              completedAt: new Date(),
              generatedContent: 'Generated scene content...',
              wordCount: Math.floor(Math.random() * 1000) + 500
            };
          }
          return { ...scene, progress: newProgress };
        }
        return scene;
      });
      
      if (JSON.stringify(updatedScenes) !== JSON.stringify(queuedScenes)) {
        onQueueUpdate(updatedScenes);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [queuedScenes, onQueueUpdate]);

  const filteredScenes = queuedScenes
    .filter(scene => filter === 'all' || scene.status === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { urgent: 3, high: 2, normal: 1, low: 0 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'position':
          return a.position - b.position;
        case 'queuedAt':
          return b.queuedAt.getTime() - a.queuedAt.getTime();
        default:
          return 0;
      }
    });

  const moveInQueue = useCallback((sceneId: string, direction: 'up' | 'down') => {
    const currentIndex = queuedScenes.findIndex(s => s.id === sceneId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= queuedScenes.length) return;

    const updatedScenes = [...queuedScenes];
    [updatedScenes[currentIndex], updatedScenes[newIndex]] = [updatedScenes[newIndex], updatedScenes[currentIndex]];
    
    onQueueUpdate(updatedScenes);
    
    addNotification({
      type: 'info',
      title: 'Queue Updated',
      message: `Moved "${updatedScenes[newIndex].title}" ${direction} in queue`
    });
  }, [queuedScenes, onQueueUpdate, addNotification]);

  const updatePriority = useCallback((sceneId: string, priority: QueuedScene['priority']) => {
    const updatedScenes = queuedScenes.map(scene =>
      scene.id === sceneId ? { ...scene, priority } : scene
    );
    onQueueUpdate(updatedScenes);
  }, [queuedScenes, onQueueUpdate]);

  const getStatusIcon = (status: QueuedScene['status']) => {
    switch (status) {
      case 'queued':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'generating':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority: QueuedScene['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalEstimatedCost = filteredScenes
    .filter(s => s.status === 'queued')
    .reduce((sum, scene) => sum + scene.estimatedCost, 0);

  const totalEstimatedTime = filteredScenes
    .filter(s => s.status === 'queued')
    .reduce((sum, scene) => sum + scene.estimatedTime, 0);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Pre-Generation Queue</h2>
            <p className="text-sm text-gray-600">
              {filteredScenes.length} scenes • Est. ${totalEstimatedCost.toFixed(2)} • {formatTime(totalEstimatedTime)}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {isProcessing ? (
              <button
                onClick={() => onGenerationPause(queuedScenes.find(s => s.status === 'generating')?.id || '')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center space-x-2"
              >
                <Pause className="w-4 h-4" />
                <span>Pause Queue</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  const nextScene = queuedScenes.find(s => s.status === 'queued');
                  if (nextScene) onGenerationStart(nextScene.id);
                }}
                disabled={!queuedScenes.some(s => s.status === 'queued')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Start Queue</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Scenes</option>
            <option value="queued">Queued</option>
            <option value="generating">Generating</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="priority">Sort by Priority</option>
            <option value="position">Sort by Position</option>
            <option value="queuedAt">Sort by Queue Time</option>
          </select>
        </div>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto">
        {filteredScenes.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No scenes in queue</p>
            <p className="text-sm">Queue scenes for background generation</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredScenes.map((scene, index) => (
              <div
                key={scene.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  selectedScene === scene.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                }`}
                onClick={() => setSelectedScene(selectedScene === scene.id ? null : scene.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {getStatusIcon(scene.status)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">{scene.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(scene.priority)}`}>
                          {scene.priority}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600">
                        {scene.chapterTitle} • Position {scene.position}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">
                          ~{scene.estimatedTokens} tokens
                        </span>
                        <span className="text-xs text-gray-500">
                          ${scene.estimatedCost.toFixed(3)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(scene.estimatedTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Priority Selector */}
                    <select
                      value={scene.priority}
                      onChange={(e) => updatePriority(scene.id, e.target.value as any)}
                      onClick={(e) => e.stopPropagation()}
                      className="px-2 py-1 text-xs border border-gray-300 rounded"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>

                    {/* Queue Position Controls */}
                    {scene.status === 'queued' && (
                      <div className="flex flex-col">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveInQueue(scene.id, 'up');
                          }}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveInQueue(scene.id, 'down');
                          }}
                          disabled={index === filteredScenes.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1">
                      {scene.status === 'generating' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onGenerationPause(scene.id);
                          }}
                          className="p-1 text-yellow-600 hover:bg-yellow-100 rounded"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      
                      {scene.status === 'paused' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onGenerationResume(scene.id);
                          }}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}

                      {scene.status === 'completed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPreview(showPreview === scene.id ? null : scene.id);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onGenerationCancel(scene.id);
                        }}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {scene.status === 'generating' && scene.progress !== undefined && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-blue-600 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${scene.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(scene.progress)}% complete
                    </p>
                  </div>
                )}

                {/* Expanded Details */}
                {selectedScene === scene.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Context</h4>
                        <div className="space-y-1 text-gray-600">
                          <p>Characters: {scene.context.characters.join(', ')}</p>
                          <p>Settings: {scene.context.settings.join(', ')}</p>
                          <p>Plot: {scene.context.plotPoints.join(', ')}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Timeline</h4>
                        <div className="space-y-1 text-gray-600">
                          <p>Queued: {scene.queuedAt.toLocaleTimeString()}</p>
                          {scene.startedAt && <p>Started: {scene.startedAt.toLocaleTimeString()}</p>}
                          {scene.completedAt && <p>Completed: {scene.completedAt.toLocaleTimeString()}</p>}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Results</h4>
                        <div className="space-y-1 text-gray-600">
                          {scene.wordCount && <p>Words: {scene.wordCount.toLocaleString()}</p>}
                          {scene.error && <p className="text-red-600">Error: {scene.error}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content Preview */}
                {showPreview === scene.id && scene.generatedContent && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Generated Content Preview</h4>
                    <div className="p-3 bg-gray-50 rounded text-sm text-gray-700 max-h-32 overflow-y-auto">
                      {scene.generatedContent.substring(0, 500)}
                      {scene.generatedContent.length > 500 && '...'}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};