import { render, screen, waitFor } from '@testing-library/react';
import { HybridEditor } from '../HybridEditor';
import { useLockStore } from '../../../hooks/useLockStore';

// Mock the store
jest.mock('../../../hooks/useLockStore', () => ({
  useLockStore: jest.fn()
}));

// Mock the lazy editors
jest.mock('../lazyEditors', () => ({
  TiptapEditor: ({ file, config }: any) => (
    <div>
      <div role="textbox" contentEditable={!config.readOnly ? "true" : "false"}>
        Tiptap Editor: {file.name}
      </div>
      {config.showLockIndicator && config.lock?.level === 'soft' && (
        <div>AI suggestions only</div>
      )}
    </div>
  ),
  MonacoEditor: ({ file, config }: any) => (
    <div role="textbox" contentEditable={!config.readOnly ? "true" : "false"}>
      Monaco Editor: {file.name}
    </div>
  )
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

  it('renders Tiptap editor for scene files', async () => {
    render(<HybridEditor file={mockFile} />);
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
    expect(screen.getByText('Tiptap Editor: Test File')).toBeInTheDocument();
  });

  it('respects lock level', async () => {
    (useLockStore as jest.Mock).mockReturnValue({
      locks: {
        'file-1': {
          id: 'file-1',
          level: 'frozen'
        }
      }
    });

    render(<HybridEditor file={mockFile} />);
    await waitFor(() => {
      const editor = screen.getByRole('textbox');
      expect(editor).toHaveAttribute('contenteditable', 'false');
    });
  });

  it('shows lock indicator when file is locked', async () => {
    (useLockStore as jest.Mock).mockReturnValue({
      locks: {
        'file-1': {
          id: 'file-1',
          level: 'soft'
        }
      }
    });

    render(<HybridEditor file={mockFile} />);
    await waitFor(() => {
      expect(screen.getByText('AI suggestions only')).toBeInTheDocument();
    });
  });
});
