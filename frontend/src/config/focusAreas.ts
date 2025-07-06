import { WritingMode } from '../lib/permissions/writingModePermissions';

export interface FocusArea {
  value: string;
  label: string;
  description: string;
  enabledFeatures: string[];
}

export const FOCUS_AREAS: Record<WritingMode, FocusArea[]> = {
  discovery: [
    {
      value: 'world-building',
      label: 'World Building',
      description: 'Create settings and environments',
      enabledFeatures: ['location-editor', 'culture-builder', 'timeline-tool']
    },
    {
      value: 'plot-architecture',
      label: 'Plot Architecture',
      description: 'Design story structure',
      enabledFeatures: ['plot-board', 'beat-sheet', 'conflict-mapper']
    },
    {
      value: 'character-creation',
      label: 'Character Creation',
      description: 'Develop characters',
      enabledFeatures: ['character-builder', 'relationship-map', 'voice-sampler']
    },
    {
      value: 'free-writing',
      label: 'Free Writing',
      description: 'Write without constraints',
      enabledFeatures: ['distraction-free', 'auto-save', 'word-sprints']
    }
  ],
  refinement: [
    {
      value: 'character-voice',
      label: 'Character Voice',
      description: 'Perfect dialogue and voice',
      enabledFeatures: ['voice-analyzer', 'dialogue-editor', 'consistency-checker']
    },
    {
      value: 'pacing-rhythm',
      label: 'Pacing & Rhythm',
      description: 'Adjust story flow',
      enabledFeatures: ['pacing-analyzer', 'scene-length-optimizer', 'tension-graph']
    },
    {
      value: 'emotional-beats',
      label: 'Emotional Beats',
      description: 'Enhance emotional impact',
      enabledFeatures: ['emotion-tracker', 'arc-visualizer', 'impact-scorer']
    },
    {
      value: 'continuity-check',
      label: 'Continuity Check',
      description: 'Fix inconsistencies',
      enabledFeatures: ['continuity-scanner', 'timeline-validator', 'fact-checker']
    }
  ],
  polish: [
    {
      value: 'line-editing',
      label: 'Line Editing',
      description: 'Word-level improvements',
      enabledFeatures: ['grammar-checker', 'style-editor', 'word-choice-assistant']
    },
    {
      value: 'dialogue-polish',
      label: 'Dialogue Polish',
      description: 'Perfect conversations',
      enabledFeatures: ['dialogue-formatter', 'tag-optimizer', 'subtext-enhancer']
    },
    {
      value: 'sensory-detail',
      label: 'Sensory Detail',
      description: 'Enhance descriptions',
      enabledFeatures: ['sensory-scanner', 'detail-suggester', 'immersion-checker']
    },
    {
      value: 'final-read',
      label: 'Final Read',
      description: 'Last review pass',
      enabledFeatures: ['read-aloud', 'flow-checker', 'export-preview']
    }
  ]
};
