# PlotWeaver Frontend (pw-web) - Incremental Testing Guide

## Overview
This guide provides step-by-step instructions for testing each major component of the PlotWeaver frontend. Follow these tests incrementally to ensure each layer works before moving to the next.

## Prerequisites

```bash
cd /home/tmcfar/dev/pw-web/frontend
npm install
npm install -D @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

## Layer 1: Component Testing

### 1.1 Test Project Selector Component
```typescript
// __tests__/ProjectSelector.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectSelector } from '@/components/projects/ProjectSelector';
import { api } from '@/services/api';

// Mock the API
jest.mock('@/services/api', () => ({
  api: {
    listProjects: jest.fn(),
    getActiveProject: jest.fn(),
    activateProject: jest.fn()
  }
}));

// Mock the store
jest.mock('@/lib/store', () => ({
  useGlobalStore: () => ({
    setCurrentProject: jest.fn()
  })
}));

describe('ProjectSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    api.getActiveProject.mockResolvedValue({ active_project: null });
    api.listProjects.mockResolvedValue({ projects: [], count: 0 });
    
    render(<ProjectSelector />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('shows project list when clicked', async () => {
    const mockProjects = [
      { id: 1, name: 'Project 1', statistics: { total_words: 1000 } },
      { id: 2, name: 'Project 2', statistics: { total_words: 2000 } }
    ];
    
    api.getActiveProject.mockResolvedValue({ active_project: null });
    api.listProjects.mockResolvedValue({ projects: mockProjects, count: 2 });
    
    render(<ProjectSelector />);
    
    await waitFor(() => {
      expect(screen.getByText('Select Project')).toBeInTheDocument();
    });
    
    // Click to open dropdown
    fireEvent.click(screen.getByText('Select Project'));
    
    // Check projects appear
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
    expect(screen.getByText('1,000 words')).toBeInTheDocument();
  });

  test('handles project selection', async () => {
    const mockProject = { id: 1, name: 'Test Project', statistics: { total_words: 1000 } };
    api.listProjects.mockResolvedValue({ projects: [mockProject], count: 1 });
    api.getActiveProject.mockResolvedValue({ active_project: null });
    api.activateProject.mockResolvedValue({ message: 'success', project: mockProject });
    
    render(<ProjectSelector />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Select Project'));
    });
    
    fireEvent.click(screen.getByText('Test Project'));
    
    await waitFor(() => {
      expect(api.activateProject).toHaveBeenCalledWith(1);
    });
  });
});
```

Run: `npm test ProjectSelector.test.tsx`

### 1.2 Test Create Project Wizard
```typescript
// __tests__/CreateProjectWizard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateProjectWizard } from '@/components/projects/CreateProjectWizard';
import { useCreateProject } from '@/hooks/useProjects';

jest.mock('@/hooks/useProjects', () => ({
  useCreateProject: jest.fn(),
  useProjectTemplates: () => ({ data: [] })
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() })
}));

describe('CreateProjectWizard', () => {
  const mockMutate = jest.fn();
  
  beforeEach(() => {
    useCreateProject.mockReturnValue({
      mutate: mockMutate,
      isPending: false
    });
  });

  test('renders wizard steps', () => {
    render(<CreateProjectWizard open={true} onOpenChange={() => {}} />);
    
    expect(screen.getByText('Create New Project')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 4: Select your writing style')).toBeInTheDocument();
  });

  test('navigates through steps', async () => {
    render(<CreateProjectWizard open={true} onOpenChange={() => {}} />);
    
    // Step 1: Select mode
    fireEvent.click(screen.getByText('Professional Writer'));
    fireEvent.click(screen.getByText('Next'));
    
    // Step 2: Project details
    await waitFor(() => {
      expect(screen.getByText('Project Details')).toBeInTheDocument();
    });
    
    const titleInput = screen.getByPlaceholderText('My Amazing Novel');
    fireEvent.change(titleInput, { target: { value: 'Test Novel' } });
    fireEvent.click(screen.getByText('Next'));
    
    // Step 3: Story setup
    await waitFor(() => {
      expect(screen.getByText('Story Setup')).toBeInTheDocument();
    });
  });

  test('creates project on completion', async () => {
    render(<CreateProjectWizard open={true} onOpenChange={() => {}} />);
    
    // Fill out all steps
    fireEvent.click(screen.getByText('Professional Writer'));
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      const titleInput = screen.getByPlaceholderText('My Amazing Novel');
      fireEvent.change(titleInput, { target: { value: 'Test Novel' } });
      fireEvent.click(screen.getByText('Next'));
    });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Select a genre'));
      fireEvent.click(screen.getByText('Fiction'));
      fireEvent.click(screen.getByText('Next'));
    });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Create Project'));
    });
    
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Novel',
        genre: 'Fiction',
        writingMode: 'professional-writer'
      }),
      expect.any(Object)
    );
  });
});
```

Run: `npm test CreateProjectWizard.test.tsx`

## Layer 2: API Integration Testing

### 2.1 Test API Client
```typescript
// __tests__/api.test.ts
import { api } from '@/services/api';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Client', () => {
  beforeEach(() => {
    mockedAxios.create.mockReturnThis();
    mockedAxios.get = jest.fn();
    mockedAxios.post = jest.fn();
    mockedAxios.delete = jest.fn();
  });

  test('listProjects calls correct endpoint', async () => {
    const mockResponse = { data: { projects: [], count: 0 } };
    mockedAxios.get.mockResolvedValue(mockResponse);
    
    const result = await api.listProjects();
    
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/projects');
    expect(result).toEqual(mockResponse.data);
  });

  test('createProject sends correct data', async () => {
    const projectData = {
      name: 'Test Project',
      mode_set: 'professional-writer'
    };
    const mockResponse = { data: { id: 1, ...projectData } };
    mockedAxios.post.mockResolvedValue(mockResponse);
    
    const result = await api.createProject(projectData);
    
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/v1/projects', projectData);
    expect(result).toEqual(mockResponse.data);
  });

  test('handles API errors', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));
    
    await expect(api.listProjects()).rejects.toThrow('Network error');
  });
});
```

Run: `npm test api.test.ts`

### 2.2 Test Project API Adapter
```typescript
// __tests__/projectAdapter.test.ts
import { projectAPI } from '@/lib/api/projects';
import { api } from '@/services/api';

jest.mock('@/services/api');

describe('Project API Adapter', () => {
  test('converts backend format to frontend format', async () => {
    const backendProject = {
      id: 1,
      name: 'Backend Project',
      description: 'Test description',
      mode_set: 'ai-first',
      statistics: {
        total_words: 5000,
        total_chapters: 10,
        total_scenes: 40,
        total_cost: 25.50,
        total_savings: 5.00
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      last_accessed: '2024-01-03T00:00:00Z'
    };
    
    api.listProjects.mockResolvedValue({
      projects: [backendProject],
      count: 1
    });
    
    const projects = await projectAPI.getProjects();
    
    expect(projects).toHaveLength(1);
    const project = projects[0];
    
    // Check conversion
    expect(project.id).toBe('1');
    expect(project.title).toBe('Backend Project');
    expect(project.writingMode).toBe('ai-first');
    expect(project.wordCount).toBe(5000);
    expect(project.metadata.totalCost).toBe(25.50);
  });
});
```

Run: `npm test projectAdapter.test.ts`

## Layer 3: State Management Testing

### 3.1 Test Zustand Store
```typescript
// __tests__/store.test.ts
import { renderHook, act } from '@testing-library/react';
import { useGlobalStore } from '@/lib/store';

describe('Global Store', () => {
  test('initializes with null values', () => {
    const { result } = renderHook(() => useGlobalStore());
    
    expect(result.current.currentProject).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.modeSet).toBeNull();
  });

  test('sets current project', () => {
    const { result } = renderHook(() => useGlobalStore());
    
    const mockProject = {
      id: '1',
      name: 'Test Project',
      description: 'Test',
      createdAt: new Date(),
      updatedAt: new Date(),
      owner: 'user1',
      collaborators: []
    };
    
    act(() => {
      result.current.setCurrentProject(mockProject);
    });
    
    expect(result.current.currentProject).toEqual(mockProject);
  });

  test('manages loading states', () => {
    const { result } = renderHook(() => useGlobalStore());
    
    act(() => {
      result.current.setLoading('projects', true);
    });
    
    expect(result.current.loading.projects).toBe(true);
    
    act(() => {
      result.current.setLoading('projects', false);
    });
    
    expect(result.current.loading.projects).toBe(false);
  });

  test('manages notifications', () => {
    const { result } = renderHook(() => useGlobalStore());
    
    act(() => {
      result.current.addNotification('success', 'Project created!');
    });
    
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].type).toBe('success');
    expect(result.current.notifications[0].message).toBe('Project created!');
    
    const notificationId = result.current.notifications[0].id;
    
    act(() => {
      result.current.removeNotification(notificationId);
    });
    
    expect(result.current.notifications).toHaveLength(0);
  });
});
```

Run: `npm test store.test.ts`

### 3.2 Test React Query Hooks
```typescript
// __tests__/useProjects.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjects, useCreateProject } from '@/hooks/useProjects';
import { projectAPI } from '@/lib/api/projects';

jest.mock('@/lib/api/projects');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useProjects hook', () => {
  test('fetches projects', async () => {
    const mockProjects = [
      { id: '1', title: 'Project 1' },
      { id: '2', title: 'Project 2' }
    ];
    
    projectAPI.getProjects.mockResolvedValue(mockProjects);
    
    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper()
    });
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.data).toEqual(mockProjects);
  });

  test('creates project and updates cache', async () => {
    const newProject = { id: '3', title: 'New Project' };
    projectAPI.createProject.mockResolvedValue(newProject);
    projectAPI.getProjects.mockResolvedValue([newProject]);
    
    const { result } = renderHook(() => useCreateProject(), {
      wrapper: createWrapper()
    });
    
    await act(async () => {
      result.current.mutate({ title: 'New Project' });
    });
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

Run: `npm test useProjects.test.ts`

## Layer 4: UI Interaction Testing

### 4.1 Test User Flows
```typescript
// __tests__/userFlows.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectsPage } from '@/app/(dashboard)/projects/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('User Flows', () => {
  test('complete project creation flow', async () => {
    render(<ProjectsPage />);
    
    // 1. Click New Project button
    const newProjectButton = screen.getByText('New Project');
    fireEvent.click(newProjectButton);
    
    // 2. Wizard should open
    await waitFor(() => {
      expect(screen.getByText('Create New Project')).toBeInTheDocument();
    });
    
    // 3. Select writing mode
    fireEvent.click(screen.getByText('AI-First Creation'));
    fireEvent.click(screen.getByText('Next'));
    
    // 4. Enter project details
    await waitFor(() => {
      const titleInput = screen.getByPlaceholderText('My Amazing Novel');
      fireEvent.change(titleInput, { target: { value: 'AI Test Novel' } });
      
      const descInput = screen.getByPlaceholderText('A brief description of your project...');
      fireEvent.change(descInput, { target: { value: 'Testing AI-first flow' } });
      
      fireEvent.click(screen.getByText('Next'));
    });
    
    // 5. Complete setup
    await waitFor(() => {
      fireEvent.click(screen.getByText('Select a genre'));
      fireEvent.click(screen.getByText('Science Fiction'));
      fireEvent.click(screen.getByText('Next'));
    });
    
    // 6. Review and create
    await waitFor(() => {
      expect(screen.getByText('AI Test Novel')).toBeInTheDocument();
      expect(screen.getByText('AI-First Author')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Create Project'));
    });
  });

  test('search and filter projects', async () => {
    render(<ProjectsPage />);
    
    // Search
    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(searchInput, { target: { value: 'fantasy' } });
    
    await waitFor(() => {
      // Only fantasy projects should be visible
      expect(screen.queryByText('Fantasy Novel')).toBeInTheDocument();
      expect(screen.queryByText('Mystery Novel')).not.toBeInTheDocument();
    });
    
    // Filter by mode
    fireEvent.click(screen.getByText('All modes'));
    fireEvent.click(screen.getByText('Professional Writer'));
    
    await waitFor(() => {
      // Additional filtering applied
    });
  });
});
```

Run: `npm test userFlows.test.tsx`

### 4.2 Test Error States
```typescript
// __tests__/errorStates.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectSelector } from '@/components/projects/ProjectSelector';
import { api } from '@/services/api';

jest.mock('@/services/api');

describe('Error States', () => {
  test('shows error when API fails', async () => {
    api.listProjects.mockRejectedValue(new Error('API Error'));
    
    render(<ProjectSelector />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load projects/)).toBeInTheDocument();
    });
  });

  test('handles empty project list', async () => {
    api.listProjects.mockResolvedValue({ projects: [], count: 0 });
    api.getActiveProject.mockResolvedValue({ active_project: null });
    
    render(<ProjectSelector />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Select Project'));
    });
    
    expect(screen.getByText('No projects yet. Create your first project!')).toBeInTheDocument();
  });

  test('retries on error', async () => {
    let callCount = 0;
    api.listProjects.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({ projects: [], count: 0 });
    });
    
    render(<ProjectSelector />);
    
    await waitFor(() => {
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
    });
    
    await waitFor(() => {
      expect(api.listProjects).toHaveBeenCalledTimes(2);
    });
  });
});
```

Run: `npm test errorStates.test.tsx`

## Layer 5: Integration Testing

### 5.1 Test with Mock Backend
```typescript
// __tests__/integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '@/app/page';

// Setup MSW server
const server = setupServer(
  rest.get('/api/v1/projects', (req, res, ctx) => {
    return res(
      ctx.json({
        projects: [
          { id: 1, name: 'MSW Project 1' },
          { id: 2, name: 'MSW Project 2' }
        ],
        count: 2
      })
    );
  }),
  
  rest.post('/api/v1/projects', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        name: req.body.name,
        created_at: new Date().toISOString()
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Integration Tests', () => {
  test('loads and displays projects', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('MSW Project 1')).toBeInTheDocument();
      expect(screen.getByText('MSW Project 2')).toBeInTheDocument();
    });
  });

  test('creates new project', async () => {
    render(<App />);
    
    // Create project through UI
    fireEvent.click(screen.getByText('New Project'));
    
    // ... fill out form ...
    
    await waitFor(() => {
      expect(screen.getByText('Project created successfully')).toBeInTheDocument();
    });
  });
});
```

Run: `npm test integration.test.tsx`

### 5.2 Test Real-time Features
```typescript
// __tests__/realtime.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '@/hooks/useWebSocket';
import WS from 'jest-websocket-mock';

describe('WebSocket Tests', () => {
  let server: WS;
  
  beforeEach(() => {
    server = new WS('ws://localhost:8000/ws');
  });
  
  afterEach(() => {
    WS.clean();
  });
  
  test('connects to WebSocket', async () => {
    const { result } = renderHook(() => useWebSocket());
    
    await server.connected;
    expect(result.current.isConnected).toBe(true);
  });
  
  test('receives project updates', async () => {
    const onProjectUpdate = jest.fn();
    
    renderHook(() => useWebSocket({
      onProjectUpdate
    }));
    
    await server.connected;
    
    act(() => {
      server.send(JSON.stringify({
        type: 'project.updated',
        data: { projectId: 1, name: 'Updated Project' }
      }));
    });
    
    expect(onProjectUpdate).toHaveBeenCalledWith({
      projectId: 1,
      name: 'Updated Project'
    });
  });
});
```

Run: `npm test realtime.test.tsx`

## Layer 6: End-to-End Testing

### 6.1 Playwright Tests
```typescript
// e2e/projects.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });
  
  test('creates and switches projects', async ({ page }) => {
    // Create first project
    await page.click('text=New Project');
    await page.click('text=Professional Writer');
    await page.click('text=Next');
    
    await page.fill('[placeholder="My Amazing Novel"]', 'E2E Test Project 1');
    await page.click('text=Next');
    
    await page.selectOption('select', 'Fiction');
    await page.click('text=Next');
    
    await page.click('text=Create Project');
    
    // Verify project created
    await expect(page).toHaveURL(/\/projects\/\d+/);
    await expect(page.locator('text=E2E Test Project 1')).toBeVisible();
    
    // Create second project
    await page.click('[data-testid="project-selector"]');
    await page.click('text=New Project');
    
    // ... create second project ...
    
    // Switch between projects
    await page.click('[data-testid="project-selector"]');
    await page.click('text=E2E Test Project 1');
    
    await expect(page.locator('[data-testid="active-project"]')).toContainText('E2E Test Project 1');
  });
  
  test('handles errors gracefully', async ({ page }) => {
    // Simulate network error
    await page.route('**/api/v1/projects', route => route.abort());
    
    await page.reload();
    
    await expect(page.locator('text=Failed to load projects')).toBeVisible();
    await expect(page.locator('text=Retry')).toBeVisible();
  });
});
```

Run: `npx playwright test`

### 6.2 Performance Testing
```typescript
// __tests__/performance.test.ts
import { measureRender } from '@/test-utils/performance';

describe('Performance Tests', () => {
  test('ProjectSelector renders quickly', async () => {
    const renderTime = await measureRender(<ProjectSelector />);
    expect(renderTime).toBeLessThan(100); // 100ms
  });
  
  test('handles large project lists', async () => {
    const largeProjectList = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Project ${i}`,
      statistics: { total_words: i * 1000 }
    }));
    
    const renderTime = await measureRender(
      <ProjectList projects={largeProjectList} />
    );
    
    expect(renderTime).toBeLessThan(500); // 500ms for 1000 items
  });
});
```

Run: `npm test performance.test.ts`

## Complete Test Suite

### Run All Tests
```bash
#!/bin/bash
# run_all_frontend_tests.sh

echo "🧪 PlotWeaver Frontend Test Suite"
echo "================================="

cd /home/tmcfar/dev/pw-web/frontend

# Unit tests
echo -e "\n🧩 Component Tests"
npm test -- --testPathPattern="components"

# API tests
echo -e "\n🔌 API Integration Tests"
npm test -- --testPathPattern="api"

# Store tests
echo -e "\n💾 State Management Tests"
npm test -- --testPathPattern="store"

# UI tests
echo -e "\n🖥️ UI Interaction Tests"
npm test -- --testPathPattern="userFlows"

# Integration tests
echo -e "\n🔗 Integration Tests"
npm test -- --testPathPattern="integration"

# E2E tests
echo -e "\n🌐 End-to-End Tests"
npx playwright test

echo -e "\n✅ All tests complete!"
```

## Testing Checklist

### Components
- [ ] ProjectSelector renders correctly
- [ ] CreateProjectWizard completes flow
- [ ] Error boundaries catch errors
- [ ] Loading states display
- [ ] Empty states handled

### API Integration
- [ ] All endpoints called correctly
- [ ] Error responses handled
- [ ] Loading states managed
- [ ] Data transformed properly

### State Management
- [ ] Store initializes correctly
- [ ] Actions update state
- [ ] Selectors return data
- [ ] Side effects work

### User Experience
- [ ] Can create projects
- [ ] Can switch projects
- [ ] Can delete projects
- [ ] Search/filter works
- [ ] Keyboard shortcuts function

### Performance
- [ ] Initial load < 3s
- [ ] Project switch < 500ms
- [ ] Search responsive
- [ ] No memory leaks

## Debugging Tips

1. **Component Issues**
   ```typescript
   // Add to component
   console.log('Props:', props);
   console.log('State:', state);
   ```

2. **API Issues**
   ```typescript
   // Log requests
   apiClient.interceptors.request.use(request => {
     console.log('Starting Request:', request);
     return request;
   });
   ```

3. **State Issues**
   ```typescript
   // Enable Redux DevTools
   const useStore = create(devtools(/* ... */));
   ```

4. **React Query Issues**
   ```typescript
   // Enable query logging
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         onError: (error) => console.error('Query error:', error)
       }
     }
   });
   ```

## Common Issues

1. **"Cannot find module"** - Check import paths and tsconfig
2. **"Act warnings"** - Wrap state updates in act()
3. **"Network error"** - Check API URL and CORS
4. **"Hydration mismatch"** - Check server/client rendering
5. **"Memory leak"** - Clean up effects and listeners
