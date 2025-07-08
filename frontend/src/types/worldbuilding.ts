// Worldbuilding types for PlotWeaver

export interface ConceptAnalysisRequest {
  concept_text: string;
  project_path: string;
  user_preferences?: {
    detail_level?: 'minimal' | 'moderate' | 'comprehensive';
    time_investment?: string;
  };
}

export interface Assumption {
  category: string;
  key: string;
  value: string;
  confidence: number;
  reason: string;
  can_override: boolean;
  user_override?: string;
  override_timestamp?: string;
}

export interface SetupStep {
  id: string;
  type: string;
  title: string;
  required: boolean;
  estimated_minutes: number;
  completed?: boolean;
  completed_at?: string;
  skipped?: boolean;
  data?: any;
}

export interface ConceptAnalysisResponse {
  success: boolean;
  analysis: {
    genre: string;
    sub_genre?: string;
    setting_type: string;
    complexity_score: number;
    detected_elements: string[];
    themes: string[];
  };
  setup_plan: {
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
}

export interface SetupProgress {
  setup_path: string;
  total_steps: number;
  completed_steps: number;
  steps: Record<string, {
    completed: boolean;
    completed_at: string;
    data: any;
  }>;
  last_updated: string;
}

export interface WorldbuildingStatus {
  has_worldbuilding: boolean;
  setup_complete: boolean;
  project_path?: string;
  error?: string;
}

export interface SetupPath {
  type: 'minimal' | 'guided' | 'detailed';
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
