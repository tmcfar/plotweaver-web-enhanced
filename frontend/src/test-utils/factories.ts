import type { LockLevel, LockType } from '@/components/locks/LockIndicator'
import type { ComponentLock, LockState, ProjectComponent } from '@/components/locks/LockManagementPanel'
import type { LockConflict } from '@/lib/api/locks'

// Factory for creating lock indicator props
export const createLockIndicatorProps = (overrides?: Partial<any>) => ({
  componentId: 'test-component-1',
  lockLevel: null,
  onLockToggle: jest.fn(),
  onOverrideRequest: jest.fn(),
  ...overrides,
})

// Factory for creating component locks
export const createComponentLock = (overrides?: Partial<ComponentLock>): ComponentLock => ({
  id: 'lock-1',
  componentId: 'component-1',
  level: 'soft' as LockLevel,
  type: 'personal' as LockType,
  reason: 'Test lock reason',
  lockedBy: 'Test User',
  lockedAt: new Date('2024-01-15T10:00:00'),
  canOverride: false,
  ...overrides,
})

// Factory for creating project components
export const createProjectComponent = (overrides?: Partial<ProjectComponent>): ProjectComponent => ({
  id: 'component-1',
  name: 'Test Component',
  type: 'chapter',
  path: '/chapters/1',
  ...overrides,
})

// Factory for creating nested project components
export const createProjectComponentWithChildren = (
  parent: Partial<ProjectComponent> = {},
  children: Partial<ProjectComponent>[] = []
): ProjectComponent => {
  const parentComponent = createProjectComponent(parent)
  const childComponents = children.map((child, index) => 
    createProjectComponent({
      id: `${parentComponent.id}-child-${index}`,
      parent: parentComponent.id,
      ...child,
    })
  )
  
  return {
    ...parentComponent,
    children: childComponents,
  }
}

// Factory for creating lock state
export const createLockState = (overrides?: Partial<LockState>): LockState => ({
  locks: {},
  conflicts: [],
  ...overrides,
})

// Factory for creating lock conflicts
export const createLockConflict = (overrides?: Partial<LockConflict>): LockConflict => ({
  id: 'conflict-1',
  componentId: 'component-1',
  componentType: 'chapter',
  componentName: 'Test Component',
  type: 'lock_override',
  description: 'This component is locked by another user',
  currentState: { locked: true },
  conflictingState: { locked: false },
  priority: 'high',
  affectedUsers: ['User1', 'User2'],
  lockedBy: 'User1',
  lockLevel: 'hard',
  createdAt: '2024-01-15T10:00:00Z',
  reason: 'Test conflict reason',
  ...overrides,
})

// Factory for creating multiple locks
export const createMultipleLocks = (count: number, overrides?: Partial<ComponentLock>[]): Record<string, ComponentLock> => {
  const locks: Record<string, ComponentLock> = {}
  
  for (let i = 0; i < count; i++) {
    const lock = createComponentLock({
      id: `lock-${i}`,
      componentId: `component-${i}`,
      ...overrides?.[i],
    })
    locks[lock.componentId] = lock
  }
  
  return locks
}

// Factory for creating test scenarios
export const createLockTestScenario = () => {
  const components: ProjectComponent[] = [
    createProjectComponentWithChildren(
      { id: 'character-1', name: 'John Doe', type: 'character', path: '/characters/john-doe' },
      [{ name: 'Introduction Scene', type: 'scene', path: '/characters/john-doe/scenes/intro' }]
    ),
    createProjectComponent({ id: 'chapter-1', name: 'Chapter 1', type: 'chapter', path: '/chapters/1' }),
  ]
  
  const locks: Record<string, ComponentLock> = {
    'character-1': createComponentLock({
      id: 'lock-1',
      componentId: 'character-1',
      level: 'soft',
      type: 'personal',
      reason: 'Character development in progress',
      lockedBy: 'Alice',
    }),
    'character-1-child-0': createComponentLock({
      id: 'lock-2',
      componentId: 'character-1-child-0',
      level: 'hard',
      type: 'editorial',
      reason: 'Editorial review',
      lockedBy: 'Bob',
      canOverride: true,
    }),
  }
  
  const lockState = createLockState({ locks })
  
  return { components, lockState }
}

// Helper to create component type icons
export const getComponentIcon = (type: string): string => {
  const icons: Record<string, string> = {
    character: '👤',
    scene: '🎬',
    chapter: '📄',
    act: '🎭',
    location: '📍',
  }
  return icons[type] || '📄'
}

// Helper to create date strings
export const createDateString = (daysAgo: number = 0): string => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

// Helper to create formatted dates
export const createFormattedDate = (daysAgo: number = 0): Date => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date
}