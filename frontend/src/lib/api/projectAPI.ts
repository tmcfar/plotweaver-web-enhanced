import { ProjectFile } from '../../components/panels/FileTreeItem';

interface ProjectFiles {
  concept?: ProjectFile;
  characters?: ProjectFile[];
}

// This is a mock API implementation
export const projectAPI = {
  getFiles: async (): Promise<ProjectFiles> => {
    // Mock data
    return {
      concept: {
        id: 'concept-1',
        name: 'Story Concept',
        type: 'scene',
        editStatus: 'saved',
        gitStatus: 'committed',
        content: 'Story concept content...'
      },
      characters: [
        {
          id: 'char-1',
          name: 'Main Character',
          type: 'metadata',
          editStatus: 'saved',
          gitStatus: 'committed',
          content: 'Main character details...'
        }
      ]
    };
  },

  saveFile: async (
    _projectId: string,
    fileId: string,
    content: string
  ): Promise<ProjectFile> => {
    // Mock implementation
    return {
      id: fileId,
      name: 'Updated File',
      type: 'scene',
      editStatus: 'saved',
      gitStatus: 'modified',
      content
    };
  }
};
