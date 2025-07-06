import { create } from 'zustand';
import { WritingMode, ModePermissions, WRITING_MODE_PERMISSIONS } from '../permissions/writingModePermissions';
import { evaluatePermission } from '../permissions/permissionEvaluator';

interface WritingModeState {
  writingMode: {
    primary: WritingMode;
    focusArea?: string;
  };
  permissions: ModePermissions;

  setWritingMode: (mode: WritingMode) => void;
  setFocusArea: (area: string | undefined) => void;
  checkPermission: (action: string) => boolean;
}

export const useWritingModeStore = create<WritingModeState>((set, get) => ({
  writingMode: {
    primary: 'discovery'
  },
  permissions: WRITING_MODE_PERMISSIONS.discovery,

  setWritingMode: (mode) => {
    const permissions = WRITING_MODE_PERMISSIONS[mode];
    set({
      writingMode: {
        ...get().writingMode,
        primary: mode,
        focusArea: undefined
      },
      permissions
    });
  },

  setFocusArea: (area) => {
    set((state) => ({
      writingMode: {
        ...state.writingMode,
        focusArea: area
      }
    }));
  },

  checkPermission: (action) => {
    const { permissions } = get();
    return evaluatePermission(permissions, action);
  }
}));
