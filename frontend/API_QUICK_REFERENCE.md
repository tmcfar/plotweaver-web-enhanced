# PlotWeaver API Quick Reference Card

## API Service Usage

### Import the API
```typescript
import api from '@/services/api';
```

### Common Patterns

#### Projects
```typescript
// List all projects
const { projects } = await api.listProjects();

// Create project
const project = await api.createProject({
  name: "My Novel",
  description: "A thrilling mystery"
});

// Activate project
await api.activateProject(projectId);
```

#### Worldbuilding
```typescript
// Analyze concept
const analysis = await api.worldbuilding.analyzeConceptapi({
  concept_text: "Your story idea",
  project_path: projectPath
});

// Get setup progress
const progress = await api.worldbuilding.getSetupProgress(projectPath);

// Complete setup step
await api.worldbuilding.completeSetupStep(stepId, {
  step_data: formData,
  project_path: projectPath
});
```

#### Scene Generation
```typescript
// Generate scene
const scene = await api.generateScene(chapter, scene, {
  project_id: projectId,
  characters: {},
  plot_outline: {}
});

// Check status
const status = await api.getGenerationStatus(taskId);
```

#### Authentication
```typescript
// Login
const { user, tokens } = await api.auth.login({
  email: "user@example.com",
  password: "password"
});

// Get current user
const user = await api.auth.getUser();

// Logout
await api.auth.logout();
```

#### Git Integration (BFF)
```typescript
// Get file content
const file = await api.bff.git.getFileContent(projectId, "path/to/file.md");

// Get directory listing
const dir = await api.bff.git.getDirectoryListing(projectId, "chapters");

// Get repository status
const status = await api.bff.git.getRepositoryStatus(projectId);
```

#### Enhanced Locks (BFF)
```typescript
// Get project locks
const { locks } = await api.bff.locks.getProjectLocks(projectId);

// Update component lock
await api.bff.locks.updateComponentLock(projectId, componentId, {
  level: 'soft',
  reason: 'Editing scene',
  // ... other lock properties
});
```

## Environment Variables

Add to `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000      # Backend
NEXT_PUBLIC_BFF_URL=http://localhost:8000      # BFF
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws     # WebSocket
```

## API Architecture

```
Frontend (React)
    ↓
API Service Layer
    ├── apiClient → Backend (5000)
    │   ├── Projects
    │   ├── Generation
    │   ├── Auth
    │   └── Context
    │
    └── bffClient → BFF (8000)
        ├── Worldbuilding
        ├── Git Integration
        ├── Enhanced Locks
        └── Preview
```

## Error Handling

```typescript
try {
  const result = await api.someMethod();
  // Handle success
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error('API Error:', error.response?.data);
    // Show user-friendly error
  }
}
```

## TypeScript Types

All methods are fully typed. Import types:
```typescript
import type {
  Project,
  User,
  ConceptAnalysisResponse,
  GitFile,
  ComponentLock
} from '@/types';
```

## Testing

```bash
# Run API integration tests
./test_api_integration_complete.sh

# Check TypeScript
cd frontend && npx tsc --noEmit
```
