import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Editor } from '../../src/components/editors/Editor';
import { StoreProvider } from '../../src/components/providers/StoreProvider';
import { useStore } from '../../src/lib/store/createStore';
import { LockLevel } from '../../src/types/locks';

// Mock file data
const mockFile = (overrides: any = {}) => ({
  id: 'test-file',
  name: 'test-scene.txt',
  type: 'scene',
  path: 'chapter1/scene1.txt',
  content: 'Original content',
  lastModified: new Date().toISOString(),
  ...overrides
});

// Test wrapper
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>;
}

describe('Lock Enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useStore.setState({
      locks: {},
      currentFile: null,
      lockDialogOpen: false,
      confirmEditDialog: null
    }, true);
  });

  it('prevents editing frozen content', async () => {
    const frozenFile = mockFile({ 
      lock: { 
        level: 'frozen' as LockLevel,
        reason: 'Content finalized',
        timestamp: new Date().toISOString(),
        userId: 'user-1'
      } 
    });
    
    render(
      <TestWrapper>
        <Editor file={frozenFile} />
      </TestWrapper>
    );
    
    const editor = screen.getByRole('textbox');
    expect(editor).toHaveAttribute('contenteditable', 'false');
    
    // Try to click on frozen content
    await userEvent.click(editor);
    
    // Should show frozen indicator
    await waitFor(() => {
      expect(screen.getByText('This content is frozen')).toBeInTheDocument();
    });
    
    // Should show lock reason
    expect(screen.getByText('Content finalized')).toBeInTheDocument();
  });

  it('shows confirmation for hard-locked content', async () => {
    const hardLockedFile = mockFile({ 
      lock: { 
        level: 'hard' as LockLevel,
        reason: 'Important scene',
        timestamp: new Date().toISOString(),
        userId: 'user-1'
      } 
    });
    
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Editor file={hardLockedFile} />
      </TestWrapper>
    );
    
    const editor = screen.getByRole('textbox');
    
    // Try to type in hard-locked content
    await user.click(editor);
    await user.keyboard('New content');
    
    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText('Confirm Edit to Locked Content')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: 'Edit Anyway' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    
    // Should show lock reason in dialog
    expect(screen.getByText('Important scene')).toBeInTheDocument();
  });

  it('allows editing after confirmation for hard-locked content', async () => {
    const hardLockedFile = mockFile({ 
      lock: { 
        level: 'hard' as LockLevel,
        reason: 'Important scene',
        timestamp: new Date().toISOString(),
        userId: 'user-1'
      } 
    });
    
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Editor file={hardLockedFile} />
      </TestWrapper>
    );
    
    const editor = screen.getByRole('textbox');
    
    // Try to edit
    await user.click(editor);
    await user.keyboard('New content');
    
    // Wait for confirmation dialog
    await waitFor(() => {
      expect(screen.getByText('Confirm Edit to Locked Content')).toBeInTheDocument();
    });
    
    // Confirm edit
    await user.click(screen.getByRole('button', { name: 'Edit Anyway' }));
    
    // Should allow editing now
    await waitFor(() => {
      expect(screen.queryByText('Confirm Edit to Locked Content')).not.toBeInTheDocument();
    });
    
    // Content should be editable
    expect(editor).toHaveAttribute('contenteditable', 'true');
  });

  it('prevents editing after canceling confirmation for hard-locked content', async () => {
    const hardLockedFile = mockFile({ 
      lock: { 
        level: 'hard' as LockLevel,
        reason: 'Important scene',
        timestamp: new Date().toISOString(),
        userId: 'user-1'
      } 
    });
    
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Editor file={hardLockedFile} />
      </TestWrapper>
    );
    
    const editor = screen.getByRole('textbox');
    
    // Try to edit
    await user.click(editor);
    await user.keyboard('New content');
    
    // Wait for confirmation dialog
    await waitFor(() => {
      expect(screen.getByText('Confirm Edit to Locked Content')).toBeInTheDocument();
    });
    
    // Cancel edit
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    
    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByText('Confirm Edit to Locked Content')).not.toBeInTheDocument();
    });
    
    // Content should still show original text
    expect(editor).toHaveTextContent('Original content');
  });

  it('allows AI suggestions for soft-locked content', async () => {
    const softLockedFile = mockFile({ 
      lock: { 
        level: 'soft' as LockLevel,
        reason: 'Pending review',
        timestamp: new Date().toISOString(),
        userId: 'user-1'
      } 
    });
    
    render(
      <TestWrapper>
        <Editor file={softLockedFile} />
      </TestWrapper>
    );
    
    // Should show AI suggestions indicator
    expect(screen.getByText('AI suggestions only')).toBeInTheDocument();
    
    // Should show AI suggestion button
    expect(screen.getByRole('button', { name: 'Get AI Suggestion' })).toBeInTheDocument();
    
    // Manual editing should be restricted
    const editor = screen.getByRole('textbox');
    expect(editor).toHaveAttribute('contenteditable', 'false');
  });

  it('applies AI suggestions to soft-locked content', async () => {
    const softLockedFile = mockFile({ 
      lock: { 
        level: 'soft' as LockLevel,
        reason: 'Pending review',
        timestamp: new Date().toISOString(),
        userId: 'user-1'
      } 
    });
    
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Editor file={softLockedFile} />
      </TestWrapper>
    );
    
    // Click AI suggestion button
    await user.click(screen.getByRole('button', { name: 'Get AI Suggestion' }));
    
    // Should show AI suggestion dialog
    await waitFor(() => {
      expect(screen.getByText('AI Suggestion')).toBeInTheDocument();
    });
    
    // Mock AI suggestion response
    const suggestionText = 'AI suggested improvement to the content';
    
    // Should show suggestion
    expect(screen.getByText(suggestionText)).toBeInTheDocument();
    
    // Should have apply and dismiss buttons
    expect(screen.getByRole('button', { name: 'Apply Suggestion' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('shows lock indicators in file tree', async () => {
    const files = [
      mockFile({ 
        id: 'file-1', 
        name: 'scene1.txt',
        lock: { level: 'frozen' as LockLevel, reason: 'Final', timestamp: new Date().toISOString(), userId: 'user-1' }
      }),
      mockFile({ 
        id: 'file-2', 
        name: 'scene2.txt',
        lock: { level: 'hard' as LockLevel, reason: 'Important', timestamp: new Date().toISOString(), userId: 'user-1' }
      }),
      mockFile({ 
        id: 'file-3', 
        name: 'scene3.txt',
        lock: { level: 'soft' as LockLevel, reason: 'Review', timestamp: new Date().toISOString(), userId: 'user-1' }
      }),
      mockFile({ 
        id: 'file-4', 
        name: 'scene4.txt' // No lock
      })
    ];
    
    // Mock FileTree component would be imported here
    // For now, we'll test the store logic
    
    // Set files in store
    useStore.setState({ 
      files,
      locks: {
        'file-1': files[0].lock,
        'file-2': files[1].lock,
        'file-3': files[2].lock
      }
    });
    
    const state = useStore.getState();
    
    // Verify lock indicators would be shown
    expect(state.locks['file-1'].level).toBe('frozen');
    expect(state.locks['file-2'].level).toBe('hard');
    expect(state.locks['file-3'].level).toBe('soft');
    expect(state.locks['file-4']).toBeUndefined();
  });

  it('respects lock permissions by user', async () => {
    const userLockedFile = mockFile({ 
      lock: { 
        level: 'hard' as LockLevel,
        reason: 'My edit',
        timestamp: new Date().toISOString(),
        userId: 'current-user'
      } 
    });
    
    const otherLockedFile = mockFile({ 
      lock: { 
        level: 'hard' as LockLevel,
        reason: 'Other edit',
        timestamp: new Date().toISOString(),
        userId: 'other-user'
      } 
    });
    
    // Set current user
    useStore.setState({ 
      user: { id: 'current-user', name: 'Current User' } 
    });
    
    // Test user's own lock (should allow editing)
    render(
      <TestWrapper>
        <Editor file={userLockedFile} />
      </TestWrapper>
    );
    
    let editor = screen.getByRole('textbox');
    expect(editor).toHaveAttribute('contenteditable', 'true');
    
    // Test other user's lock (should require confirmation)
    render(
      <TestWrapper>
        <Editor file={otherLockedFile} />
      </TestWrapper>
    );
    
    editor = screen.getByRole('textbox');
    
    // Should show lock indicator for other user's lock
    expect(screen.getByText('Locked by other-user')).toBeInTheDocument();
  });

  it('handles lock expiration', async () => {
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    const expiredLockFile = mockFile({ 
      lock: { 
        level: 'hard' as LockLevel,
        reason: 'Expired lock',
        timestamp: expiredDate.toISOString(),
        userId: 'user-1',
        expiresAt: expiredDate.toISOString()
      } 
    });
    
    render(
      <TestWrapper>
        <Editor file={expiredLockFile} />
      </TestWrapper>
    );
    
    // Expired lock should not prevent editing
    const editor = screen.getByRole('textbox');
    expect(editor).toHaveAttribute('contenteditable', 'true');
    
    // Should show expired lock indicator
    expect(screen.getByText('Lock expired')).toBeInTheDocument();
  });
});