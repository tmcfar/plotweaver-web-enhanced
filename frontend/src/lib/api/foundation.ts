import { APIResponse } from '../../types/common';

export interface FoundationStatus {
  isLocked: boolean;
  lockedBy: string | null;
  lockedAt: string | null;
  components: string[];
  isValid: boolean;
}

export interface FoundationValidation {
  isValid: boolean;
  issues: string[];
  warnings: string[];
}

export const fetchFoundationStatus = async (projectId: string): Promise<FoundationStatus> => {
  const response = await fetch(`/api/foundation/${projectId}/status`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch foundation status: ${response.statusText}`);
  }
  
  return response.json();
};

export const lockComponents = async (projectId: string, componentIds: string[]): Promise<APIResponse<void>> => {
  const response = await fetch(`/api/foundation/${projectId}/lock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ componentIds }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to lock components: ${response.statusText}`);
  }
  
  return response.json();
};

export const validateFoundation = async (projectId: string): Promise<FoundationValidation> => {
  const response = await fetch(`/api/foundation/${projectId}/validate`);
  
  if (!response.ok) {
    throw new Error(`Failed to validate foundation: ${response.statusText}`);
  }
  
  return response.json();
};