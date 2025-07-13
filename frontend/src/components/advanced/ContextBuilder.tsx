// src/components/advanced/ContextBuilder.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Search, Plus, X, AlertTriangle, CheckCircle, Eye, Lightbulb } from 'lucide-react';
import { useLockStore } from '../../lib/store/lockStore';
import { useNotifications } from '../notifications/NotificationSystem';

interface ProjectComponent {
  id: string;
  name: string;
  type: 'character' | 'setting' | 'plot' | 'scene' | 'worldbuilding';
  description: string;
  locked: boolean;
  lockLevel?: 'soft' | 'hard' | 'frozen';
  content: string;
  tags: string[];
}

interface ContextItem {
  id: string;
  componentId: string;
  component: ProjectComponent;
  relevance: number;
  reason: string;
  order: number;
}

interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  suggestions: string[];
  estimatedTokens: number;
}

interface ValidationIssue {
  type: 'warning' | 'error';
  message: string;
  componentId?: string;
}

interface ContextBuilderProps {
  sceneId: string;
  availableComponents: ProjectComponent[];
  currentContext: ContextItem[];
  onContextUpdate: (context: ContextItem[]) => void;
  onLockValidation: (context: ContextItem[]) => Promise<ValidationResult>;
}

export const ContextBuilder: React.FC<ContextBuilderProps> = ({
  sceneId,
  availableComponents,
  currentContext,
  onContextUpdate,
  onLockValidation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [context, setContext] = useState<ContextItem[]>(currentContext);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [suggestions, setSuggestions] = useState<ProjectComponent[]>([]);

  const { locks } = useLockStore();
  const { addNotification } = useNotifications();

  // Filter available components
  const filteredComponents = useMemo(() => {
    return availableComponents.filter(component => {
      const matchesSearch = !searchTerm ||
        component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = selectedType === 'all' || component.type === selectedType;

      // Don't show components already in context
      const notInContext = !context.some(item => item.componentId === component.id);

      return matchesSearch && matchesType && notInContext;
    });
  }, [availableComponents, searchTerm, selectedType, context]);

  // Validate context when it changes
  useEffect(() => {
    if (context.length > 0) {
      validateContext();
    } else {
      setValidation(null);
    }
  }, [context, validateContext]);

  // Generate AI suggestions based on current context
  useEffect(() => {
    generateSuggestions();
  }, [context, sceneId, generateSuggestions]);

  const validateContext = useCallback(async () => {
    setIsValidating(true);
    try {
      const result = await onLockValidation(context);
      setValidation(result);
    } catch (error) {
      console.error('Validation failed:', error);
      addNotification('error', 'Validation Failed: Could not validate context constraints');
    } finally {
      setIsValidating(false);
    }
  }, [context, onLockValidation, addNotification]);

  const generateSuggestions = useCallback(async () => {
    if (context.length === 0) {
      setSuggestions([]);
      return;
    }

    try {
      // Mock AI suggestion - replace with actual API call
      const mockSuggestions = availableComponents
        .filter(comp => !context.some(item => item.componentId === comp.id))
        .slice(0, 3);

      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    }
  }, [context, availableComponents]);

  const addToContext = useCallback((component: ProjectComponent, reason: string = 'Manual addition') => {
    const newItem: ContextItem = {
      id: `context-${Date.now()}-${component.id}`,
      componentId: component.id,
      component,
      relevance: 0.8, // Default relevance
      reason,
      order: context.length
    };

    const updatedContext = [...context, newItem];
    setContext(updatedContext);
    onContextUpdate(updatedContext);

    addNotification('success', `Component Added: ${component.name} added to scene context`);
  }, [context, onContextUpdate, addNotification]);

  const removeFromContext = useCallback((contextItemId: string) => {
    const updatedContext = context
      .filter(item => item.id !== contextItemId)
      .map((item, index) => ({ ...item, order: index }));

    setContext(updatedContext);
    onContextUpdate(updatedContext);
  }, [context, onContextUpdate]);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(context);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values
    const updatedContext = items.map((item, index) => ({ ...item, order: index }));
    setContext(updatedContext);
    onContextUpdate(updatedContext);
  }, [context, onContextUpdate]);

  const updateRelevance = useCallback((contextItemId: string, relevance: number) => {
    const updatedContext = context.map(item =>
      item.id === contextItemId ? { ...item, relevance } : item
    );
    setContext(updatedContext);
    onContextUpdate(updatedContext);
  }, [context, onContextUpdate]);

  const getComponentIcon = (type: string) => {
    const icons = {
      character: '👤',
      setting: '🏛️',
      plot: '📖',
      scene: '🎬',
      worldbuilding: '🌍'
    };
    return icons[type as keyof typeof icons] || '📄';
  };

  const getValidationColor = (validation: ValidationResult | null) => {
    if (!validation) return 'text-gray-400';
    if (!validation.valid) return 'text-red-500';
    if (validation.issues.length > 0) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="flex h-full bg-white">
      {/* Component Browser */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold mb-3">Available Components</h3>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="character">Characters</option>
            <option value="setting">Settings</option>
            <option value="plot">Plot</option>
            <option value="scene">Scenes</option>
            <option value="worldbuilding">World Building</option>
          </select>
        </div>

        {/* Component List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredComponents.map(component => {
            const isLocked = locks[component.id];

            return (
              <div
                key={component.id}
                className={`p-3 border rounded-lg cursor-pointer hover:border-blue-300 transition-colors ${isLocked ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
                  }`}
                onClick={() => addToContext(component)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2 flex-1">
                    <span className="text-lg">{getComponentIcon(component.type)}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{component.name}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{component.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          {component.type}
                        </span>
                        {isLocked && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            {isLocked.level} locked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToContext(component);
                    }}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <h4 className="font-medium text-gray-900">AI Suggestions</h4>
            </div>
            <div className="space-y-2">
              {suggestions.map(component => (
                <div
                  key={component.id}
                  className="p-2 bg-yellow-50 border border-yellow-200 rounded cursor-pointer hover:bg-yellow-100"
                  onClick={() => addToContext(component, 'AI suggested')}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{getComponentIcon(component.type)}</span>
                    <span className="text-sm font-medium">{component.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Context Builder */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Scene Context</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center space-x-1"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
              <div className="flex items-center space-x-1">
                {isValidating ? (
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                ) : validation ? (
                  validation.valid ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )
                ) : null}
                <span className={`text-sm ${getValidationColor(validation)}`}>
                  {validation ? `${validation.estimatedTokens} tokens` : 'No validation'}
                </span>
              </div>
            </div>
          </div>

          {validation && validation.issues.length > 0 && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="text-sm font-medium text-yellow-800 mb-1">Validation Issues:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {validation.issues.map((issue, index) => (
                  <li key={index} className="flex items-start space-x-1">
                    <span>•</span>
                    <span>{issue.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Context Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {context.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No components in context</p>
              <p className="text-sm">Add components from the browser to build scene context</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              {/* @ts-ignore - DnD types issue with React 18 */}
              <Droppable droppableId="context">
                {(provided: any) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {context.map((item, index) => (
                      /* @ts-ignore - DnD types issue with React 18 */
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided: any, snapshot: any) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`p-4 border rounded-lg bg-white transition-shadow ${snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                              }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <div
                                  {...provided.dragHandleProps}
                                  className="mt-1 cursor-grab active:cursor-grabbing"
                                >
                                  <div className="w-2 h-8 bg-gray-300 rounded"></div>
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="text-lg">{getComponentIcon(item.component.type)}</span>
                                    <h4 className="font-medium text-gray-900">{item.component.name}</h4>
                                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                      {item.component.type}
                                    </span>
                                  </div>

                                  <p className="text-sm text-gray-600 mb-2">{item.reason}</p>

                                  <div className="flex items-center space-x-4">
                                    <label className="text-sm text-gray-700">
                                      Relevance:
                                      <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={item.relevance}
                                        onChange={(e) => updateRelevance(item.id, parseFloat(e.target.value))}
                                        className="ml-2 w-20"
                                      />
                                      <span className="ml-1 text-xs text-gray-500">
                                        {Math.round(item.relevance * 100)}%
                                      </span>
                                    </label>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => removeFromContext(item.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder as React.ReactNode}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

        {/* Context Preview */}
        {showPreview && context.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50 max-h-48 overflow-y-auto">
            <h4 className="font-medium mb-2">Context Preview</h4>
            <div className="text-sm text-gray-700 space-y-2">
              {context
                .sort((a, b) => b.relevance - a.relevance)
                .map(item => (
                  <div key={item.id} className="flex items-start space-x-2">
                    <span className="font-medium">{item.component.name}:</span>
                    <span className="line-clamp-2">{item.component.content || item.component.description}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};