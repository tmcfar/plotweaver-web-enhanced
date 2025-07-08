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
