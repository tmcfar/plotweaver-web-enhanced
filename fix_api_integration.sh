#!/bin/bash

# Quick fix script for PlotWeaver API integration issues

echo "Fixing PlotWeaver API Integration Issues..."
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fix 1: Update worldbuilding components to use correct BFF URL
echo -e "\n${YELLOW}Fix 1: Updating worldbuilding component API calls...${NC}"

# Update ConceptSeedInput.tsx
if [ -f "frontend/src/components/worldbuilding/ConceptSeedInput.tsx" ]; then
  sed -i "s|'/api/worldbuilding/analyze-concept'|'http://localhost:8000/api/worldbuilding/analyze-concept'|g" \
    frontend/src/components/worldbuilding/ConceptSeedInput.tsx
fi

# Update SetupWizard.tsx
if [ -f "frontend/src/components/worldbuilding/SetupWizard.tsx" ]; then
  sed -i "s|'/api/worldbuilding/|'http://localhost:8000/api/worldbuilding/|g" \
    frontend/src/components/worldbuilding/SetupWizard.tsx
fi

# Update AssumptionReview.tsx
if [ -f "frontend/src/components/worldbuilding/AssumptionReview.tsx" ]; then
  sed -i "s|'/api/worldbuilding/|'http://localhost:8000/api/worldbuilding/|g" \
    frontend/src/components/worldbuilding/AssumptionReview.tsx
fi

# Update SetupStepForm.tsx
if [ -f "frontend/src/components/worldbuilding/SetupStepForm.tsx" ]; then
  sed -i "s|'/api/worldbuilding/|'http://localhost:8000/api/worldbuilding/|g" \
    frontend/src/components/worldbuilding/SetupStepForm.tsx
fi

echo -e "${GREEN}✓ Updated component API calls to use BFF${NC}"

# Fix 2: Create worldbuilding API service
echo -e "\n${YELLOW}Fix 2: Creating worldbuilding API service...${NC}"

# Create services directory if it doesn't exist
mkdir -p frontend/src/services

cat > frontend/src/services/worldbuildingApi.ts << 'EOF'
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
  analyzeConceptapi: async (data: ConceptAnalysisRequest): Promise<ConceptAnalysisResponse> => {
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
EOF

echo -e "${GREEN}✓ Created worldbuilding API service${NC}"

# Fix 3: Update api.ts to include worldbuilding
echo -e "\n${YELLOW}Fix 3: Adding worldbuilding to main API service...${NC}"

# Add import and worldbuilding to api.ts if it exists
if [ -f "frontend/src/services/api.ts" ]; then
  sed -i "1i import { worldbuildingApi } from './worldbuildingApi';" frontend/src/services/api.ts
  sed -i "/export const api = {/,/};/ s/};/  \/\/ Worldbuilding endpoints\n  worldbuilding: worldbuildingApi,\n};/" frontend/src/services/api.ts
fi

echo -e "${GREEN}✓ Added worldbuilding to main API service${NC}"

# Fix 4: Create missing type definitions
echo -e "\n${YELLOW}Fix 4: Creating missing type definitions...${NC}"

# Check if types directory exists
mkdir -p frontend/src/types

# Create worldbuilding types if not exists
if [ ! -f frontend/src/types/worldbuilding.ts ]; then
  cat > frontend/src/types/worldbuilding.ts << 'EOF'
export interface ConceptAnalysisRequest {
  concept_text: string;
  project_path?: string;
  user_preferences?: {
    time_investment?: 'minimal' | 'moderate' | 'comprehensive';
  };
}

export interface ConceptAnalysisResponse {
  success: boolean;
  analysis?: {
    genre: string;
    sub_genre?: string;
    setting_type: 'contemporary' | 'historical' | 'fantastical' | 'futuristic';
    complexity_score: number;
    detected_elements: string[];
    themes: string[];
  };
  setup_plan?: {
    path_type: 'minimal' | 'guided' | 'detailed';
    estimated_minutes: number;
    steps: SetupStep[];
    assumptions: Assumption[];
    skippable_steps: string[];
  };
  files?: {
    analysis: string;
    assumptions: string;
    progress: string;
  };
  error?: string;
  fallback_plan?: any;
}

export interface SetupStep {
  id: string;
  type: string;
  title: string;
  required: boolean;
  estimated_minutes: number;
}

export interface Assumption {
  category: string;
  key: string;
  value: string;
  confidence: number;
  reason: string;
  can_override: boolean;
}

export interface SetupProgress {
  analysis?: any;
  progress?: {
    setup_path: string;
    total_steps: number;
    completed_steps: number;
    steps: Record<string, any>;
  };
  assumptions?: Assumption[];
}

export interface WorldbuildingStatus {
  has_worldbuilding: boolean;
  setup_complete: boolean;
  project_path?: string;
  error?: string;
}

export interface SetupPath {
  type: string;
  name: string;
  description: string;
  estimated_minutes: number;
  features: string[];
}

export interface SetupStepCompleteRequest {
  step_data: any;
  project_path: string;
}

export interface AssumptionOverrideRequest {
  value: string;
  project_path: string;
}
EOF
  echo -e "${GREEN}✓ Created worldbuilding types${NC}"
else
  echo -e "${YELLOW}⚠ Worldbuilding types already exist${NC}"
fi

# Fix 5: Update components to use API service
echo -e "\n${YELLOW}Fix 5: Updating components to use API service...${NC}"

# Update imports in components
if [ -d "frontend/src/components/worldbuilding" ]; then
  for file in frontend/src/components/worldbuilding/*.tsx; do
    if [ -f "$file" ] && grep -q "fetch(" "$file"; then
      # Add import at the top
      sed -i "1i import { worldbuildingApi } from '@/services/worldbuildingApi';\n" "$file"
      echo -e "${GREEN}✓ Updated imports in $(basename $file)${NC}"
    fi
  done
else
  echo -e "${YELLOW}⚠ Worldbuilding components directory not found${NC}"
fi

echo -e "\n${GREEN}✅ API Integration fixes complete!${NC}"
echo -e "\n${YELLOW}Manual steps required:${NC}"
echo "1. Update component methods to use worldbuildingApi instead of fetch()"
echo "2. Test the worldbuilding flow end-to-end"
echo "3. Update environment variables:"
echo "   - NEXT_PUBLIC_API_URL=http://localhost:5000"
echo "   - NEXT_PUBLIC_BFF_URL=http://localhost:8000"
echo ""
echo "Example component update:"
echo "  // Change from:"
echo "  const response = await fetch('/api/worldbuilding/analyze-concept', {...});"
echo "  // To:"
echo "  const analysis = await worldbuildingApi.analyzeConceptapi(data);"
