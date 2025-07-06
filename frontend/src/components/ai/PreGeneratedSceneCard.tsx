import { FC, useState } from 'react';
import { PreGeneratedSceneCardProps } from '../../types/preGeneration';

export const PreGeneratedSceneCard: FC<PreGeneratedSceneCardProps> = ({ 
  scene, 
  onUse, 
  onDiscard 
}) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="pre-generated-scene-card bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-lg">{scene.title}</h4>
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          {Math.round(scene.scores.overall * 100)}% match
        </span>
      </div>
      
      <div className="space-y-3">
        <p className="text-sm text-gray-600">{scene.summary}</p>
        
        {expanded && (
          <div className="scene-preview">
            <div className="max-h-48 overflow-y-auto p-3 bg-gray-50 rounded text-sm">
              {scene.preview}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="font-medium">Plot:</span> {Math.round(scene.scores.plotAlignment * 100)}%
              </div>
              <div>
                <span className="font-medium">Characters:</span> {Math.round(scene.scores.characterConsistency * 100)}%
              </div>
              <div>
                <span className="font-medium">Context:</span> {Math.round(scene.scores.contextRelevance * 100)}%
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {expanded ? 'Show Less' : 'Show More'}
          </button>
          
          <div className="space-x-2">
            <button
              onClick={onDiscard}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Discard
            </button>
            <button
              onClick={onUse}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Use This Scene
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};