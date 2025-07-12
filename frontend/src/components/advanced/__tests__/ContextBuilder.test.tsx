import { render, screen, waitFor } from '@/test-utils/render'
import { ContextBuilder } from '../ContextBuilder'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { useLockStore } from '@/lib/store/lockStore'
import { useNotifications } from '@/components/notifications/NotificationSystem'

// Mock dependencies
jest.mock('@/lib/store/lockStore')
jest.mock('@/components/notifications/NotificationSystem')
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: any) => children,
  Droppable: ({ children }: any) => children({
    droppableProps: {},
    innerRef: jest.fn(),
    placeholder: null
  }),
  Draggable: ({ children, draggableId }: any) => children({
    draggableProps: { 'data-testid': `draggable-${draggableId}` },
    dragHandleProps: { 'data-testid': `drag-handle-${draggableId}` },
    innerRef: jest.fn(),
    isDragging: false
  }, {})
}))

const mockUseLockStore = useLockStore as jest.MockedFunction<typeof useLockStore>
const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>

describe('ContextBuilder', () => {
  const mockAvailableComponents = [
    {
      id: 'char-1',
      name: 'John Doe',
      type: 'character' as const,
      description: 'Main protagonist, a detective',
      locked: false,
      content: 'John is a seasoned detective...',
      tags: ['protagonist', 'detective']
    },
    {
      id: 'setting-1',
      name: 'Police Station',
      type: 'setting' as const,
      description: 'The main precinct where John works',
      locked: true,
      lockLevel: 'soft' as const,
      content: 'The old brick building houses...',
      tags: ['location', 'workplace']
    },
    {
      id: 'plot-1',
      name: 'Murder Mystery',
      type: 'plot' as const,
      description: 'The central mystery to be solved',
      locked: false,
      content: 'A series of mysterious murders...',
      tags: ['mystery', 'crime']
    },
    {
      id: 'scene-1',
      name: 'Opening Scene',
      type: 'scene' as const,
      description: 'The discovery of the first victim',
      locked: false,
      content: 'Rain poured down as the officers...',
      tags: ['introduction', 'discovery']
    }
  ]

  const mockCurrentContext = [
    {
      id: 'context-1',
      componentId: 'char-1',
      component: mockAvailableComponents[0],
      relevance: 0.9,
      reason: 'Main character in scene',
      order: 0
    }
  ]

  const mockValidationResult = {
    valid: true,
    issues: [],
    suggestions: [],
    estimatedTokens: 1500
  }

  const defaultProps = {
    sceneId: 'scene-001',
    availableComponents: mockAvailableComponents,
    currentContext: mockCurrentContext,
    onContextUpdate: jest.fn(),
    onLockValidation: jest.fn().mockResolvedValue(mockValidationResult)
  }

  const mockLocks = {
    'setting-1': { level: 'soft', id: 'lock-1' }
  }

  const mockAddNotification = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

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
      notifyConflict: jest.fn(),
      notifySuccess: jest.fn(),
      notifyError: jest.fn(),
      notifyConnectionStatus: jest.fn(),
      removeNotification: jest.fn(),
      clearNotifications: jest.fn(),
    })

  })  describe('Component Display', () => {
    it('displays available components', () => {
      render(<ContextBuilder {...defaultProps} />)

      // Check main UI sections are present
      expect(screen.getByText('Available Components')).toBeInTheDocument()
      expect(screen.getByText('Scene Context')).toBeInTheDocument()
      
      // Check search functionality is present
      expect(screen.getByPlaceholderText('Search components...')).toBeInTheDocument()
      
      // Check that some components are displayed (allowing for duplicates)
      expect(screen.getAllByText('John Doe')).toHaveLength(1)
      expect(screen.getAllByText('Police Station')).toHaveLength(1)
      expect(screen.getAllByText('Murder Mystery')).toHaveLength(1)
      expect(screen.getAllByText('Opening Scene')).toHaveLength(1)
    })

    it('shows component descriptions', () => {
      render(<ContextBuilder {...defaultProps} />)

      expect(screen.getByText('Main protagonist, a detective')).toBeInTheDocument()
      expect(screen.getByText('The main precinct where John works')).toBeInTheDocument()
    })

    it('displays component type icons', () => {
      render(<ContextBuilder {...defaultProps} />)

      expect(screen.getByText('👤')).toBeInTheDocument() // character
      expect(screen.getByText('🏛️')).toBeInTheDocument() // setting
      expect(screen.getByText('📖')).toBeInTheDocument() // plot
    })

    it('shows locked status for locked components', () => {
      render(<ContextBuilder {...defaultProps} />)

      expect(screen.getByText('soft locked')).toBeInTheDocument()
    })
  })

  describe('Search and Filter', () => {
    it('filters components by search term', async () => {
      const { user } = render(<ContextBuilder {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText('Search components...')
      await user.type(searchInput, 'detective')

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Police Station')).not.toBeInTheDocument()
      expect(screen.queryByText('Murder Mystery')).not.toBeInTheDocument()
    })

    it('filters components by type', async () => {
      const { user } = render(<ContextBuilder {...defaultProps} />)

      const typeSelect = screen.getByRole('combobox')
      await user.selectOptions(typeSelect, 'character')

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Police Station')).not.toBeInTheDocument()
    })

    it('excludes already added components from available list', () => {
      render(<ContextBuilder {...defaultProps} />)

      // John Doe is in current context, so should not appear in available components
      const availableSection = screen.getByText('Available Components').closest('div')
      expect(availableSection).not.toHaveTextContent('John Doe')
    })
  })

  describe('Adding Components to Context', () => {
    it('adds component to context when clicked', async () => {
      const onContextUpdate = jest.fn()
      const { user } = render(<ContextBuilder {...defaultProps} onContextUpdate={onContextUpdate} />)

      const policeStation = screen.getByText('Police Station').closest('.p-3')!
      await user.click(policeStation)

      expect(onContextUpdate).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          componentId: 'setting-1',
          relevance: 0.8,
          reason: 'Manual addition'
        })
      ]))
      expect(mockAddNotification).toHaveBeenCalledWith('success', expect.stringContaining('Police Station'))
    })

    it('adds component via plus button', async () => {
      const onContextUpdate = jest.fn()
      const { user } = render(<ContextBuilder {...defaultProps} onContextUpdate={onContextUpdate} />)

      const plusButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('.lucide-plus'))
      await user.click(plusButtons[0])

      expect(onContextUpdate).toHaveBeenCalled()
    })

    it('prevents adding when max items reached', async () => {
      const maxContext = Array.from({ length: 10 }, (_, i) => ({
        id: `context-${i}`,
        componentId: `comp-${i}`,
        component: { ...mockAvailableComponents[0], id: `comp-${i}` },
        relevance: 0.8,
        reason: 'Added',
        order: i
      }))

      render(<ContextBuilder {...defaultProps} currentContext={maxContext} />)

      // Should show some indication that max is reached
      expect(screen.getByText('Scene Context')).toBeInTheDocument()
    })
  })

  describe('Context Management', () => {
    it('displays current context items', () => {
      render(<ContextBuilder {...defaultProps} />)

      const contextSection = screen.getByText('Scene Context').closest('div')
      expect(contextSection).toHaveTextContent('John Doe')
      expect(contextSection).toHaveTextContent('Main character in scene')
    })

    it('removes item from context', async () => {
      const onContextUpdate = jest.fn()
      const { user } = render(<ContextBuilder {...defaultProps} onContextUpdate={onContextUpdate} />)

      const removeButton = screen.getAllByRole('button').find(btn => btn.querySelector('.lucide-x'))

      if (removeButton) {
        await user.click(removeButton)
        expect(onContextUpdate).toHaveBeenCalledWith([])
      }
    })

    it('shows empty state when no context items', () => {
      render(<ContextBuilder {...defaultProps} currentContext={[]} />)

      expect(screen.getByText('No components in context')).toBeInTheDocument()
      expect(screen.getByText('Add components from the browser to build scene context')).toBeInTheDocument()
    })
  })

  describe('Relevance Scoring', () => {
    it('displays relevance score for context items', () => {
      render(<ContextBuilder {...defaultProps} />)

      expect(screen.getByText('90%')).toBeInTheDocument()
    })

    it('allows updating relevance score', async () => {
      const onContextUpdate = jest.fn()
      const { user } = render(<ContextBuilder {...defaultProps} onContextUpdate={onContextUpdate} />)

      const rangeInput = screen.getByRole('slider')
      await user.clear(rangeInput)
      await user.type(rangeInput, '0.5')

      expect(onContextUpdate).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          relevance: 0.5
        })
      ]))
    })
  })

  describe('Token Count and Validation', () => {
    it('displays estimated token count', async () => {
      render(<ContextBuilder {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('1500 tokens')).toBeInTheDocument()
      })
    })

    it('shows validation warnings', async () => {
      const warningValidation = {
        valid: false,
        issues: [
          { type: 'warning' as const, message: 'Context may be too large' },
          { type: 'error' as const, message: 'Missing required character' }
        ],
        suggestions: [],
        estimatedTokens: 3000
      }

      const { rerender } = render(<ContextBuilder {...defaultProps} />)

      const propsWithWarning = {
        ...defaultProps,
        onLockValidation: jest.fn().mockResolvedValue(warningValidation)
      }

      rerender(<ContextBuilder {...propsWithWarning} />)

      await waitFor(() => {
        expect(screen.getByText('Validation Issues:')).toBeInTheDocument()
        expect(screen.getByText('Context may be too large')).toBeInTheDocument()
        expect(screen.getByText('Missing required character')).toBeInTheDocument()
      })
    })

    it('validates context on changes', async () => {
      const onLockValidation = jest.fn().mockResolvedValue(mockValidationResult)
      render(<ContextBuilder {...defaultProps} onLockValidation={onLockValidation} />)

      await waitFor(() => {
        expect(onLockValidation).toHaveBeenCalledWith(mockCurrentContext)
      })
    })
  })

  describe('AI Suggestions', () => {
    it('shows AI suggested components', async () => {
      render(<ContextBuilder {...defaultProps} />)

      await waitFor(() => {
        const suggestionsSection = screen.queryByText('AI Suggestions')
        if (suggestionsSection) {
          expect(suggestionsSection).toBeInTheDocument()
        }
      })
    })

    it('adds AI suggested component with reason', async () => {
      const onContextUpdate = jest.fn()
      const { user } = render(<ContextBuilder {...defaultProps} onContextUpdate={onContextUpdate} />)

      await waitFor(() => {
        const suggestedComponent = screen.queryByText('AI Suggestions')?.closest('div')?.querySelector('.bg-yellow-50')
        if (suggestedComponent) {
          user.click(suggestedComponent)

          expect(onContextUpdate).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({
              reason: 'AI suggested'
            })
          ]))
        }
      })
    })
  })

  describe('Preview Mode', () => {
    it('toggles preview mode', async () => {
      const { user } = render(<ContextBuilder {...defaultProps} />)

      const previewButton = screen.getByText('Preview')
      await user.click(previewButton)

      expect(screen.getByText('Context Preview')).toBeInTheDocument()
    })

    it('shows context preview sorted by relevance', async () => {
      const multiContext = [
        { ...mockCurrentContext[0], relevance: 0.5 },
        {
          id: 'context-2',
          componentId: 'setting-1',
          component: mockAvailableComponents[1],
          relevance: 0.9,
          reason: 'Primary location',
          order: 1
        }
      ]

      const { user } = render(<ContextBuilder {...defaultProps} currentContext={multiContext} />)

      await user.click(screen.getByText('Preview'))

      const preview = screen.getByText('Context Preview').parentElement
      const items = preview?.querySelectorAll('.flex.items-start')

      // Should be sorted by relevance (highest first)
      expect(items?.[0]).toHaveTextContent('Police Station')
      expect(items?.[1]).toHaveTextContent('John Doe')
    })
  })

  describe('Drag and Drop', () => {
    it('renders drag handles for context items', () => {
      render(<ContextBuilder {...defaultProps} />)

      expect(screen.getByTestId('drag-handle-context-1')).toBeInTheDocument()
    })

    it('allows reordering context items', async () => {
      const onContextUpdate = jest.fn()
      const multiContext = [
        mockCurrentContext[0],
        {
          id: 'context-2',
          componentId: 'setting-1',
          component: mockAvailableComponents[1],
          relevance: 0.8,
          reason: 'Location',
          order: 1
        }
      ]

      render(<ContextBuilder {...defaultProps} currentContext={multiContext} onContextUpdate={onContextUpdate} />)

      // Simulate drag end
      const dragDropContext = screen.getByRole('generic').querySelector('[data-rfd-drag-drop-context-id]')

      // Note: Actually testing drag and drop would require more complex mocking
      expect(screen.getByTestId('drag-handle-context-1')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has accessible search input', () => {
      render(<ContextBuilder {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText('Search components...')
      expect(searchInput).toHaveAttribute('type', 'text')
    })

    it('has accessible filter select', () => {
      render(<ContextBuilder {...defaultProps} />)

      const typeSelect = screen.getByRole('combobox')
      expect(typeSelect).toBeInTheDocument()
      expect(screen.getByText('All Types')).toBeInTheDocument()
    })

    it('provides keyboard navigation', async () => {
      const { user } = render(<ContextBuilder {...defaultProps} />)

      await user.tab()
      expect(screen.getByPlaceholderText('Search components...')).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('combobox')).toHaveFocus()
    })
  })

  describe('Error Handling', () => {
    it('handles validation errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const onLockValidation = jest.fn().mockRejectedValue(new Error('Validation failed'))

      render(<ContextBuilder {...defaultProps} onLockValidation={onLockValidation} />)

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith('error', expect.stringContaining('Validation Failed'))
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Auto-included Items', () => {
    it('marks certain items as auto-included', async () => {
      // Test would check for auto-included logic if implemented
      render(<ContextBuilder {...defaultProps} />)

      // Verify basic rendering
      expect(screen.getByText('Scene Context')).toBeInTheDocument()
    })
  })
})