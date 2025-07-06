import { FC } from 'react';
import { PreGeneratedScene } from '../../types/preGeneration';
import { PreGeneratedSceneCard } from './PreGeneratedSceneCard';

interface PreGeneratedScenesListProps {
  scenes: PreGeneratedScene[];
  onClose?: () => void;
}

export const PreGeneratedScenesList: FC<PreGeneratedScenesListProps> = ({ 
  scenes, 
  onClose 
}) => {
  const handleUseScene = (scene: PreGeneratedScene) => {
    // In a real app, this would integrate with the editor
    console.log('Using pre-generated scene:', scene.id);
    onClose?.();
  };
  
  const handleDiscardScene = (scene: PreGeneratedScene) => {
    // In a real app, this would remove from the pre-generated cache
    console.log('Discarding pre-generated scene:', scene.id);
  };
  
  if (scenes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No pre-generated scenes available</p>
      </div>
    );
  }
  
  return (
    <div className="pre-generated-scenes-list">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Pre-Generated Scenes</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {scenes.map(scene => (
          <PreGeneratedSceneCard
            key={scene.id}
            scene={scene}
            onUse={() => handleUseScene(scene)}
            onDiscard={() => handleDiscardScene(scene)}
          />
        ))}
      </div>
    </div>
  );
};