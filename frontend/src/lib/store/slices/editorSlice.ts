import { StateCreator, OpenFile } from '../../../types/store';
import { ProjectFile } from '../../../components/panels/FileTreeItem';

export interface EditorSlice {
  // State
  openFiles: OpenFile[];
  activeFileId: string | null;
  unsavedChanges: Record<string, boolean>;
  editorSettings: {
    showLineNumbers: boolean;
    showMinimap: boolean;
    wordWrap: 'on' | 'off' | 'bounded';
  };

  // Actions
  openFile: (file: ProjectFile) => void;
  closeFile: (fileId: string) => void;
  setActiveFile: (fileId: string) => void;
  markUnsaved: (fileId: string) => void;
  markSaved: (fileId: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  updateEditorSettings: (settings: Partial<EditorSlice['editorSettings']>) => void;
}

export const createEditorSlice: StateCreator<EditorSlice> = (set) => ({
  // Initial state
  openFiles: [],
  activeFileId: null,
  unsavedChanges: {},
  editorSettings: {
    showLineNumbers: true,
    showMinimap: true,
    wordWrap: 'on'
  },

  // Actions
  openFile: (file) => set((state) => {
    const exists = state.openFiles.find(f => f.id === file.id);
    if (exists) {
      return { activeFileId: file.id };
    }

    const newFile: OpenFile = {
      id: file.id,
      name: file.name,
      type: file.type,
      content: file.content || '',
      lastModified: new Date()
    };

    return {
      openFiles: [...state.openFiles, newFile],
      activeFileId: file.id
    };
  }),

  closeFile: (fileId) => set((state) => {
    const newOpenFiles = state.openFiles.filter(f => f.id !== fileId);
    const newActiveId = state.activeFileId === fileId
      ? newOpenFiles[0]?.id || null
      : state.activeFileId;

    // Clean up unsaved changes
    const newUnsavedChanges = { ...state.unsavedChanges };
    delete newUnsavedChanges[fileId];

    return {
      openFiles: newOpenFiles,
      activeFileId: newActiveId,
      unsavedChanges: newUnsavedChanges
    };
  }),

  setActiveFile: (fileId) => set(() => ({ activeFileId: fileId })),

  markUnsaved: (fileId) => set((state) => ({
    unsavedChanges: { ...state.unsavedChanges, [fileId]: true }
  })),

  markSaved: (fileId) => set((state) => ({
    unsavedChanges: { ...state.unsavedChanges, [fileId]: false }
  })),

  updateFileContent: (fileId, content) => set((state) => ({
    openFiles: state.openFiles.map(file =>
      file.id === fileId
        ? { ...file, content, lastModified: new Date() }
        : file
    ),
    unsavedChanges: { ...state.unsavedChanges, [fileId]: true }
  })),

  updateEditorSettings: (settings) => set((state) => ({
    editorSettings: { ...state.editorSettings, ...settings }
  }))
});