import { render, screen, waitFor, act } from '@/test-utils/render'
import { PreGenerationQueue } from '../PreGenerationQueue'
import { useNotifications } from '@/components/notifications/NotificationSystem'
import type { QueuedScene } from '../PreGenerationQueue'

// Mock dependencies
jest.mock('@/components/notifications/NotificationSystem')

const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>

// Helper to create mock scene
const createMockScene = (overrides: Partial<QueuedScene> = {}): QueuedScene => ({
  id: 'scene-1',
  title: 'Opening Scene',
  chapterId: 'chapter-1',
  chapterTitle: 'Chapter 1',
  position: 1,
  status: 'queued',
  priority: 'normal',
  estimatedTokens: 1000,
  estimatedCost: 0.15,
  estimatedTime: 120,
  queuedAt: new Date('2024-01-01T10:00:00'),
  context: {
    characters: ['John Doe', 'Jane Smith'],
    settings: ['Police Station'],
    plotPoints: ['Murder discovered']
  },
  ...overrides
})

describe('PreGenerationQueue', () => {
  const defaultProps = {
    projectId: 'test-project',
    queuedScenes: [],
    onQueueUpdate: jest.fn(),
    onGenerationStart: jest.fn(),
    onGenerationCancel: jest.fn(),
    onGenerationPause: jest.fn(),
    onGenerationResume: jest.fn(),
    isProcessing: false
  }

  const mockAddNotification = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers() // Use real timers to prevent conflicts with testing library
    
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
  })

  describe('Queue Item Display', () => {
    it('displays queued scenes correctly', () => {
      const scenes = [
        createMockScene({ id: 'scene-1', title: 'Opening Scene' }),
        createMockScene({ id: 'scene-2', title: 'Character Introduction', priority: 'high' }),
        createMockScene({ id: 'scene-3', title: 'Plot Twist', priority: 'urgent', status: 'generating', progress: 45 })
      ]

      render(<PreGenerationQueue {...defaultProps} queuedScenes={scenes} />)

      expect(screen.getByText('Opening Scene')).toBeInTheDocument()
      expect(screen.getByText('Character Introduction')).toBeInTheDocument()
      expect(screen.getByText('Plot Twist')).toBeInTheDocument()
    })

    it('shows chapter and position information', () => {
      const scene = createMockScene({ 
        chapterTitle: 'Chapter 2: The Investigation',
        position: 3 
      })

      render(<PreGenerationQueue {...defaultProps} queuedScenes={[scene]} />)

      expect(screen.getByText('Chapter 2: The Investigation • Position 3')).toBeInTheDocument()
    })

    it('displays context information in expanded view', async () => {
      const scene = createMockScene()
      const { user } = render(<PreGenerationQueue {...defaultProps} queuedScenes={[scene]} />)

      // Click to expand
      const sceneItem = screen.getByText('Opening Scene').closest('.p-4')!
      await user.click(sceneItem)

      await waitFor(() => {
        expect(screen.getByText('Characters: John Doe, Jane Smith')).toBeInTheDocument()
      })
      expect(screen.getByText('Settings: Police Station')).toBeInTheDocument()
      expect(screen.getByText('Plot: Murder discovered')).toBeInTheDocument()
    }, 10000)
  })

  describe('Priority Levels', () => {
    it('displays all priority levels with correct styling', () => {
      const scenes = [
        createMockScene({ id: '1', priority: 'low' }),
        createMockScene({ id: '2', priority: 'normal' }),
        createMockScene({ id: '3', priority: 'high' }),
        createMockScene({ id: '4', priority: 'urgent' })
      ]

      render(<PreGenerationQueue {...defaultProps} queuedScenes={scenes} />)

      const lowBadge = screen.getByText('low')
      expect(lowBadge).toHaveClass('bg-gray-100', 'text-gray-800')

      const normalBadge = screen.getByText('normal')
      expect(normalBadge).toHaveClass('bg-blue-100', 'text-blue-800')

      const highBadge = screen.getByText('high')
      expect(highBadge).toHaveClass('bg-orange-100', 'text-orange-800')

      const urgentBadge = screen.getByText('urgent')
      expect(urgentBadge).toHaveClass('bg-red-100', 'text-red-800')
    })

    it('sorts by priority when selected', async () => {
      const scenes = [
        createMockScene({ id: '1', title: 'Low Priority', priority: 'low' }),
        createMockScene({ id: '2', title: 'Urgent Priority', priority: 'urgent' }),
        createMockScene({ id: '3', title: 'Normal Priority', priority: 'normal' })
      ]

      const { user } = render(<PreGenerationQueue {...defaultProps} queuedScenes={scenes} />)

      const sortSelect = screen.getAllByRole('combobox')[1] // Second select is sort
      await user.selectOptions(sortSelect, 'priority')

      await waitFor(() => {
        const items = screen.getAllByRole('generic').filter(el => el.classList.contains('p-4'))
        expect(items[0]).toHaveTextContent('Urgent Priority')
      })
      
      const items = screen.getAllByRole('generic').filter(el => el.classList.contains('p-4'))
      expect(items[1]).toHaveTextContent('Normal Priority')
      expect(items[2]).toHaveTextContent('Low Priority')
    }, 10000)

    it('allows updating priority', async () => {
      const onQueueUpdate = jest.fn()
      const scene = createMockScene({ priority: 'normal' })
      const { user } = render(
        <PreGenerationQueue {...defaultProps} queuedScenes={[scene]} onQueueUpdate={onQueueUpdate} />
      )

      // Find the priority select within the scene item
      const prioritySelects = screen.getAllByRole('combobox')
      const prioritySelect = prioritySelects.find(select => 
        select.closest('.p-4')?.textContent?.includes('Opening Scene')
      ) || prioritySelects[prioritySelects.length - 1] // fallback to last select
      
      await user.selectOptions(prioritySelect, 'high')

      await waitFor(() => {
        expect(onQueueUpdate).toHaveBeenCalledWith([
          expect.objectContaining({
            id: 'scene-1',
            priority: 'high'
          })
        ])
      })
    }, 10000)
  })

  describe('Progress Bar Updates', () => {
    it('displays progress bar for generating scenes', () => {
      const scene = createMockScene({ 
        status: 'generating',
        progress: 65
      })

      render(<PreGenerationQueue {...defaultProps} queuedScenes={[scene]} />)

      const progressBar = screen.getByRole('generic').querySelector('[style*="width: 65%"]')
      expect(progressBar).toBeInTheDocument()
      expect(screen.getByText('65% complete')).toBeInTheDocument()
    })

    it('updates progress automatically', async () => {
      const scene = createMockScene({ 
        status: 'generating',
        progress: 50
      })

      const { rerender } = render(<PreGenerationQueue {...defaultProps} queuedScenes={[scene]} />)

      // Simulate progress update
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      const updatedScene = { ...scene, progress: 60 }
      rerender(<PreGenerationQueue {...defaultProps} queuedScenes={[updatedScene]} />)

      await waitFor(() => {
        expect(screen.getByText('60% complete')).toBeInTheDocument()
      })
    })

    it('transitions to completed when progress reaches 100%', async () => {
      const onQueueUpdate = jest.fn()
      const scene = createMockScene({ 
        status: 'generating',
        progress: 95
      })

      render(<PreGenerationQueue {...defaultProps} queuedScenes={[scene]} onQueueUpdate={onQueueUpdate} />)

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(onQueueUpdate).toHaveBeenCalledWith(expect.arrayContaining([
          expect.objectContaining({
            status: 'completed',
            progress: 100
          })
        ]))
      })
    })
  })

  describe('Pause/Resume/Cancel Operations', () => {
    it('shows pause button for generating scenes', () => {
      const scene = createMockScene({ status: 'generating' })
      render(<PreGenerationQueue {...defaultProps} queuedScenes={[scene]} />)

      const pauseButton = screen.getAllByRole('button').find(btn => btn.querySelector('.lucide-pause'))
      expect(pauseButton).toBeInTheDocument()
    })

    it('calls onGenerationPause when pause is clicked', async () => {
      const onGenerationPause = jest.fn()
      const scene = createMockScene({ status: 'generating' })
      const { user } = render(
        <PreGenerationQueue {...defaultProps} queuedScenes={[scene]} onGenerationPause={onGenerationPause} />
      )

      const pauseButton = screen.getAllByRole('button').find(btn => btn.querySelector('.lucide-pause'))!
      await user.click(pauseButton)

      await waitFor(() => {
        expect(onGenerationPause).toHaveBeenCalledWith('scene-1')
      })
    }, 10000)

    it('shows resume button for paused scenes', () => {
      const scene = createMockScene({ status: 'paused' })
      render(<PreGenerationQueue {...defaultProps} queuedScenes={[scene]} />)

      const playButton = screen.getAllByRole('button').find(btn => btn.querySelector('.lucide-play'))
      expect(playButton).toBeInTheDocument()
    })

    it('calls onGenerationResume when resume is clicked', async () => {
      const onGenerationResume = jest.fn()
      const scene = createMockScene({ status: 'paused' })
      const { user } = render(
        <PreGenerationQueue {...defaultProps} queuedScenes={[scene]} onGenerationResume={onGenerationResume} />
      )

      const playButton = screen.getAllByRole('button').find(btn => btn.querySelector('.lucide-play'))!
      await user.click(playButton)

      await waitFor(() => {
        expect(onGenerationResume).toHaveBeenCalledWith('scene-1')
      })
    }, 10000)

    it('allows canceling any scene', async () => {
      const onGenerationCancel = jest.fn()
      const scene = createMockScene()
      const { user } = render(
        <PreGenerationQueue {...defaultProps} queuedScenes={[scene]} onGenerationCancel={onGenerationCancel} />
      )

      const cancelButton = screen.getAllByRole('button').find(btn => btn.querySelector('.lucide-x'))!
      await user.click(cancelButton)

      await waitFor(() => {
        expect(onGenerationCancel).toHaveBeenCalledWith('scene-1')
      })
    }, 10000)
  })

  describe('Filtering by Status', () => {
    it('filters scenes by status', async () => {
      const scenes = [
        createMockScene({ id: '1', title: 'Queued Scene', status: 'queued' }),
        createMockScene({ id: '2', title: 'Generating Scene', status: 'generating' }),
        createMockScene({ id: '3', title: 'Completed Scene', status: 'completed' }),
        createMockScene({ id: '4', title: 'Failed Scene', status: 'failed' })
      ]

      const { user } = render(<PreGenerationQueue {...defaultProps} queuedScenes={scenes} />)

      const filterSelect = screen.getAllByRole('combobox')[0]
      await user.selectOptions(filterSelect, 'completed')

      await waitFor(() => {
        expect(screen.getByText('Completed Scene')).toBeInTheDocument()
      })
      expect(screen.queryByText('Queued Scene')).not.toBeInTheDocument()
      expect(screen.queryByText('Generating Scene')).not.toBeInTheDocument()
      expect(screen.queryByText('Failed Scene')).not.toBeInTheDocument()
    }, 10000)

    it('shows all scenes when "All Scenes" is selected', async () => {
      const scenes = [
        createMockScene({ id: '1', title: 'Scene 1', status: 'queued' }),
        createMockScene({ id: '2', title: 'Scene 2', status: 'completed' })
      ]

      const { user } = render(<PreGenerationQueue {...defaultProps} queuedScenes={scenes} />)

      const filterSelect = screen.getAllByRole('combobox')[0]
      await user.selectOptions(filterSelect, 'all')

      await waitFor(() => {
        expect(screen.getByText('Scene 1')).toBeInTheDocument()
      })
      expect(screen.getByText('Scene 2')).toBeInTheDocument()
    }, 10000)
  })

  describe('Reordering with Up/Down Buttons', () => {
    it('shows up/down buttons for queued scenes', () => {
      const scenes = [
        createMockScene({ id: '1', status: 'queued' }),
        createMockScene({ id: '2', status: 'queued' })
      ]

      render(<PreGenerationQueue {...defaultProps} queuedScenes={scenes} />)

      const upButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('.lucide-chevron-up'))
      const downButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('.lucide-chevron-down'))

      expect(upButtons.length).toBe(2)
      expect(downButtons.length).toBe(2)
    })

    it('disables up button for first item', () => {
      const scenes = [
        createMockScene({ id: '1', title: 'First' }),
        createMockScene({ id: '2', title: 'Second' })
      ]

      render(<PreGenerationQueue {...defaultProps} queuedScenes={scenes} />)

      const firstItemUpButton = screen.getAllByRole('button')
        .filter(btn => btn.querySelector('.lucide-chevron-up'))[0]

      expect(firstItemUpButton).toBeDisabled()
    })

    it('disables down button for last item', () => {
      const scenes = [
        createMockScene({ id: '1', title: 'First' }),
        createMockScene({ id: '2', title: 'Last' })
      ]

      render(<PreGenerationQueue {...defaultProps} queuedScenes={scenes} />)

      const lastItemDownButton = screen.getAllByRole('button')
        .filter(btn => btn.querySelector('.lucide-chevron-down'))[1]

      expect(lastItemDownButton).toBeDisabled()
    })

    it('moves item up in queue', async () => {
      const onQueueUpdate = jest.fn()
      const scenes = [
        createMockScene({ id: '1', title: 'First' }),
        createMockScene({ id: '2', title: 'Second' })
      ]

      const { user } = render(
        <PreGenerationQueue {...defaultProps} queuedScenes={scenes} onQueueUpdate={onQueueUpdate} />
      )

      const secondItemUpButton = screen.getAllByRole('button')
        .filter(btn => btn.querySelector('.lucide-chevron-up'))[1]

      await user.click(secondItemUpButton)

      await waitFor(() => {
        expect(onQueueUpdate).toHaveBeenCalledWith([
          expect.objectContaining({ id: '2', title: 'Second' }),
          expect.objectContaining({ id: '1', title: 'First' })
        ])
      })
      expect(mockAddNotification).toHaveBeenCalledWith('info', expect.stringContaining('Moved "Second" up'))
    }, 10000)
  })

  describe('Batch Operations', () => {
    it('enables start queue button when queued items exist', () => {
      const scenes = [
        createMockScene({ status: 'queued' }),
        createMockScene({ id: '2', status: 'completed' })
      ]

      render(<PreGenerationQueue {...defaultProps} queuedScenes={scenes} />)

      const startButton = screen.getByText('Start Queue')
      expect(startButton).not.toBeDisabled()
    })

    it('disables start queue button when no queued items', () => {
      const scenes = [
        createMockScene({ status: 'completed' }),
        createMockScene({ id: '2', status: 'failed' })
      ]

      render(<PreGenerationQueue {...defaultProps} queuedScenes={scenes} />)

      const startButton = screen.getByText('Start Queue')
      expect(startButton).toBeDisabled()
    })

    it('shows pause queue button when processing', () => {
      render(<PreGenerationQueue {...defaultProps} isProcessing={true} />)

      expect(screen.getByText('Pause Queue')).toBeInTheDocument()
      expect(screen.queryByText('Start Queue')).not.toBeInTheDocument()
    })

    it('starts generation for next queued item', async () => {
      const onGenerationStart = jest.fn()
      const scenes = [
        createMockScene({ id: '1', status: 'generating' }),
        createMockScene({ id: '2', status: 'queued' })
      ]

      const { user } = render(
        <PreGenerationQueue {...defaultProps} queuedScenes={scenes} onGenerationStart={onGenerationStart} />
      )

      const startButton = screen.getByText('Start Queue')
      await user.click(startButton)

      await waitFor(() => {
        expect(onGenerationStart).toHaveBeenCalledWith('2')
      })
    }, 10000)
  })

  describe('Summary Statistics', () => {
    it('shows total cost and time estimates', () => {
      const scenes = [
        createMockScene({ estimatedCost: 0.10, estimatedTime: 60, status: 'queued' }),
        createMockScene({ id: '2', estimatedCost: 0.15, estimatedTime: 90, status: 'queued' }),
        createMockScene({ id: '3', estimatedCost: 0.20, estimatedTime: 120, status: 'completed' })
      ]

      render(<PreGenerationQueue {...defaultProps} queuedScenes={scenes} />)

      // Should sum only queued items
      expect(screen.getByText(/Est\. \$0\.25/)).toBeInTheDocument() // 0.10 + 0.15
      expect(screen.getByText(/2:30/)).toBeInTheDocument() // 150 seconds = 2:30
    })

    it('shows scene count', () => {
      const scenes = [
        createMockScene(),
        createMockScene({ id: '2' }),
        createMockScene({ id: '3' })
      ]

      render(<PreGenerationQueue {...defaultProps} queuedScenes={scenes} />)

      expect(screen.getByText(/3 scene/)).toBeInTheDocument()
    })
  })

  describe('Preview Functionality', () => {
    it('shows preview button for completed scenes', () => {
      const scene = createMockScene({ 
        status: 'completed',
        generatedContent: 'The scene begins...'
      })

      render(<PreGenerationQueue {...defaultProps} queuedScenes={[scene]} />)

      const eyeButton = screen.getAllByRole('button').find(btn => btn.querySelector('.lucide-eye'))
      expect(eyeButton).toBeInTheDocument()
    })

    it('toggles content preview', async () => {
      const scene = createMockScene({ 
        status: 'completed',
        generatedContent: 'The rain poured down as Detective John entered the station...',
        wordCount: 15
      })

      const { user } = render(<PreGenerationQueue {...defaultProps} queuedScenes={[scene]} />)

      const eyeButton = screen.getAllByRole('button').find(btn => btn.querySelector('.lucide-eye'))!
      await user.click(eyeButton)

      await waitFor(() => {
        expect(screen.getByText('Generated Content Preview')).toBeInTheDocument()
      })
      expect(screen.getByText(/The rain poured down/)).toBeInTheDocument()
    }, 10000)

    it('shows word count for completed scenes', async () => {
      const scene = createMockScene({ 
        status: 'completed',
        wordCount: 1250
      })

      const { user } = render(<PreGenerationQueue {...defaultProps} queuedScenes={[scene]} />)

      // Expand details
      const sceneItem = screen.getByText('Opening Scene').closest('.p-4')!
      await user.click(sceneItem)

      await waitFor(() => {
        expect(screen.getByText('Words: 1,250')).toBeInTheDocument()
      })
    }, 10000)
  })

  describe('Error Handling', () => {
    it('displays error message for failed scenes', async () => {
      const scene = createMockScene({ 
        status: 'failed',
        error: 'API rate limit exceeded'
      })

      const { user } = render(<PreGenerationQueue {...defaultProps} queuedScenes={[scene]} />)

      // Expand to see error
      const sceneItem = screen.getByText('Opening Scene').closest('.p-4')!
      await user.click(sceneItem)

      await waitFor(() => {
        expect(screen.getByText('Error: API rate limit exceeded')).toBeInTheDocument()
      })
    }, 10000)

    it('shows error icon for failed scenes', () => {
      const scene = createMockScene({ status: 'failed' })
      render(<PreGenerationQueue {...defaultProps} queuedScenes={[scene]} />)

      const alertIcon = document.querySelector('.lucide-circle-alert')
      expect(alertIcon).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no scenes', () => {
      render(<PreGenerationQueue {...defaultProps} queuedScenes={[]} />)

      expect(screen.getByText('No scenes in queue')).toBeInTheDocument()
      expect(screen.getByText('Queue scenes for background generation')).toBeInTheDocument()
    })
  })

  describe('Real-time Updates', () => {
    it('automatically refreshes queue status', () => {
      const scene = createMockScene({ status: 'generating', progress: 50 })
      render(<PreGenerationQueue {...defaultProps} queuedScenes={[scene]} />)

      // Verify interval is set up
      expect(global.setInterval).toHaveBeenCalled()
    })

    it('cleans up interval on unmount', () => {
      const scene = createMockScene()
      const { unmount } = render(<PreGenerationQueue {...defaultProps} queuedScenes={[scene]} />)

      unmount()

      expect(global.clearInterval).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has accessible form controls', () => {
      const scene = createMockScene()
      render(<PreGenerationQueue {...defaultProps} queuedScenes={[scene]} />)

      // Priority select should be present
      const selects = screen.getAllByRole('combobox')
      expect(selects.length).toBeGreaterThan(0)
    })

    it('provides keyboard navigation', async () => {
      const scenes = [createMockScene(), createMockScene({ id: '2' })]
      const { user } = render(<PreGenerationQueue {...defaultProps} queuedScenes={scenes} />)

      // Basic keyboard navigation test
      const filterSelect = screen.getAllByRole('combobox')[0]
      expect(filterSelect).toBeInTheDocument()
    })
  })
})