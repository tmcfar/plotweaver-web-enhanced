import { renderHook, waitFor } from '@testing-library/react';
import { useProjectFiles } from '../useProjectFiles';
import { projectAPI } from '../../lib/api/projectAPI';
import { TestWrapper } from '../../test-utils/TestWrapper';

// Mock the API
jest.mock('../../lib/api/projectAPI', () => ({
  projectAPI: {
    getFiles: jest.fn(),
    saveFile: jest.fn()
  }
}));

describe('useProjectFiles', () => {
  const mockProjectFiles = {
    concept: {
      id: 'concept-1',
      name: 'Story Concept',
      type: 'scene',
      editStatus: 'saved',
      gitStatus: 'committed',
      content: 'Content'
    },
    characters: []
  };

  beforeEach(() => {
    (projectAPI.getFiles as jest.Mock).mockResolvedValue(mockProjectFiles);
  });

  it('fetches project files', async () => {
    const { result } = renderHook(() => useProjectFiles('project-1'), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.files).toEqual(mockProjectFiles);
    });
  });

  it('saves file content', async () => {
    const updatedFile = {
      ...mockProjectFiles.concept,
      content: 'New content'
    };

    (projectAPI.saveFile as jest.Mock).mockResolvedValue(updatedFile);

    const { result } = renderHook(() => useProjectFiles('project-1'), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.saveFile).toBeDefined();
    });

    result.current.saveFile({
      fileId: 'concept-1',
      content: 'New content'
    });

    await waitFor(() => {
      expect(projectAPI.saveFile).toHaveBeenCalledWith(
        'project-1',
        'concept-1',
        'New content'
      );
    });
  });
});
