import { render, screen, waitFor } from '@/test-utils/render'
import { FoundationCheckpoint } from '../FoundationCheckpoint'
import { useLockStore } from '@/lib/store/lockStore'
import { useNotifications } from '@/components/notifications/NotificationSystem'

// Mock dependencies
jest.mock('@/lib/store/lockStore')
jest.mock('@/components/notifications/NotificationSystem')

// Mock fetch
global.fetch = jest.fn()

const mockUseLockStore = useLockStore as jest.MockedFunction<typeof useLockStore>
const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>

describe('FoundationCheckpoint', () => {
  const defaultProps = {
    projectId: 'test-project-1',
    onCheckpointCreate: jest.fn(),
    onComponentLock: jest.fn(),
  }

  const mockFoundationStatus = {
    overall_ready: false,
    readiness_score: 0.75,
    components: [
      {
        id: 'setting-world',
        name: 'World & Setting',
        type: 'setting',
        completeness: 0.9,
        ready: true,
        issues: [],
        dependencies: []
      },
      {
        id: 'characters-main',
        name: 'Main Characters',
        type: 'character',
        completeness: 0.8,
        ready: true,
        issues: [],
        dependencies: []
      },
      {
        id: 'plot-structure',
        name: 'Plot Structure',
        type: 'plot',
        completeness: 0.6,
        ready: false,
        issues: ['Missing Act 2 climax', 'Unclear character motivations'],
        dependencies: ['characters-main']
      }
    ],
    recommendations: [
      'Complete plot structure before locking',
      'Consider soft-locking characters to allow minor adjustments',
      'Review world-building consistency'
    ]
  }

  const mockLocks = {
    'setting-world': { level: 'hard', id: 'lock-1' },
  }

  const mockAddNotification = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers() // Use real timers to prevent conflicts with testing library
    
    mockUseLockStore.mockReturnValue({
      locks: mockLocks,
      addLock: jest.fn(),
      removeLock: jest.fn(),
      updateLock: jest.fn(),
      clearLocks: jest.fn(),
    })

    mockUseNotifications.mockReturnValue({
      addNotification: mockAddNotification,
      notifyLockUpdate: jest.fn(),
      notifyError: jest.fn(),
      notifySuccess: jest.fn(),
      notifyConflict: jest.fn(),
      notifyConnectionStatus: jest.fn(),
      removeNotification: jest.fn(),
      clearNotifications: jest.fn(),
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockFoundationStatus
    })
  })

  describe('Component Readiness Display', () => {
    it('displays overall readiness score', async () => {
      render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Overall Readiness')).toBeInTheDocument()
        expect(screen.getByText('75%')).toBeInTheDocument()
      })
    }, 10000)

    it('displays all component types with their status', async () => {
      render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('World & Setting')).toBeInTheDocument()
        expect(screen.getByText('90% complete')).toBeInTheDocument()
        
        expect(screen.getByText('Main Characters')).toBeInTheDocument()
        expect(screen.getByText('80% complete')).toBeInTheDocument()
        
        expect(screen.getByText('Plot Structure')).toBeInTheDocument()
        expect(screen.getByText('60% complete')).toBeInTheDocument()
      })
    }, 10000)

    it('shows check icon for ready components', async () => {
      render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        const settingComponent = screen.getByText('World & Setting').closest('.p-4')
        const checkIcon = settingComponent?.querySelector('.lucide-check-circle-2')
        expect(checkIcon).toBeInTheDocument()
      })
    }, 10000)

    it('shows warning icon for incomplete components', async () => {
      render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        const plotComponent = screen.getByText('Plot Structure').closest('.p-4')
        const warningIcon = plotComponent?.querySelector('.lucide-alert-circle')
        expect(warningIcon).toBeInTheDocument()
      })
    }, 10000)

    it('shows lock icon for locked components', async () => {
      render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        const settingComponent = screen.getByText('World & Setting').closest('.p-4')
        const lockIcon = settingComponent?.querySelector('.lucide-lock')
        expect(lockIcon).toBeInTheDocument()
        expect(screen.getByText('hard locked')).toBeInTheDocument()
      })
    }, 10000)
  })

  describe('Progress Bars', () => {
    it('displays progress bar for overall readiness', async () => {
      render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        const progressBar = document.querySelector('[style*="width: 75%"]')
        expect(progressBar).toBeInTheDocument()
      })
    }, 10000)

    it('applies correct color coding to progress bars', async () => {
      render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        const progressBar = document.querySelector('.bg-yellow-500')
        expect(progressBar).toBeInTheDocument()
      })
    }, 10000)
  })

  describe('Lock All Ready Functionality', () => {
    it('allows selecting multiple components', async () => {
      const { user } = render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Main Characters')).toBeInTheDocument()
      })

      const checkboxes = screen.getAllByRole('checkbox')
      const characterCheckbox = checkboxes.find((checkbox, idx) => {
        // Find checkbox associated with Main Characters
        return checkbox.closest('.p-4')?.textContent?.includes('Main Characters')
      })
      
      if (characterCheckbox) {
        await user.click(characterCheckbox)
        expect(characterCheckbox).toBeChecked()
      }
    }, 10000)

    it('shows lock controls when components are selected', async () => {
      const { user } = render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Main Characters')).toBeInTheDocument()
      })

      const checkboxes = screen.getAllByRole('checkbox')
      const checkbox = checkboxes.find(cb => cb.closest('.p-4')?.textContent?.includes('Main Characters'))
      
      if (checkbox) {
        await user.click(checkbox)
        await waitFor(() => {
          expect(screen.getByText('Lock Selected Components')).toBeInTheDocument()
          expect(screen.getByText('Lock 1 Components')).toBeInTheDocument()
        })
      }
    }, 10000)

    it('allows selecting lock level', async () => {
      const { user } = render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Main Characters')).toBeInTheDocument()
      })

      const checkboxes = screen.getAllByRole('checkbox')
      const checkbox = checkboxes.find(cb => cb.closest('.p-4')?.textContent?.includes('Main Characters'))
      
      if (checkbox) {
        await user.click(checkbox)
        
        await waitFor(() => {
          const lockLevelSelect = screen.getByRole('combobox')
          expect(lockLevelSelect).toHaveValue('hard')
        })
        
        const lockLevelSelect = screen.getByRole('combobox')
        await user.selectOptions(lockLevelSelect, 'soft')
        expect(lockLevelSelect).toHaveValue('soft')
      }
    }, 10000)

    it('calls onComponentLock when locking components', async () => {
      const onComponentLock = jest.fn()
      const { user } = render(<FoundationCheckpoint {...defaultProps} onComponentLock={onComponentLock} />)

      await waitFor(() => {
        expect(screen.getByText('Main Characters')).toBeInTheDocument()
      })

      const checkboxes = screen.getAllByRole('checkbox')
      const checkbox = checkboxes.find(cb => cb.closest('.p-4')?.textContent?.includes('Main Characters'))
      
      if (checkbox) {
        await user.click(checkbox)
        
        await waitFor(() => {
          expect(screen.getByText('Lock 1 Components')).toBeInTheDocument()
        })
        
        const lockButton = screen.getByText('Lock 1 Components')
        await user.click(lockButton)

        await waitFor(() => {
          expect(onComponentLock).toHaveBeenCalledWith(['characters-main'], 'hard')
          expect(mockAddNotification).toHaveBeenCalledWith('success', expect.stringContaining('Components Locked'))
        })
      }
    }, 10000)
  })

  describe('Continue Unlocked Option', () => {
    it('enables checkpoint creation when all components are ready', async () => {
      const readyStatus = {
        ...mockFoundationStatus,
        overall_ready: true,
        components: mockFoundationStatus.components.map(c => ({ ...c, ready: true, issues: [] }))
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => readyStatus
      })

      render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        const createButton = screen.getByText('Create Foundation Checkpoint')
        expect(createButton).not.toBeDisabled()
      })
    }, 10000)

    it('disables checkpoint creation when components are not ready', async () => {
      render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        const createButton = screen.getByText('Create Foundation Checkpoint')
        expect(createButton).toBeDisabled()
      })
    }, 10000)

    it('calls onCheckpointCreate when creating checkpoint', async () => {
      const readyStatus = {
        ...mockFoundationStatus,
        overall_ready: true,
        components: mockFoundationStatus.components.map(c => ({ ...c, ready: true, issues: [] }))
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => readyStatus
      })

      const onCheckpointCreate = jest.fn()
      const { user } = render(<FoundationCheckpoint {...defaultProps} onCheckpointCreate={onCheckpointCreate} />)

      await waitFor(() => {
        expect(screen.getByText('Create Foundation Checkpoint')).toBeInTheDocument()
      })

      const createButton = screen.getByText('Create Foundation Checkpoint')
      await user.click(createButton)

      expect(onCheckpointCreate).toHaveBeenCalled()
    }, 10000)
  })

  describe('Review & Lock Functionality', () => {
    it('allows clicking on components to select them', async () => {
      const { user } = render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Plot Structure')).toBeInTheDocument()
      })

      const plotComponent = screen.getByText('Plot Structure').closest('.p-4')!
      await user.click(plotComponent)

      expect(plotComponent).toHaveClass('border-blue-500', 'bg-blue-50')
    }, 10000)

    it('toggles component selection on click', async () => {
      const { user } = render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Plot Structure')).toBeInTheDocument()
      })

      const plotComponent = screen.getByText('Plot Structure').closest('.p-4')!
      
      // Select
      await user.click(plotComponent)
      expect(plotComponent).toHaveClass('border-blue-500')

      // Deselect
      await user.click(plotComponent)
      expect(plotComponent).not.toHaveClass('border-blue-500')
    }, 10000)
  })

  describe('Incomplete Component Warnings', () => {
    it('displays issues for incomplete components', async () => {
      render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Issues:')).toBeInTheDocument()
        expect(screen.getByText('Missing Act 2 climax')).toBeInTheDocument()
        expect(screen.getByText('Unclear character motivations')).toBeInTheDocument()
      })
    }, 10000)

    it('shows recommendations section', async () => {
      render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Recommendations')).toBeInTheDocument()
        expect(screen.getByText('Complete plot structure before locking')).toBeInTheDocument()
        expect(screen.getByText('Consider soft-locking characters to allow minor adjustments')).toBeInTheDocument()
      })
    }, 10000)
  })

  describe('API Interactions', () => {
    it('fetches foundation status on mount', async () => {
      render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects/test-project-1/foundation-status')
      })
    }, 10000)

    it('handles API errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'))

      render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        // Should still show mock data on error
        expect(screen.getByText('World & Setting')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    }, 10000)

    it('refreshes status when refresh button is clicked', async () => {
      const { user } = render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Refresh Status')).toBeInTheDocument()
      })

      jest.clearAllMocks()

      const refreshButton = screen.getByText('Refresh Status')
      await user.click(refreshButton)

      expect(global.fetch).toHaveBeenCalledWith('/api/projects/test-project-1/foundation-status')
    }, 10000)
  })

  describe('Loading and Error States', () => {
    it('shows loading skeleton initially', () => {
      render(<FoundationCheckpoint {...defaultProps} />)

      const animatePulse = document.querySelector('.animate-pulse')
      expect(animatePulse).toBeInTheDocument()
    })

    it('shows error state when foundation status is null', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => null
      })

      render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load foundation status')).toBeInTheDocument()
      })
    }, 10000)
  })

  describe('Guided Flow Mode', () => {
    it('toggles between guided flow and manual mode', async () => {
      const { user } = render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Guided Flow')).toBeInTheDocument()
      })

      const toggleButton = screen.getByText('Guided Flow')
      await user.click(toggleButton)

      expect(screen.getByText('Manual Mode')).toBeInTheDocument()
    }, 10000)
  })

  describe('Accessibility', () => {
    it('has accessible form controls', async () => {
      const { user } = render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Main Characters')).toBeInTheDocument()
      })

      // Select a component
      const checkboxes = screen.getAllByRole('checkbox')
      const checkbox = checkboxes.find(cb => cb.closest('.p-4')?.textContent?.includes('Main Characters'))
      
      if (checkbox) {
        await user.click(checkbox)

        await waitFor(() => {
          // Check lock level select has label
          const lockLevelSelect = screen.getByRole('combobox')
          expect(lockLevelSelect).toBeInTheDocument()
          expect(screen.getByText('Lock Level:')).toBeInTheDocument()
        })
      }
    }, 10000)

    it('provides keyboard navigation', async () => {
      const { user } = render(<FoundationCheckpoint {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Main Characters')).toBeInTheDocument()
      })

      // Tab through elements
      await user.tab()
      expect(screen.getByText('Guided Flow')).toHaveFocus()

      await user.tab()
      expect(screen.getAllByRole('checkbox')[0]).toHaveFocus()
    }, 10000)
  })
})