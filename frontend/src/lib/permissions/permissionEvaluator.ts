import { ModePermissions } from './writingModePermissions';

type ActionCategory = 'plotChanges' | 'characterEdits' | 'sceneCrud' | 'settingModifications';

const ACTION_MAPPINGS: Record<string, ActionCategory> = {
  'plot:create': 'plotChanges',
  'plot:edit': 'plotChanges',
  'plot:delete': 'plotChanges',
  'character:create': 'characterEdits',
  'character:edit': 'characterEdits',
  'character:delete': 'characterEdits',
  'scene:create': 'sceneCrud',
  'scene:edit': 'sceneCrud',
  'scene:delete': 'sceneCrud',
  'setting:create': 'settingModifications',
  'setting:edit': 'settingModifications',
  'setting:delete': 'settingModifications'
};

export function evaluatePermission(
  permissions: ModePermissions,
  action: string
): boolean {
  const category = ACTION_MAPPINGS[action];
  if (!category) return false;

  const permission = permissions[category];

  // Simple boolean permissions
  if (typeof permission === 'boolean') {
    return permission;
  }

  // Mode-specific restrictions
  switch (permission) {
    case 'voice-only':
      return action.includes('dialogue') || action.includes('voice');
    case 'content-only':
      return !action.includes('delete') && !action.includes('create');
    case 'details-only':
      return action.includes('edit') && action.includes('details');
    case 'line-edits-only':
      return action.includes('edit') && !action.includes('structure');
    default:
      return false;
  }
}
