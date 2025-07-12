import { render, screen, waitFor } from '@/test-utils/render'
import { LockIndicator } from '../LockIndicator'
import { createLockIndicatorProps, createFormattedDate } from '@/test-utils/factories'
import type { LockLevel, LockType } from '../LockIndicator'

describe('LockIndicator', () => {
  const defaultProps = createLockIndicatorProps()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Lock Levels', () => {
    it('renders soft lock with correct visual state', () => {
      render(
        <LockIndicator
          {...defaultProps}
          lockLevel="soft"
          reason="Content under review"
        />
      )
      
      const lockElement = screen.getByTitle('Soft Lock')
      expect(lockElement).toBeInTheDocument()
      expect(lockElement).toHaveTextContent('🟡')
      expect(lockElement).toHaveClass('bg-yellow-50', 'border-yellow-200')
    })

    it('renders hard lock with correct visual state', () => {
      render(
        <LockIndicator
          {...defaultProps}
          lockLevel="hard"
          reason="Editorial review required"
        />
      )
      
      const lockElement = screen.getByTitle('Hard Lock')
      expect(lockElement).toBeInTheDocument()
      expect(lockElement).toHaveTextContent('🟠')
      expect(lockElement).toHaveClass('bg-orange-50', 'border-orange-200')
    })

    it('renders frozen lock with correct visual state', () => {
      render(
        <LockIndicator
          {...defaultProps}
          lockLevel="frozen"
          reason="Content finalized"
        />
      )
      
      const lockElement = screen.getByTitle('Frozen')
      expect(lockElement).toBeInTheDocument()
      expect(lockElement).toHaveTextContent('🔴')
      expect(lockElement).toHaveClass('bg-red-50', 'border-red-200')
    })

    it('renders unlocked state with lock icon', () => {
      render(<LockIndicator {...defaultProps} lockLevel={null} />)
      
      const unlockButton = screen.getByRole('button')
      expect(unlockButton).toBeInTheDocument()
      expect(unlockButton).toHaveTextContent('🔓')
      expect(unlockButton).toHaveClass('opacity-30')
      expect(unlockButton).toHaveAttribute('title', 'Click to lock')
    })
  })

  describe('Click Handling', () => {
    it('calls onLockToggle when unlocked indicator is clicked', async () => {
      const onLockToggle = jest.fn()
      const { user } = render(
        <LockIndicator
          {...defaultProps}
          lockLevel={null}
          onLockToggle={onLockToggle}
        />
      )
      
      const unlockButton = screen.getByRole('button')
      await user.click(unlockButton)
      
      expect(onLockToggle).toHaveBeenCalledWith('test-component-1')
    })

    it('calls onLockToggle when locked indicator is clicked', async () => {
      const onLockToggle = jest.fn()
      const { user } = render(
        <LockIndicator
          {...defaultProps}
          lockLevel="soft"
          onLockToggle={onLockToggle}
        />
      )
      
      const lockElement = screen.getByTitle('Soft Lock')
      await user.click(lockElement)
      
      expect(onLockToggle).toHaveBeenCalledWith('test-component-1')
    })

    it('does not respond to clicks when interactive is false', async () => {
      const onLockToggle = jest.fn()
      const { user } = render(
        <LockIndicator
          {...defaultProps}
          lockLevel="soft"
          onLockToggle={onLockToggle}
          interactive={false}
        />
      )
      
      const lockElement = screen.getByTitle('Soft Lock')
      await user.click(lockElement)
      
      expect(onLockToggle).not.toHaveBeenCalled()
    })
  })

  describe('Disabled State', () => {
    it('shows non-interactive unlocked state when interactive is false', () => {
      render(
        <LockIndicator
          {...defaultProps}
          lockLevel={null}
          interactive={false}
        />
      )
      
      const indicator = screen.getByTitle('No lock')
      expect(indicator).toBeInTheDocument()
      expect(indicator.tagName).toBe('SPAN')
      expect(indicator).toHaveTextContent('🔓')
    })
  })

  describe('Loading State', () => {
    it('displays loading state when isLoading is true', () => {
      render(
        <LockIndicator
          {...defaultProps}
          lockLevel="soft"
          isLoading={true}
        />
      )
      
      // Check for loading spinner
      expect(screen.getByText('⏳')).toBeInTheDocument()
      
      // Check for pulse animation
      const loadingElement = screen.getByText('⏳').parentElement
      expect(loadingElement).toHaveClass('animate-pulse')
    })

    it('disables interactions during loading', async () => {
      const onLockToggle = jest.fn()
      const { user } = render(
        <LockIndicator
          {...defaultProps}
          lockLevel={null}
          onLockToggle={onLockToggle}
          isLoading={true}
        />
      )
      
      // When loading, it shows loading state instead of button
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.getByText('⏳')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper title attributes for screen readers', () => {
      render(
        <LockIndicator
          {...defaultProps}
          lockLevel="hard"
          reason="Important content"
        />
      )
      
      const lockElement = screen.getByTitle('Hard Lock')
      expect(lockElement).toBeInTheDocument()
      expect(lockElement).toHaveAttribute('aria-label', 'Hard Lock - Edits require confirmation - Important content')
    })

    it('has proper aria-label for accessibility', () => {
      render(
        <LockIndicator
          {...defaultProps}
          lockLevel="soft"
          reason="Content under review"
          ariaLabel="Soft lock: Content under review"
        />
      )
      
      const lockElement = screen.getByTitle('Soft Lock')
      expect(lockElement).toHaveAttribute('aria-label', 'Soft lock: Content under review')
    })

    it('includes lock level in aria-label when not provided', () => {
      render(
        <LockIndicator
          {...defaultProps}
          lockLevel="frozen"
          reason="Final version"
        />
      )
      
      const lockElement = screen.getByTitle('Frozen')
      expect(lockElement).toHaveAttribute('aria-label', 'Frozen - Completely immutable - Final version')
    })

    it('shows tooltip with lock details on hover', async () => {
      const { user } = render(
        <LockIndicator
          {...defaultProps}
          lockLevel="soft"
          reason="Under review"
          lockedBy="John Doe"
          lockedAt={createFormattedDate(0)}
        />
      )
      
      const lockElement = screen.getByTitle('Soft Lock')
      await user.hover(lockElement)
      
      await waitFor(() => {
        expect(screen.getByText('Soft Lock')).toBeInTheDocument()
        expect(screen.getByText('AI can suggest but not modify')).toBeInTheDocument()
        expect(screen.getByText('Reason: Under review')).toBeInTheDocument()
        expect(screen.getByText('By: John Doe')).toBeInTheDocument()
      })
    })
  })

  describe('Lock Types', () => {
    it('displays personal lock type icon', () => {
      render(
        <LockIndicator
          {...defaultProps}
          lockLevel="soft"
          lockType="personal"
          showDetails={true}
        />
      )
      
      expect(screen.getByText('👤')).toBeInTheDocument()
    })

    it('displays editorial lock type icon', () => {
      render(
        <LockIndicator
          {...defaultProps}
          lockLevel="hard"
          lockType="editorial"
          showDetails={true}
        />
      )
      
      expect(screen.getByText('✏️')).toBeInTheDocument()
    })

    it('displays collaborative lock type with shared users', () => {
      render(
        <LockIndicator
          {...defaultProps}
          lockLevel="soft"
          lockType="collaborative"
          sharedWith={['Alice', 'Bob', 'Charlie']}
          showDetails={true}
        />
      )
      
      expect(screen.getByText('👥')).toBeInTheDocument()
      expect(screen.getByTitle('Alice')).toHaveTextContent('A')
      expect(screen.getByTitle('Bob')).toHaveTextContent('B')
      expect(screen.getByTitle('Charlie')).toHaveTextContent('C')
    })

    it('shows overflow indicator for many shared users', () => {
      render(
        <LockIndicator
          {...defaultProps}
          lockLevel="soft"
          lockType="collaborative"
          sharedWith={['Alice', 'Bob', 'Charlie', 'David', 'Eve']}
        />
      )
      
      expect(screen.getByText('+2')).toBeInTheDocument()
    })
  })

  describe('Override Functionality', () => {
    it('shows override button when canOverride is true', () => {
      render(
        <LockIndicator
          {...defaultProps}
          lockLevel="hard"
          canOverride={true}
        />
      )
      
      const overrideButton = screen.getByTitle('Request override')
      expect(overrideButton).toBeInTheDocument()
      expect(overrideButton).toHaveTextContent('⚡')
    })

    it('opens override dialog when override button is clicked', async () => {
      const { user } = render(
        <LockIndicator
          {...defaultProps}
          lockLevel="hard"
          canOverride={true}
        />
      )
      
      const overrideButton = screen.getByTitle('Request override')
      await user.click(overrideButton)
      
      expect(screen.getByText('Request Lock Override')).toBeInTheDocument()
      expect(screen.getByLabelText('Reason for override:')).toBeInTheDocument()
    })

    it('submits override request with reason', async () => {
      const onOverrideRequest = jest.fn()
      const { user } = render(
        <LockIndicator
          {...defaultProps}
          lockLevel="hard"
          canOverride={true}
          onOverrideRequest={onOverrideRequest}
        />
      )
      
      const overrideButton = screen.getByTitle('Request override')
      await user.click(overrideButton)
      
      const textarea = screen.getByPlaceholderText(/explain why you need to override/i)
      await user.type(textarea, 'Urgent fix required')
      
      const submitButton = screen.getByText('Request Override')
      await user.click(submitButton)
      
      expect(onOverrideRequest).toHaveBeenCalledWith('test-component-1', 'Urgent fix required')
    })

    it('disables submit button when reason is empty', async () => {
      const { user } = render(
        <LockIndicator
          {...defaultProps}
          lockLevel="hard"
          canOverride={true}
        />
      )
      
      const overrideButton = screen.getByTitle('Request override')
      await user.click(overrideButton)
      
      const submitButton = screen.getByText('Request Override')
      expect(submitButton).toBeDisabled()
    })

    it('closes dialog on cancel', async () => {
      const { user } = render(
        <LockIndicator
          {...defaultProps}
          lockLevel="hard"
          canOverride={true}
        />
      )
      
      const overrideButton = screen.getByTitle('Request override')
      await user.click(overrideButton)
      
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      
      expect(screen.queryByText('Request Lock Override')).not.toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    it('renders small size correctly', () => {
      render(
        <LockIndicator
          {...defaultProps}
          lockLevel="soft"
          size="sm"
        />
      )
      
      const lockElement = screen.getByTitle('Soft Lock')
      expect(lockElement).toHaveClass('px-2', 'py-1')
    })

    it('renders medium size correctly', () => {
      render(
        <LockIndicator
          {...defaultProps}
          lockLevel="soft"
          size="md"
        />
      )
      
      const lockElement = screen.getByTitle('Soft Lock')
      expect(lockElement).toHaveClass('px-3', 'py-2')
    })

    it('renders large size correctly', () => {
      render(
        <LockIndicator
          {...defaultProps}
          lockLevel="soft"
          size="lg"
        />
      )
      
      const lockElement = screen.getByTitle('Soft Lock')
      expect(lockElement).toHaveClass('px-4', 'py-3')
    })
  })

  describe('Tooltip Details', () => {
    it('hides type icon when showDetails is false', () => {
      render(
        <LockIndicator
          {...defaultProps}
          lockLevel="soft"
          lockType="editorial"
          showDetails={false}
        />
      )
      
      expect(screen.queryByText('✏️')).not.toBeInTheDocument()
    })

    it('shows collaborative users in tooltip', async () => {
      const { user } = render(
        <LockIndicator
          {...defaultProps}
          lockLevel="soft"
          lockType="collaborative"
          sharedWith={['Alice', 'Bob']}
        />
      )
      
      const lockElement = screen.getByTitle('Soft Lock')
      await user.hover(lockElement)
      
      await waitFor(() => {
        expect(screen.getByText('Shared with: Alice, Bob')).toBeInTheDocument()
      })
    })
  })
})