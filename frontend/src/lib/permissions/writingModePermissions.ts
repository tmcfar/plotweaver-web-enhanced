export type WritingMode = 'discovery' | 'refinement' | 'polish';

export type Permission = boolean | 'voice-only' | 'content-only' | 'details-only' | 'line-edits-only';

export interface ModePermissions {
  plotChanges: Permission;
  characterEdits: Permission;
  sceneCrud: Permission;
  settingModifications: Permission;
  lockingAllowed: boolean;
}

export const WRITING_MODE_PERMISSIONS: Record<WritingMode, ModePermissions> = {
  discovery: {
    plotChanges: true,
    characterEdits: true,
    sceneCrud: true,
    settingModifications: true,
    lockingAllowed: true
  },
  refinement: {
    plotChanges: false,
    characterEdits: 'voice-only',
    sceneCrud: 'content-only',
    settingModifications: 'details-only',
    lockingAllowed: true
  },
  polish: {
    plotChanges: false,
    characterEdits: false,
    sceneCrud: 'line-edits-only',
    settingModifications: false,
    lockingAllowed: false
  }
};
