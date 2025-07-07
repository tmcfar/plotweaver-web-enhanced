# Frontend Multi-Manuscript Integration

## Overview

The PlotWeaver frontend has been updated to support multiple manuscript projects with the following features:

- **Project Selector**: Dropdown in the header to switch between projects
- **Project Management**: List, create, delete, and activate projects
- **API Integration**: Connected to backend `/api/v1/projects` endpoints
- **Session Persistence**: Active project persists across page loads

## Changes Made

### 1. API Service Updates

**File**: `frontend/src/services/api.ts`
- Added project management endpoints:
  - `listProjects()` - Get all user projects
  - `createProject()` - Create new project
  - `getProject()` - Get project details
  - `activateProject()` - Set active project
  - `deleteProject()` - Remove project
  - `getActiveProject()` - Get current active project

### 2. Project Selector Component

**File**: `frontend/src/components/projects/ProjectSelector.tsx`
- New dropdown component for the header
- Shows active project name
- Lists all projects with word counts
- Quick "New Project" button
- Activates project on selection

### 3. Layout Integration

**File**: `frontend/app/(dashboard)/layout.tsx`
- Added ProjectSelector to dashboard header
- Positioned between logo and user menu

### 4. API Adapter

**File**: `frontend/src/lib/api/projects.ts`
- Adapter to convert backend API format to frontend types
- Maps backend project structure to frontend Project interface
- Provides compatibility layer for existing components

### 5. New Project Page

**File**: `frontend/app/(dashboard)/projects/new/page.tsx`
- Dedicated route for creating new projects
- Uses existing CreateProjectWizard component

## UI Flow

1. **Project Selection**:
   - Click project dropdown in header
   - See list of all projects
   - Click to switch active project
   - Page refreshes with new context

2. **Create Project**:
   - Click "New Project" in dropdown
   - Or navigate to `/projects/new`
   - Fill out wizard steps:
     - Choose writing mode
     - Enter project details
     - Select genre
     - Review and create

3. **Project Management**:
   - Navigate to `/projects` to see all projects
   - View project cards with statistics
   - Edit or delete projects

## Testing Instructions

### Prerequisites
1. Backend running on port 5000
2. Database initialized with test user

### Start the Application

```bash
# Terminal 1: Backend
cd /home/tmcfar/dev/pw2
source venv/bin/activate
python -m plotweaver.ui.app

# Terminal 2: Frontend
cd /home/tmcfar/dev/pw-web/frontend
npm install
npm run dev
```

### Test Scenarios

1. **Create First Project**:
   - Open http://localhost:3000
   - Sign in (if using Clerk auth)
   - Click project selector → "New Project"
   - Complete the wizard
   - Verify project appears in selector

2. **Switch Projects**:
   - Create multiple projects
   - Use dropdown to switch between them
   - Verify active project persists on refresh

3. **Project List**:
   - Navigate to `/projects`
   - See all projects in grid view
   - Use filters and sorting
   - Create new project from list page

## API Endpoints Used

- `GET /api/v1/projects` - List all projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project details
- `POST /api/v1/projects/:id/activate` - Set active
- `DELETE /api/v1/projects/:id` - Delete project
- `GET /api/v1/projects/active` - Get active project

## Session Management

The active project is stored in:
- Backend: Flask session (`session['active_project_id']`)
- Frontend: Zustand store (`currentProject`)

Sessions are synchronized when:
- User selects a project
- Page loads/refreshes
- New project is created

## Future Enhancements

1. **Real-time Updates**: Use WebSocket for live project updates
2. **Project Search**: Add search functionality to selector
3. **Recent Projects**: Show recently accessed projects first
4. **Project Templates**: Pre-configured project setups
5. **GitHub Integration**: Create/link GitHub repos from UI
6. **Collaboration**: Share projects with other users
