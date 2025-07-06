import { render, screen } from '@testing-library/react';
import { HybridEditor } from '../HybridEditor';
import { useLockStore } from '../../../hooks/useLockStore';

// Mock the store
jest.mock('../../../hooks/useLockStore', () => ({
  useLockStore: jest.fn()
}));

describe('HybridEditor', () => {
  const mockFile = {
    id: 'file-1',
    name: 'Test File',
    type: 'scene' as const,
    editStatus: 'saved' as const,
    gitStatus: 'committed' as const,
    content: 'Test content'
  };

  beforeEach(() => {
    (useLockStore as jest.Mock).mockReturnValue({
      locks: {}
    });
  });

  it('renders Tiptap editor for scene files', () => {
    render(<HybridEditor file={mockFile} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('respects lock level', () => {
    (useLockStore as jest.Mock).mockReturnValue({
      locks: {
        'file-1': {
          id: 'file-1',
          level: 'frozen'
        }
      }
    });

    render(<HybridEditor file={mockFile} />);
    const editor = screen.getByRole('textbox');
    expect(editor).toHaveAttribute('contenteditable', 'false');
  });

  it('shows lock indicator when file is locked', () => {
    (useLockStore as jest.Mock).mockReturnValue({
      locks: {
        'file-1': {
          id: 'file-1',
          level: 'soft'
        }
      }
    });

    render(<HybridEditor file={mockFile} />);
    expect(screen.getByText('AI suggestions only')).toBeInTheDocument();
  });
});
