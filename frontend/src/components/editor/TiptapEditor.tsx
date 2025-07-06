import { FC, useCallback } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { EditorToolbar } from './EditorToolbar';
import { Lock } from '../../hooks/useLockStore';
import { ProjectFile } from '../panels/FileTreeItem';

interface TiptapEditorProps {
  file: ProjectFile;
  config: {
    readOnly: boolean;
    showLockIndicator: boolean;
    aiSuggestionsOnly: boolean;
    confirmEdits: boolean;
    lock?: Lock;
  };
  onSave?: (content: string) => void;
}

export const TiptapEditor: FC<TiptapEditorProps> = ({ file, config, onSave }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: file.content,
    editable: !config.readOnly,
  });

  const handleSave = useCallback(() => {
    if (editor && onSave) {
      onSave(editor.getHTML());
    }
  }, [editor, onSave]);

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-editor flex flex-col h-full">
      <EditorToolbar
        lock={config.lock}
        onSave={handleSave}
        readOnly={config.readOnly}
      />
      <div className="flex-1 overflow-auto p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
