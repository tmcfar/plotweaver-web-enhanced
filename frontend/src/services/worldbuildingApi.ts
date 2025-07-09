import axios from 'axios';
import type {
  ConceptAnalysisRequest,
  ConceptAnalysisResponse,
  SetupProgress,
  WorldbuildingStatus,
  SetupPath,
  SetupStepCompleteRequest,
  AssumptionOverrideRequest
} from '@/types/worldbuilding';

const BFF_BASE_URL = process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:8000';

const bffClient = axios.create({
  baseURL: BFF_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // 30 seconds for analysis
});

// Add auth interceptor
bffClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const worldbuildingApi = {
  analyzeConcept: async (data: ConceptAnalysisRequest): Promise<ConceptAnalysisResponse> => {
    const response = await bffClient.post('/api/worldbuilding/analyze-concept', data);
    return response.data;
  },

  getSetupProgress: async (projectPath?: string): Promise<SetupProgress> => {
    const response = await bffClient.get('/api/worldbuilding/setup-progress', {
      params: projectPath ? { project_path: projectPath } : {}
    });
    return response.data;
  },

  completeSetupStep: async (stepId: string, data: SetupStepCompleteRequest): Promise<any> => {
    const response = await bffClient.post(`/api/worldbuilding/setup-steps/${stepId}/complete`, data);
    return response.data;
  },

  overrideAssumption: async (assumptionKey: string, data: AssumptionOverrideRequest): Promise<any> => {
    const response = await bffClient.put(`/api/worldbuilding/assumptions/${assumptionKey}/override`, data);
    return response.data;
  },

  getSetupPaths: async (): Promise<{ paths: SetupPath[] }> => {
    const response = await bffClient.get('/api/worldbuilding/setup-paths');
    return response.data;
  },

  getWorldbuildingStatus: async (projectPath?: string): Promise<WorldbuildingStatus> => {
    const response = await bffClient.get('/api/worldbuilding/status', {
      params: projectPath ? { project_path: projectPath } : {}
    });
    return response.data;
  },
};

export default worldbuildingApi;