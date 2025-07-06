// src/components/advanced/FoundationCheckpoint.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Lock, Unlock, ArrowRight } from 'lucide-react';
import { useLockStore } from '../../store/lockStore';
import { useNotifications } from '../notifications/NotificationProvider';

interface ComponentStatus {
  id: string;
  name: string;
  type: 'setting' | 'character' | 'plot' | 'scene';
  completeness: number;
  ready: boolean;
  issues: string[];
  dependencies: string[];
}

interface FoundationStatus {
  overall_ready: boolean;
  readiness_score: number;
  components: ComponentStatus[];
  recommendations: string[];
}

interface FoundationCheckpointProps {
  projectId: string;
  onCheckpointCreate: () => void;
  onComponentLock: (componentIds: string[], lockLevel: 'soft' | 'hard' | 'frozen') => void;
}

export const FoundationCheckpoint: React.FC<FoundationCheckpointProps> = ({
  projectId,
  onCheckpointCreate,
  onComponentLock
}) => {
  const [foundationStatus, setFoundationStatus] = useState<FoundationStatus | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [lockLevel, setLockLevel] = useState<'soft' | 'hard' | 'frozen'>('hard');
  const [isLoading, setIsLoading] = useState(false);
  const [showGuidedFlow, setShowGuidedFlow] = useState(false);

  const { locks } = useLockStore();
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchFoundationStatus();
  }, [projectId]);

  const fetchFoundationStatus = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual endpoint
      const response = await fetch(`/api/projects/${projectId}/foundation-status`);
      const status = await response.json();
      setFoundationStatus(status);
    } catch (error) {
      console.error('Failed to fetch foundation status:', error);
      // Mock data for development
      setFoundationStatus({
        overall_ready: false,
        readiness_score: 0.75,
        components: [
          {
            id: 'setting-world',
            name: 'World & Setting',
            type: 'setting',
            completeness: 0.9,
            ready: true,
            issues: [],
            dependencies: []
          },
          {
            id: 'characters-main',
            name: 'Main Characters',
            type: 'character',
            completeness: 0.8,
            ready: true,
            issues: [],
            dependencies: []
          },
          {
            id: 'plot-structure',
            name: 'Plot Structure',
            type: 'plot',
            completeness: 0.6,
            ready: false,
            issues: ['Missing Act 2 climax', 'Unclear character motivations'],
            dependencies: ['characters-main']
          }
        ],
        recommendations: [
          'Complete plot structure before locking',
          'Consider soft-locking characters to allow minor adjustments',
          'Review world-building consistency'
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComponentSelect = (componentId: string) => {
    setSelectedComponents(prev => 
      prev.includes(componentId) 
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    );
  };

  const handleLockSelected = async () => {
    if (selectedComponents.length === 0) return;

    try {
      onComponentLock(selectedComponents, lockLevel);
      addNotification({
        type: 'success',
        title: 'Components Locked',
        message: `${selectedComponents.length} components locked at ${lockLevel} level`,
        actions: [
          {
            label: 'View Locks',
            action: () => console.log('Navigate to lock management')
          }
        ]
      });
      setSelectedComponents([]);
      await fetchFoundationStatus();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Lock Failed',
        message: 'Failed to lock selected components'
      });
    }
  };

  const getComponentIcon = (component: ComponentStatus) => {
    const isLocked = locks[component.id];
    if (isLocked) return <Lock className="w-4 h-4 text-orange-500" />;
    if (component.ready) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    return <AlertCircle className="w-4 h-4 text-yellow-500" />;
  };

  const getReadinessColor = (readiness: number) => {
    if (readiness >= 0.8) return 'bg-green-500';
    if (readiness >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!foundationStatus) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <p className="text-gray-500">Failed to load foundation status</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Foundation Checkpoint</h2>
          <p className="text-gray-600">Assess and lock your story foundation</p>
        </div>
        <button
          onClick={() => setShowGuidedFlow(!showGuidedFlow)}
          className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
        >
          {showGuidedFlow ? 'Manual Mode' : 'Guided Flow'}
        </button>
      </div>

      {/* Overall Readiness */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Readiness</span>
          <span className="text-sm text-gray-600">
            {Math.round(foundationStatus.readiness_score * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${getReadinessColor(foundationStatus.readiness_score)}`}
            style={{ width: `${foundationStatus.readiness_score * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Component Status */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Component Status</h3>
        <div className="space-y-3">
          {foundationStatus.components.map((component) => (
            <div 
              key={component.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedComponents.includes(component.id) 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleComponentSelect(component.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getComponentIcon(component)}
                  <div>
                    <h4 className="font-medium text-gray-900">{component.name}</h4>
                    <p className="text-sm text-gray-600">
                      {Math.round(component.completeness * 100)}% complete
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {locks[component.id] && (
                    <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                      {locks[component.id].level} locked
                    </span>
                  )}
                  <input
                    type="checkbox"
                    checked={selectedComponents.includes(component.id)}
                    onChange={() => handleComponentSelect(component.id)}
                    className="w-4 h-4 text-blue-600"
                  />
                </div>
              </div>
              
              {component.issues.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-sm text-red-600">Issues:</p>
                  <ul className="text-sm text-red-600 list-disc list-inside">
                    {component.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lock Controls */}
      {selectedComponents.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-3">Lock Selected Components</h4>
          <div className="flex items-center space-x-4 mb-3">
            <label className="text-sm text-gray-700">Lock Level:</label>
            <select
              value={lockLevel}
              onChange={(e) => setLockLevel(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="soft">Soft - Editorial suggestions allowed</option>
              <option value="hard">Hard - No modifications</option>
              <option value="frozen">Frozen - Completely locked</option>
            </select>
          </div>
          <button
            onClick={handleLockSelected}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <Lock className="w-4 h-4" />
            <span>Lock {selectedComponents.length} Components</span>
          </button>
        </div>
      )}

      {/* Recommendations */}
      {foundationStatus.recommendations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
          <ul className="space-y-2">
            {foundationStatus.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start space-x-2">
                <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={onCheckpointCreate}
          disabled={!foundationStatus.overall_ready}
          className={`px-6 py-2 rounded-md font-medium flex items-center space-x-2 ${
            foundationStatus.overall_ready
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Create Foundation Checkpoint</span>
        </button>
        <button
          onClick={fetchFoundationStatus}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
};