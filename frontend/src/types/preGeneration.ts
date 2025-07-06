export interface PreGeneratedScene {
  id: string;
  title: string;
  content: string;
  summary: string;
  preview: string;
  generatedAt: Date;
  scores: UsabilityScores;
}

export interface UsabilityScores {
  plotAlignment: number;
  characterConsistency: number;
  contextRelevance: number;
  overallQuality: number;
  overall: number;
}

export interface GeneratedScene {
  id: string;
  title: string;
  content: string;
  summary: string;
  generatedAt: Date;
}

export interface SceneSpec {
  id: string;
  title: string;
  plotPoint?: string;
  emotionalTone?: string;
  content?: string;
}

// Basic interfaces for the context
export interface Character {
  id: string;
  name: string;
  role?: string;
  traits?: string[];
}

export interface Setting {
  id: string;
  name: string;
  description?: string;
  atmosphere?: string;
}

export interface SceneContext {
  previousScenes: PreGeneratedScene[];
  characters: Character[];
  setting: Setting;
  plotPoint?: string;
  emotionalTone?: string;
}

export interface PreGeneratedSceneCardProps {
  scene: PreGeneratedScene;
  onUse: () => void;
  onDiscard: () => void;
}

export interface Project {
  id: string;
  getCurrentSceneIndex: () => number;
  getScenes: () => SceneSpec[];
  getScenesBefore: (sceneId: string, count: number) => Promise<PreGeneratedScene[]>;
  getCharactersInScene: (sceneId: string) => Promise<Character[]>;
  getSceneSetting: (sceneId: string) => Promise<Setting>;
}