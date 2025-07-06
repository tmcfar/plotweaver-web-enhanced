import { WritingMode } from '../lib/permissions/writingModePermissions';

interface WritingModeConfig {
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const WRITING_MODE_CONFIGS: Record<WritingMode, WritingModeConfig> = {
  discovery: {
    label: 'Discovery',
    icon: '🔍',
    color: '#0EA5E9',
    description: 'Explore and create'
  },
  refinement: {
    label: 'Refinement',
    icon: '🎯',
    color: '#F97316',
    description: 'Polish and perfect'
  },
  polish: {
    label: 'Polish',
    icon: '✨',
    color: '#8B5CF6',
    description: 'Final touches'
  }
};
