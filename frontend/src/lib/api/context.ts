import { APIResponse } from '../../types/common';

export interface ContextComponent {
  id: string;
  type: 'character' | 'location' | 'plot' | 'theme' | 'worldbuilding';
  name: string;
  description: string;
  relevance: number;
  dependencies: string[];
  metadata: Record<string, any>;
}

export interface ContextValidation {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ContextSuggestion {
  id: string;
  type: ContextComponent['type'];
  name: string;
  description: string;
  relevance: number;
  reasoning: string;
}

export interface ContextBuildRequest {
  projectId: string;
  sceneId?: string;
  targetLength?: number;
  includeTypes?: ContextComponent['type'][];
  excludeComponents?: string[];
}

export const fetchAvailableComponents = async (projectId: string): Promise<ContextComponent[]> => {
  const response = await fetch(`/api/context/${projectId}/components`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch available components: ${response.statusText}`);
  }
  
  return response.json();
};

export const validateContext = async (
  projectId: string,
  componentIds: string[]
): Promise<ContextValidation> => {
  const response = await fetch(`/api/context/${projectId}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ componentIds }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to validate context: ${response.statusText}`);
  }
  
  return response.json();
};

export const suggestComponents = async (
  request: ContextBuildRequest
): Promise<ContextSuggestion[]> => {
  const response = await fetch(`/api/context/${request.projectId}/suggest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get component suggestions: ${response.statusText}`);
  }
  
  return response.json();
};

export const buildContext = async (
  projectId: string,
  componentIds: string[]
): Promise<APIResponse<{ contextId: string; components: ContextComponent[] }>> => {
  const response = await fetch(`/api/context/${projectId}/build`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ componentIds }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to build context: ${response.statusText}`);
  }
  
  return response.json();
};

export const saveContextPreset = async (
  projectId: string,
  name: string,
  componentIds: string[]
): Promise<APIResponse<{ presetId: string }>> => {
  const response = await fetch(`/api/context/${projectId}/presets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, componentIds }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to save context preset: ${response.statusText}`);
  }
  
  return response.json();
};