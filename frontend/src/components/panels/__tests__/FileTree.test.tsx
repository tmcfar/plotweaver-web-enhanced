import { render, screen, fireEvent } from '@testing-library/react';
import { FileTree } from '../FileTree';
import { useLockStore } from '../../../hooks/useLockStore';

// Mock the store
jest.mock('../../../hooks/useLockStore', () => ({
  useLockStore: jest.fn()
}));

describe('FileTree', () => {
  const mockFiles = {
    concept: {
      id: 'concept-1',
      name: 'Story Concept',
      type: 'scene' as const,
      editStatus: 'saved' as const,
      gitStatus: 'committed' as const,
      content: ''
    },
    characters: [
      {
        id: 'char-1',
        name: 'Character 1',
        type: 'metadata' as const,
        editStatus: 'saved' as const,
        gitStatus: 'committed' as const,
        content: ''
      }
    ]
  };

  const mockOnFileSelect = jest.fn();

  beforeEach(() => {
    (useLockStore as jest.Mock).mockReturnValue({
      locks: {}
    });
  });

  it('renders file tree with sections', () => {
    render(<FileTree files={mockFiles} onFileSelect={mockOnFileSelect} />);

    expect(screen.getByText('Story Concept', { selector: '.file-name' })).toBeInTheDocument();
    expect(screen.getByText('Characters')).toBeInTheDocument();
    expect(screen.getByText('Character 1')).toBeInTheDocument();
  });

  it('calls onFileSelect when a file is clicked', () => {
    render(<FileTree files={mockFiles} onFileSelect={mockOnFileSelect} />);

    fireEvent.click(screen.getByText('Story Concept', { selector: '.file-name' }));
    expect(mockOnFileSelect).toHaveBeenCalledWith(mockFiles.concept);
  });

  it('shows lock indicator for locked files', () => {
    (useLockStore as jest.Mock).mockReturnValue({
      locks: {
        'concept-1': {
          id: 'concept-1',
          level: 'frozen'
        }
      }
    });

    render(<FileTree files={mockFiles} onFileSelect={mockOnFileSelect} />);
    expect(screen.getByTitle('Lock level: frozen')).toBeInTheDocument();
  });
});
