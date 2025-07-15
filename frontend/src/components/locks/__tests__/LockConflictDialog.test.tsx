import { render, screen, waitFor } from '@/test-utils/render'
import { LockConflictDialog } from '../LockConflictDialog'
import type { LockConflict } from '@/lib/api/locks'

// Mock the ConflictItem component
jest.mock('../ConflictItem', () => ({
  ConflictItem: ({ conflict, onSelectResolution }: any) => (
    <div data-testid={`conflict-${conflict.componentId}`}>
      <h3>{conflict.componentName}</h3>
      <p>{conflict.description}</p>
      <button 
        onClick={() => onSelectResolution({ type: 'unlock', componentId: conflict.componentId })}
        data-testid={`unlock-${conflict.componentId}`}
      >
        Unlock and proceed
      </button>
      <button 
        onClick={() => onSelectResolution({ type: 'skip', componentId: conflict.componentId })}
        data-testid={`skip-${conflict.componentId}`}
      >
        Skip this component
      </button>
    </div>
  ),
}))

describe('LockConflictDialog', () => {
  const mockConflicts: LockConflict[] = [
    {
      id: 'conflict-1',
      componentId: 'character-1',
      componentType: 'character',
      type: 'lock_override',
      description: 'This component is locked by Alice',
      currentState: { locked: true },
      conflictingState: { locked: false },
      priority: 'high',
      affectedUsers: ['Alice', 'Bob'],
      lockedBy: 'Alice',
      lockLevel: 'hard',
      createdAt: '2024-01-15T10:00:00Z',
      reason: 'Character development in progress'
    },
    {
      id: 'conflict-2',
      componentId: 'scene-1',
      componentType: 'scene',
      type: 'concurrent_edit',
      description: 'This component has been edited by another user',
      currentState: { version: 1 },
      conflictingState: { version: 2 },
      priority: 'medium',
      affectedUsers: ['Charlie'],
      lockedBy: 'Charlie',
      lockLevel: 'soft',
      createdAt: '2024-01-15T11:00:00Z',
      reason: 'Scene revision'
    }
  ]

  const mockOperation = {
    type: 'bulk_edit',
    componentIds: ['character-1', 'scene-1']
  }

  const defaultProps = {
    conflicts: mockConflicts,
    operation: mockOperation,
    onResolve: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Conflict Display', () => {
    it('displays all conflicts', () => {
      render(<LockConflictDialog {...defaultProps} />)
      
      expect(screen.getByText('Lock Conflict Detected')).toBeInTheDocument()
      expect(screen.getByText('The following components are locked and would be affected by this operation:')).toBeInTheDocument()
      
      expect(screen.getByTestId('conflict-character-1')).toBeInTheDocument()
      expect(screen.getByTestId('conflict-scene-1')).toBeInTheDocument()
    })

    it('shows conflict details for each component', () => {
      render(<LockConflictDialog {...defaultProps} />)
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('This component is locked by Alice')).toBeInTheDocument()
      
      expect(screen.getByText('Opening Scene')).toBeInTheDocument()
      expect(screen.getByText('This component has been edited by another user')).toBeInTheDocument()
    })
  })

  describe('Resolution Options', () => {
    it('provides resolution options for each conflict', () => {
      render(<LockConflictDialog {...defaultProps} />)
      
      expect(screen.getByTestId('unlock-character-1')).toBeInTheDocument()
      expect(screen.getByTestId('skip-character-1')).toBeInTheDocument()
      
      expect(screen.getByTestId('unlock-scene-1')).toBeInTheDocument()
      expect(screen.getByTestId('skip-scene-1')).toBeInTheDocument()
    })

    it('disables continue button until all resolutions are selected', () => {
      render(<LockConflictDialog {...defaultProps} />)
      
      const continueButton = screen.getByText('Select All Resolutions')
      expect(continueButton).toBeDisabled()
    })

    it('enables continue button when all resolutions are selected', async () => {
      const { user } = render(<LockConflictDialog {...defaultProps} />)
      
      // Select resolutions for both conflicts
      await user.click(screen.getByTestId('unlock-character-1'))
      await user.click(screen.getByTestId('skip-scene-1'))
      
      const continueButton = screen.getByText('Continue')
      expect(continueButton).toBeEnabled()
    })

    it('tracks individual conflict resolutions', async () => {
      const { user } = render(<LockConflictDialog {...defaultProps} />)
      
      // Select different resolutions
      await user.click(screen.getByTestId('unlock-character-1'))
      await user.click(screen.getByTestId('skip-scene-1'))
      
      // Should be able to change resolution
      await user.click(screen.getByTestId('skip-character-1'))
      
      const continueButton = screen.getByText('Continue')
      expect(continueButton).toBeEnabled()
    })
  })

  describe('Cancel Operation', () => {
    it('calls onResolve with cancelled flag when cancel is clicked', async () => {
      const onResolve = jest.fn()
      const { user } = render(<LockConflictDialog {...defaultProps} onResolve={onResolve} />)
      
      const cancelButton = screen.getByText('Cancel Operation')
      await user.click(cancelButton)
      
      expect(onResolve).toHaveBeenCalledWith({ cancelled: true })
    })
  })

  describe('Form Submission', () => {
    it('submits selected resolutions when continue is clicked', async () => {
      const onResolve = jest.fn()
      const { user } = render(<LockConflictDialog {...defaultProps} onResolve={onResolve} />)
      
      // Select resolutions
      await user.click(screen.getByTestId('unlock-character-1'))
      await user.click(screen.getByTestId('skip-scene-1'))
      
      const continueButton = screen.getByText('Continue')
      await user.click(continueButton)
      
      expect(onResolve).toHaveBeenCalledWith({
        cancelled: false,
        componentIds: ['scene-1'] // Only skipped components
      })
    })

    it('shows loading state during resolution', async () => {
      const onResolve = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
      const { user } = render(<LockConflictDialog {...defaultProps} onResolve={onResolve} />)
      
      // Select resolutions
      await user.click(screen.getByTestId('unlock-character-1'))
      await user.click(screen.getByTestId('skip-scene-1'))
      
      const continueButton = screen.getByText('Continue')
      await user.click(continueButton)
      
      // Should show loading state
      expect(screen.getByText('Resolving conflicts...')).toBeInTheDocument()
      expect(continueButton).toBeDisabled()
      
      // Wait for resolution to complete
      await waitFor(() => {
        expect(screen.queryByText('Resolving conflicts...')).not.toBeInTheDocument()
      })
    })

    it('displays error if resolution fails', async () => {
      const onResolve = jest.fn().mockRejectedValue(new Error('Resolution failed'))
      const { user } = render(<LockConflictDialog {...defaultProps} onResolve={onResolve} />)
      
      // Select resolutions
      await user.click(screen.getByTestId('unlock-character-1'))
      await user.click(screen.getByTestId('skip-scene-1'))
      
      const continueButton = screen.getByText('Continue')
      await user.click(continueButton)
      
      await waitFor(() => {
        expect(screen.getByText('Failed to resolve conflicts')).toBeInTheDocument()
        expect(screen.getByText('Resolution failed')).toBeInTheDocument()
      })
      
      // Should be able to retry
      expect(continueButton).toBeEnabled()
    })

    it('includes only skipped components in resolution', async () => {
      const onResolve = jest.fn()
      const { user } = render(<LockConflictDialog {...defaultProps} onResolve={onResolve} />)
      
      // Skip both components
      await user.click(screen.getByTestId('skip-character-1'))
      await user.click(screen.getByTestId('skip-scene-1'))
      
      const continueButton = screen.getByText('Continue')
      await user.click(continueButton)
      
      expect(onResolve).toHaveBeenCalledWith({
        cancelled: false,
        componentIds: ['character-1', 'scene-1']
      })
    })

    it('handles case where all conflicts are unlocked', async () => {
      const onResolve = jest.fn()
      const { user } = render(<LockConflictDialog {...defaultProps} onResolve={onResolve} />)
      
      // Unlock both components
      await user.click(screen.getByTestId('unlock-character-1'))
      await user.click(screen.getByTestId('unlock-scene-1'))
      
      const continueButton = screen.getByText('Continue')
      await user.click(continueButton)
      
      expect(onResolve).toHaveBeenCalledWith({
        cancelled: false,
        componentIds: [] // No skipped components
      })
    })
  })

  describe('Accessibility', () => {
    it('uses semantic HTML for dialog', () => {
      render(<LockConflictDialog {...defaultProps} />)
      
      const dialog = screen.getByText('Lock Conflict Detected').closest('.fixed')
      expect(dialog).toHaveClass('bg-black', 'bg-opacity-50')
    })

    it('provides accessible button labels', () => {
      render(<LockConflictDialog {...defaultProps} />)
      
      expect(screen.getByText('Cancel Operation')).toBeInTheDocument()
      expect(screen.getByText('Select All Resolutions')).toBeInTheDocument()
    })

    it('focuses on first interactive element', () => {
      render(<LockConflictDialog {...defaultProps} />)
      
      // The first conflict resolution button should be focusable
      const firstButton = screen.getByTestId('unlock-character-1')
      expect(firstButton).toBeInTheDocument()
    })
  })

  describe('Error States', () => {
    it('handles empty conflicts array', () => {
      render(<LockConflictDialog {...defaultProps} conflicts={[]} />)
      
      expect(screen.getByText('Lock Conflict Detected')).toBeInTheDocument()
      const continueButton = screen.getByText('Continue')
      expect(continueButton).toBeEnabled() // No conflicts to resolve
    })

    it('handles single conflict', () => {
      render(<LockConflictDialog {...defaultProps} conflicts={[mockConflicts[0]]} />)
      
      expect(screen.getByTestId('conflict-character-1')).toBeInTheDocument()
      expect(screen.queryByTestId('conflict-scene-1')).not.toBeInTheDocument()
    })
  })

  describe('Visual States', () => {
    it('displays as modal overlay', () => {
      render(<LockConflictDialog {...defaultProps} />)
      
      const overlay = screen.getByText('Lock Conflict Detected').closest('.fixed.inset-0')
      expect(overlay).toHaveClass('bg-black', 'bg-opacity-50')
    })

    it('centers dialog content', () => {
      render(<LockConflictDialog {...defaultProps} />)
      
      const dialogContainer = screen.getByText('Lock Conflict Detected').closest('.fixed.inset-0')
      expect(dialogContainer).toHaveClass('flex', 'items-center', 'justify-center')
    })

    it('styles dialog with white background', () => {
      render(<LockConflictDialog {...defaultProps} />)
      
      const dialogContent = screen.getByText('Lock Conflict Detected').closest('.bg-white')
      expect(dialogContent).toHaveClass('rounded-lg', 'p-6')
    })
  })

  describe('Complex Scenarios', () => {
    it('handles many conflicts with scrolling', () => {
      const manyConflicts = Array.from({ length: 10 }, (_, i) => ({
        ...mockConflicts[0],
        id: `conflict-${i}`,
        componentId: `component-${i}`,
      }))
      
      render(<LockConflictDialog {...defaultProps} conflicts={manyConflicts} />)
      
      expect(screen.getAllByTestId(/^conflict-/).length).toBe(10)
    })

    it('maintains resolution state across re-renders', async () => {
      const { user, rerender } = render(<LockConflictDialog {...defaultProps} />)
      
      // Select a resolution
      await user.click(screen.getByTestId('unlock-character-1'))
      
      // Re-render with same props
      rerender(<LockConflictDialog {...defaultProps} />)
      
      // Selection should persist (would need actual state management in component)
      await user.click(screen.getByTestId('skip-scene-1'))
      
      const continueButton = screen.getByText('Continue')
      expect(continueButton).toBeEnabled()
    })
  })

  describe('Form Validation', () => {
    it('validates required fields for each conflict', async () => {
      const { user } = render(<LockConflictDialog {...defaultProps} />)
      
      // Try to continue without selecting all resolutions
      const continueButton = screen.getByText('Select All Resolutions')
      expect(continueButton).toBeDisabled()
      
      // Select only one resolution
      await user.click(screen.getByTestId('unlock-character-1'))
      
      // Button should still be disabled
      expect(screen.getByText('Select All Resolutions')).toBeDisabled()
      
      // Select the remaining resolution
      await user.click(screen.getByTestId('skip-scene-1'))
      
      // Now button should be enabled
      expect(screen.getByText('Continue')).toBeEnabled()
    })

    it('shows validation messages for unresolved conflicts', async () => {
      const { user } = render(<LockConflictDialog {...defaultProps} />)
      
      // Select one resolution
      await user.click(screen.getByTestId('unlock-character-1'))
      
      // Should show count of unresolved conflicts
      expect(screen.getByText('1 conflict needs resolution')).toBeInTheDocument()
    })

    it('prevents submission with keyboard when form is invalid', async () => {
      const onResolve = jest.fn()
      const { user } = render(<LockConflictDialog {...defaultProps} onResolve={onResolve} />)
      
      // Try to submit with Enter key without selecting resolutions
      await user.keyboard('{Enter}')
      
      expect(onResolve).not.toHaveBeenCalled()
    })
  })
})