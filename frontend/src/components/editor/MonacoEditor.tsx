import { FC, useRef } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { EditorToolbar } from './EditorToolbar';
import { Lock } from '../../hooks/useLockStore';
import { ProjectFile } from '../panels/FileTreeItem';

interface MonacoEditorProps {
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

export const MonacoEditor: FC<MonacoEditorProps> = ({ file, config, onSave }) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorMount = (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: Monaco) => {
    editorRef.current = editor;

    // Add save command
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, () => {
      if (onSave) {
        onSave(editor.getValue());
      }
    });
  };

  const handleSave = () => {
    if (editorRef.current && onSave) {
      onSave(editorRef.current.getValue());
    }
  };

  const getLanguage = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'yaml':
      case 'yml':
        return 'yaml';
      default:
        return 'plaintext';
    }
  };

  return (
    <div className="monaco-editor flex flex-col h-full">
      <EditorToolbar
        lock={config.lock}
        onSave={!config.readOnly ? handleSave : undefined}
        readOnly={config.readOnly}
      />
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage={getLanguage(file.name)}
          value={file.content}
          options={{
            readOnly: config.readOnly,
            minimap: { enabled: false },
            wordWrap: 'on',
            lineNumbers: 'on',
          }}
          onMount={handleEditorMount}
        />
      </div>
    </div>
  );
};
