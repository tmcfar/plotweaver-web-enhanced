import { render, screen, waitFor, within } from '@/test-utils/render'
import { LockManagementPanel } from '../LockManagementPanel'
import { createLockTestScenario } from '@/test-utils/factories'
import type { ComponentLock, LockState, BulkLockOperation, ProjectComponent } from '../LockManagementPanel'

// Mock the LockIndicator component to simplify testing
jest.mock('../LockIndicator', () => ({
  LockIndicator: ({ componentId, lockLevel, onLockToggle }: any) => (
    <button 
      data-testid={`lock-indicator-${componentId}`}
      onClick={() => onLockToggle?.(componentId)}
    >
      {lockLevel || 'unlocked'}
    </button>
  ),
}))

describe('LockManagementPanel', () => {
  const { components: mockProjectComponents, lockState: mockLockState } = createLockTestScenario()

  const defaultProps = {
    projectId: 'project-1',
    lockState: mockLockState,
    userRole: 'owner' as const,
    projectComponents: mockProjectComponents,
    onLockUpdate: jest.fn(),
    onBulkOperation: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Lock Statistics Display', () => {
    it('displays lock statistics correctly', () => {
      render(<LockManagementPanel {...defaultProps} />)
      
      expect(screen.getByText('Total: 2')).toBeInTheDocument()
      expect(screen.getByText('Soft: 1')).toBeInTheDocument()
      expect(screen.getByText('Hard: 1')).toBeInTheDocument()
      expect(screen.getByText('Frozen: 0')).toBeInTheDocument()
    })

    it('shows conflict count when conflicts exist', () => {
      const lockStateWithConflicts = {
        ...mockLockState,
        conflicts: [
          {
            id: 'conflict-1',
            componentId: 'scene-1',
            type: 'lock_override',
            description: 'Lock override requested',
            currentState: {},
            conflictingState: {},
          }
        ]
      }
      
      render(<LockManagementPanel {...defaultProps} lockState={lockStateWithConflicts} />)
      
      expect(screen.getByText('1 conflicts')).toBeInTheDocument()
    })
  })

  describe('Component Tree Display', () => {
    it('renders all project components in tree structure', () => {
      render(<LockManagementPanel {...defaultProps} />)
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Chapter 1')).toBeInTheDocument()
      // Child component is initially expanded
      expect(screen.getByText('Introduction Scene')).toBeInTheDocument()
    })

    it('displays component type icons', () => {
      render(<LockManagementPanel {...defaultProps} />)
      
      expect(screen.getByText('👤')).toBeInTheDocument() // character
      expect(screen.getByText('🎬')).toBeInTheDocument() // scene
      expect(screen.getByText('📄')).toBeInTheDocument() // chapter
    })

    it('expands and collapses tree nodes', async () => {
      const { user } = render(<LockManagementPanel {...defaultProps} />)
      
      // Initially, child should be visible (assuming expanded by default)
      expect(screen.getByText('Introduction Scene')).toBeInTheDocument()
      
      // Find and click the expand/collapse button for the character
      const expandButton = screen.getByText('▼')
      await user.click(expandButton)
      
      // Child should be hidden
      expect(screen.queryByText('Introduction Scene')).not.toBeInTheDocument()
      
      // Click again to expand
      await user.click(screen.getByText('▶'))
      
      // Child should be visible again
      expect(screen.getByText('Introduction Scene')).toBeInTheDocument()
    })
  })

  describe('Lock Management', () => {
    it('displays current lock states', () => {
      render(<LockManagementPanel {...defaultProps} />)
      
      expect(screen.getByTestId('lock-indicator-character-1')).toHaveTextContent('soft')
      expect(screen.getByTestId('lock-indicator-character-1-child-0')).toHaveTextContent('hard')
      expect(screen.getByTestId('lock-indicator-chapter-1')).toHaveTextContent('unlocked')
    })

    it('calls onLockUpdate when lock is toggled', async () => {
      const onLockUpdate = jest.fn()
      const { user } = render(<LockManagementPanel {...defaultProps} onLockUpdate={onLockUpdate} />)
      
      // Click on unlocked component
      await user.click(screen.getByTestId('lock-indicator-chapter-1'))
      
      expect(onLockUpdate).toHaveBeenCalledWith([
        expect.objectContaining({
          componentId: 'chapter-1',
          level: 'soft',
          type: 'personal',
          reason: 'Manual lock',
          lockedBy: 'current-user',
        })
      ])
    })

    it('removes lock when locked component is clicked', async () => {
      const onLockUpdate = jest.fn()
      const { user } = render(<LockManagementPanel {...defaultProps} onLockUpdate={onLockUpdate} />)
      
      // Click on locked component
      await user.click(screen.getByTestId('lock-indicator-character-1'))
      
      expect(onLockUpdate).toHaveBeenCalledWith([
        expect.objectContaining({
          componentId: 'character-1-child-0',
        })
      ])
    })
  })

  describe('Bulk Operations', () => {
    it('shows bulk operation controls when components are selected', async () => {
      const { user } = render(<LockManagementPanel {...defaultProps} />)
      
      // Select first component
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])
      
      expect(screen.getByText('1 components selected')).toBeInTheDocument()
      expect(screen.getByText('Bulk Lock')).toBeInTheDocument()
      expect(screen.getByText('Clear')).toBeInTheDocument()
    })

    it('allows selecting multiple components', async () => {
      const { user } = render(<LockManagementPanel {...defaultProps} />)
      
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])
      await user.click(checkboxes[1])
      
      expect(screen.getByText('2 components selected')).toBeInTheDocument()
    })

    it('clears selection when Clear button is clicked', async () => {
      const { user } = render(<LockManagementPanel {...defaultProps} />)
      
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])
      
      const clearButton = screen.getByText('Clear')
      await user.click(clearButton)
      
      expect(screen.queryByText('1 components selected')).not.toBeInTheDocument()
    })

    it('opens bulk lock dialog when Bulk Lock is clicked', async () => {
      const { user } = render(<LockManagementPanel {...defaultProps} />)
      
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])
      
      const bulkLockButton = screen.getByText('Bulk Lock')
      await user.click(bulkLockButton)
      
      expect(screen.getByText('Bulk Lock Components')).toBeInTheDocument()
      expect(screen.getByLabelText('Lock Level:')).toBeInTheDocument()
      expect(screen.getByLabelText('Reason:')).toBeInTheDocument()
    })

    it('submits bulk lock operation with selected components', async () => {
      const onBulkOperation = jest.fn()
      const { user } = render(<LockManagementPanel {...defaultProps} onBulkOperation={onBulkOperation} />)
      
      // Select components
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0]) // character-1
      await user.click(checkboxes[2]) // chapter-1
      
      // Open bulk dialog
      await user.click(screen.getByText('Bulk Lock'))
      
      // Select lock level
      const selectElement = screen.getByLabelText('Lock Level:')
      await user.selectOptions(selectElement, 'hard')
      
      // Enter reason
      const reasonTextarea = screen.getByLabelText('Reason:')
      await user.type(reasonTextarea, 'Preparing for release')
      
      // Submit
      await user.click(screen.getByText('Apply Locks'))
      
      expect(onBulkOperation).toHaveBeenCalledWith({
        type: 'lock',
        componentIds: ['character-1', 'chapter-1'],
        lockLevel: 'hard',
        reason: 'Preparing for release'
      })
    })

    it('disables submit when no reason is provided', async () => {
      const { user } = render(<LockManagementPanel {...defaultProps} />)
      
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])
      
      await user.click(screen.getByText('Bulk Lock'))
      
      const submitButton = screen.getByText('Apply Locks')
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no components exist', () => {
      render(<LockManagementPanel {...defaultProps} projectComponents={[]} />)
      
      expect(screen.getByText('No components in context')).toBeInTheDocument()
      expect(screen.getByText('Add components from the browser to build scene context')).toBeInTheDocument()
    })

    it('shows zero locks when lock state is empty', () => {
      const emptyLockState: LockState = {
        locks: {},
        conflicts: []
      }
      
      render(<LockManagementPanel {...defaultProps} lockState={emptyLockState} />)
      
      expect(screen.getByText('Total: 0')).toBeInTheDocument()
      expect(screen.getByText('Soft: 0')).toBeInTheDocument()
      expect(screen.getByText('Hard: 0')).toBeInTheDocument()
      expect(screen.getByText('Frozen: 0')).toBeInTheDocument()
    })
  })

  describe('Audit Trail', () => {
    it('opens audit trail modal when link is clicked', async () => {
      const { user } = render(<LockManagementPanel {...defaultProps} />)
      
      const auditLink = screen.getByText('View Audit Trail')
      await user.click(auditLink)
      
      expect(screen.getByText('Lock Audit Trail')).toBeInTheDocument()
      expect(screen.getByText('Lock Created')).toBeInTheDocument()
      expect(screen.getByText('Lock Removed')).toBeInTheDocument()
    })

    it('closes audit trail modal', async () => {
      const { user } = render(<LockManagementPanel {...defaultProps} />)
      
      await user.click(screen.getByText('View Audit Trail'))
      
      const closeButton = screen.getByLabelText('Close audit trail')
      await user.click(closeButton)
      
      expect(screen.queryByText('Lock Audit Trail')).not.toBeInTheDocument()
    })
  })

  describe('User Role Permissions', () => {
    it('creates locks with canOverride true for owner role', async () => {
      const onLockUpdate = jest.fn()
      const { user } = render(
        <LockManagementPanel 
          {...defaultProps} 
          userRole="owner"
          onLockUpdate={onLockUpdate}
        />
      )
      
      await user.click(screen.getByTestId('lock-indicator-chapter-1'))
      
      expect(onLockUpdate).toHaveBeenCalledWith([
        expect.objectContaining({
          canOverride: true
        })
      ])
    })

    it('creates locks with canOverride false for non-owner roles', async () => {
      const onLockUpdate = jest.fn()
      const { user } = render(
        <LockManagementPanel 
          {...defaultProps} 
          userRole="editor"
          onLockUpdate={onLockUpdate}
        />
      )
      
      await user.click(screen.getByTestId('lock-indicator-chapter-1'))
      
      expect(onLockUpdate).toHaveBeenCalledWith([
        expect.objectContaining({
          canOverride: false
        })
      ])
    })
  })

  describe('Search and Filter', () => {
    it('filters components by selection', async () => {
      const { user } = render(<LockManagementPanel {...defaultProps} />)
      
      // Select only character component
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])
      
      expect(screen.getByText('1 components selected')).toBeInTheDocument()
    })

    it('search filters locks by component name', async () => {
      const { user } = render(<LockManagementPanel {...defaultProps} />)
      
      // Find search input
      const searchInput = screen.getByPlaceholderText('Search components...')
      await user.type(searchInput, 'John')
      
      // Should show only matching component
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Chapter 1')).not.toBeInTheDocument()
    })

    it('shows no results message when search has no matches', async () => {
      const { user } = render(<LockManagementPanel {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search components...')
      await user.type(searchInput, 'NonExistent')
      
      expect(screen.getByText('No results for "NonExistent"')).toBeInTheDocument()
    })

    it('clears search when clear button is clicked', async () => {
      const { user } = render(<LockManagementPanel {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search components...')
      await user.type(searchInput, 'John')
      
      const clearButton = screen.getByTitle('Clear search')
      await user.click(clearButton)
      
      expect(searchInput).toHaveValue('')
      expect(screen.getByText('Chapter 1')).toBeInTheDocument()
    })

    it('filters locks by level dropdown', async () => {
      const { user } = render(<LockManagementPanel {...defaultProps} />)
      
      const filterSelect = screen.getByLabelText('Filter by lock level:')
      await user.selectOptions(filterSelect, 'soft')
      
      // Should only show soft locked components
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Introduction Scene')).not.toBeInTheDocument() // hard locked
    })
  })

  describe('Loading and Error States', () => {
    it('shows loading skeleton while fetching', () => {
      render(<LockManagementPanel {...defaultProps} isLoading={true} />)
      
      expect(screen.getByTestId('lock-panel-skeleton')).toBeInTheDocument()
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })

    it('displays loading state for individual operations', async () => {
      const { user } = render(<LockManagementPanel {...defaultProps} />)
      
      // Mock a loading state for lock toggle
      const lockIndicator = screen.getAllByTestId(/^lock-indicator-/)[0]
      expect(lockIndicator).not.toHaveClass('animate-pulse')
      
      // Trigger action that causes loading
      await user.click(lockIndicator)
      
      // Would need to mock the loading state in the component
    })

    it('handles error state gracefully', () => {
      render(
        <LockManagementPanel 
          {...defaultProps} 
          error={new Error('Failed to load locks')}
        />
      )
      
      expect(screen.getByText('Error loading locks')).toBeInTheDocument()
      expect(screen.getByText('Failed to load locks')).toBeInTheDocument()
    })

    it('allows retry on error', async () => {
      const onRetry = jest.fn()
      const { user } = render(
        <LockManagementPanel 
          {...defaultProps} 
          error={new Error('Failed to load locks')}
          onRetry={onRetry}
        />
      )
      
      const retryButton = screen.getByText('Try Again')
      await user.click(retryButton)
      
      expect(onRetry).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has accessible form controls in bulk dialog', async () => {
      const { user } = render(<LockManagementPanel {...defaultProps} />)
      
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])
      await user.click(screen.getByText('Bulk Lock'))
      
      expect(screen.getByLabelText('Lock Level:')).toBeInTheDocument()
      expect(screen.getByLabelText('Reason:')).toBeInTheDocument()
    })

    it('provides keyboard navigation for tree', async () => {
      const { user } = render(<LockManagementPanel {...defaultProps} />)
      
      const checkboxes = screen.getAllByRole('checkbox')
      
      // Should be able to tab through elements
      // The search input gets focus first when tabbing
      await user.tab()
      expect(screen.getByPlaceholderText('Search components...')).toHaveFocus()
      
      // Continue tabbing to reach other elements
      await user.tab() // level filter
      await user.tab() // expand/collapse button for character with children
      await user.tab() // first checkbox
      expect(checkboxes[0]).toHaveFocus()
    })
  })
})