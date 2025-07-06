import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectAPI } from '../lib/api/projectAPI';
import { ProjectFile } from '../components/panels/FileTreeItem';

interface SaveFileParams {
  fileId: string;
  content: string;
}

interface ProjectFilesStructure {
  concept?: ProjectFile;
  characters?: ProjectFile[];
  [key: string]: unknown;
}

const updateFileInTree = (files: ProjectFilesStructure, fileId: string, updatedFile: ProjectFile): ProjectFilesStructure => {
  if (files.concept?.id === fileId) {
    return { ...files, concept: updatedFile };
  }

  if (files.characters) {
    const updatedCharacters = files.characters.map((char: ProjectFile) =>
      char.id === fileId ? updatedFile : char
    );
    return { ...files, characters: updatedCharacters };
  }

  return files;
};

export function useProjectFiles(projectId: string) {
  const queryClient = useQueryClient();

  const filesQuery = useQuery({
    queryKey: ['project-files', projectId],
    queryFn: () => projectAPI.getFiles(projectId),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const saveFile = useMutation({
    mutationFn: ({ fileId, content }: SaveFileParams) =>
      projectAPI.saveFile(projectId, fileId, content),
    onSuccess: (data, variables) => {
      // Update cache
      queryClient.setQueryData(['project-files', projectId], (old: ProjectFilesStructure) => {
        return updateFileInTree(old, variables.fileId, data);
      });
    }
  });

  return {
    files: filesQuery.data,
    isLoading: filesQuery.isLoading,
    saveFile: saveFile.mutate
  };
}
