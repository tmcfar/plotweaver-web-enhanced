import { FC, useState } from 'react';
import { usePreGeneration } from '../../hooks/usePreGeneration';
import { PreGeneratedScenesList } from './PreGeneratedScenesList';

export const PreGenerationIndicator: FC = () => {
  const { preGenerated, isEnabled } = usePreGeneration();
  const [showList, setShowList] = useState(false);
  
  if (!isEnabled || !preGenerated.size) {
    return null;
  }
  
  return (
    <div className="pre-generation-indicator">
      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-blue-600">✨</span>
          <span className="text-sm font-medium">{preGenerated.size} scenes ready</span>
        </div>
        
        <button
          onClick={() => setShowList(!showList)}
          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          {showList ? 'Hide' : 'View'}
        </button>
      </div>
      
      {showList && (
        <div className="mt-2 p-4 bg-white border rounded-lg shadow-sm">
          <PreGeneratedScenesList 
            scenes={Array.from(preGenerated.values())} 
            onClose={() => setShowList(false)}
          />
        </div>
      )}
    </div>
  );
};