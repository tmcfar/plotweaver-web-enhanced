import { FC } from 'react';
import { FileTreeSection } from './FileTreeSection';
import { FileTreeItem, ProjectFile } from './FileTreeItem';
import { useLockStore } from '../../hooks/useLockStore';

interface FileTreeProps {
  files: {
    concept?: ProjectFile;
    characters?: ProjectFile[];
  };
  onFileSelect: (file: ProjectFile) => void;
}

export const FileTree: FC<FileTreeProps> = ({ files, onFileSelect }) => {
  const { locks } = useLockStore();

  return (
    <div className="file-tree">
      <FileTreeSection title="Story Concept" icon="📖" defaultExpanded>
        {files.concept && (
          <FileTreeItem
            file={files.concept}
            lock={locks[files.concept.id]}
            onSelect={onFileSelect}
          />
        )}
      </FileTreeSection>

      <FileTreeSection title="Characters" icon="👥" defaultExpanded>
        {files.characters?.map((character) => (
          <FileTreeItem
            key={character.id}
            file={character}
            lock={locks[character.id]}
            onSelect={onFileSelect}
          />
        ))}
      </FileTreeSection>
    </div>
  );
};
