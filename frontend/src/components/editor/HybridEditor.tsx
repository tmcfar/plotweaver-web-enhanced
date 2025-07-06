import { FC, Suspense } from 'react';
import { TiptapEditor, MonacoEditor } from './lazyEditors';
import { useLockStore } from '../../hooks/useLockStore';
import { ProjectFile } from '../panels/FileTreeItem';

interface HybridEditorProps {
  file: ProjectFile;
  onSave?: (content: string) => void;
}

export const HybridEditor: FC<HybridEditorProps> = ({ file, onSave }) => {
  const { locks } = useLockStore();
  const lock = locks[file.id];

  const editorConfig = {
    readOnly: lock?.level === 'frozen',
    showLockIndicator: !!lock,
    aiSuggestionsOnly: lock?.level === 'soft',
    confirmEdits: lock?.level === 'hard',
    lock,
  };

  // Determine which editor to use based on file type
  if (file.type === 'scene') {
    return (
      <Suspense fallback={<div>Loading Tiptap editor...</div>}>
        <TiptapEditor file={file} config={editorConfig} onSave={onSave} />
      </Suspense>
    );
  } else if (file.type === 'metadata') {
    return (
      <Suspense fallback={<div>Loading Monaco editor...</div>}>
        <MonacoEditor file={file} config={editorConfig} onSave={onSave} />
      </Suspense>
    );
  }

  return null;
};
