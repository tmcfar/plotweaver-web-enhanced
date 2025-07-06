import { PreGeneratedScene, UsabilityScores } from '../../types/preGeneration';

export const preGenerationAPI = {
  async validateScene(scene: PreGeneratedScene): Promise<UsabilityScores> {
    const response = await fetch('/api/pre-generation/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene })
    });
    if (!response.ok) throw new Error('Failed to validate scene');
    return response.json();
  },
  
  async getPreGeneratedScenes(projectId: string): Promise<PreGeneratedScene[]> {
    const response = await fetch(`/api/pre-generation/scenes/${projectId}`);
    if (!response.ok) return [];
    return response.json();
  }
};