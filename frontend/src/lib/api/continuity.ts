import { ContinuityIssue, Fix } from '../../types/continuity';

export const continuityAPI = {
  async checkScene(sceneId: string): Promise<ContinuityIssue[]> {
    const response = await fetch(`/api/continuity/check/${sceneId}`);
    if (!response.ok) throw new Error('Failed to check continuity');
    return response.json();
  },
  
  async quickCheck(sceneId: string): Promise<ContinuityIssue[]> {
    const response = await fetch(`/api/continuity/quick-check/${sceneId}`);
    if (!response.ok) return [];
    return response.json();
  },
  
  async getFixes(issueId: string): Promise<Fix[]> {
    const response = await fetch(`/api/continuity/fixes/${issueId}`);
    if (!response.ok) throw new Error('Failed to get fixes');
    return response.json();
  },
  
  async applyFix(fixId: string): Promise<void> {
    const response = await fetch('/api/continuity/apply-fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fixId })
    });
    if (!response.ok) throw new Error('Failed to apply fix');
  }
};