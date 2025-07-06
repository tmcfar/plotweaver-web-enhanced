import { useState, useEffect } from 'react';
import { PreGeneratedScene, Project } from '../types/preGeneration';
import { PreGenerationManager } from '../lib/pregeneration/PreGenerationManager';
import { useGlobalStore } from '../lib/store';
import { preGenerationAPI } from '../lib/api/preGeneration';

export function usePreGeneration() {
  const { modeSet, currentProject } = useGlobalStore();
  const [preGenerated, setPreGenerated] = useState<Map<string, PreGeneratedScene>>(new Map());
  
  // Only active for AI-First mode
  const isEnabled = modeSet === 'ai-first';
  
  useEffect(() => {
    if (!isEnabled || !currentProject) return;
    
    const generator = new PreGenerationManager(currentProject as Project);
    
    generator.on('scene-ready', (scene: PreGeneratedScene) => {
      setPreGenerated(prev => new Map(prev).set(scene.id, scene));
    });
    
    generator.start();
    
    return () => {
      generator.stop();
      generator.removeAllListeners();
    };
  }, [isEnabled, currentProject]);
  
  const usePreGenerated = async (sceneId: string) => {
    const scene = preGenerated.get(sceneId);
    if (!scene) return null;
    
    // Validate it's still usable
    const scores = await validatePreGenerated(scene);
    if (scores.overall < 0.7) return null;
    
    return scene;
  };
  
  const validatePreGenerated = async (scene: PreGeneratedScene) => {
    try {
      return await preGenerationAPI.validateScene(scene);
    } catch (error) {
      console.error('Failed to validate pre-generated scene:', error);
      return scene.scores;
    }
  };
  
  return { 
    preGenerated, 
    usePreGenerated,
    isEnabled
  };
}