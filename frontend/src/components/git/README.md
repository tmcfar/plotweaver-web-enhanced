# Git Integration Components

This directory contains a comprehensive suite of React components for git integration in the PlotWeaver frontend, implementing the requirements from the frontend git integration requirements document.

## Components

### Core Components

1. **GitFileTree** - File browser with tree view
   - Hierarchical display of repository files and folders
   - Search functionality with real-time filtering
   - Breadcrumb navigation
   - Keyboard navigation support
   - ARIA accessibility features

2. **GitFileViewer** - File content viewer with git context
   - Syntax highlighting for different file types
   - Git metadata display (last commit, author, date)
   - File statistics (lines, size)
   - History panel integration
   - Responsive design

3. **GitHistory** - Commit history with timeline
   - Paginated commit listing
   - Commit details with author and message
   - Relative time display
   - Commit selection and filtering
   - Accessible navigation

4. **GitDiffViewer** - File differences visualization
   - Side-by-side diff display
   - Syntax highlighting for diffs
   - Context toggle for unchanged lines
   - File statistics (insertions, deletions)
   - Expandable diff sections

5. **GitStatus** - Repository status display
   - Current branch indicator
   - Modified, staged, and untracked files
   - Sync status with remote
   - Visual status indicators
   - Quick actions support

6. **GitBranches** - Branch management
   - Local and remote branch listing
   - Current branch highlighting
   - Branch switching functionality
   - Branch creation dialog
   - Merge operations support

### Supporting Components

7. **GitErrorBoundary** - Error handling
   - Graceful error recovery
   - User-friendly error messages
   - Retry mechanisms
   - Fallback UI components

## Features

### API Integration
- **GitApiClient** - Comprehensive API client with caching
- **React Hooks** - useGitApi, useFileContent, useProjectTree, useFileHistory
- **Real-time Updates** - WebSocket integration for live git updates
- **Caching Strategy** - Intelligent caching with TTL and invalidation

### Performance
- **Lazy Loading** - Components loaded on demand
- **Virtual Scrolling** - Efficient rendering for large file lists
- **Caching** - API response caching with automatic invalidation
- **Debounced Search** - Optimized search experience

### Accessibility
- **ARIA Support** - Comprehensive ARIA labels and roles
- **Keyboard Navigation** - Full keyboard support for all interactions
- **Screen Reader** - Optimized for screen reader users
- **Focus Management** - Proper focus handling and indicators

### Error Handling
- **Graceful Degradation** - Fallback UI for error states
- **User Feedback** - Clear error messages and retry options
- **Boundary Components** - Error boundaries for component isolation
- **Network Resilience** - Handling of network failures and timeouts

## Usage

### Basic File Browser
```typescript
import { GitFileTree } from '@/components/git';

function ProjectExplorer({ projectId }: { projectId: string }) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  return (
    <GitFileTree
      projectId={projectId}
      onFileSelect={setSelectedFile}
      selectedPath={selectedFile}
    />
  );
}
```

### File Viewer with History
```typescript
import { GitFileViewer } from '@/components/git';

function FileEditor({ projectId, filePath }: { projectId: string; filePath: string }) {
  return (
    <GitFileViewer
      projectId={projectId}
      filePath={filePath}
      showHistory={true}
      readOnly={false}
    />
  );
}
```

### Repository Status
```typescript
import { GitStatus } from '@/components/git';

function RepositoryOverview({ projectId }: { projectId: string }) {
  return (
    <GitStatus projectId={projectId} />
  );
}
```

### Error Boundary Wrapper
```typescript
import { GitErrorBoundary } from '@/components/git';

function GitApp({ children }: { children: React.ReactNode }) {
  return (
    <GitErrorBoundary>
      {children}
    </GitErrorBoundary>
  );
}
```

## Architecture

### Data Flow
1. **API Client** - Handles HTTP requests with caching
2. **React Query** - Manages server state and synchronization
3. **WebSocket** - Real-time updates and cache invalidation
4. **Local State** - Component-specific UI state

### Caching Strategy
- **File Content**: 3 minutes TTL
- **Directory Tree**: 5 minutes TTL
- **File History**: 10 minutes TTL
- **Repository Status**: 30 seconds TTL
- **Branches**: 2 minutes TTL
- **Diffs**: 5 minutes TTL

### WebSocket Events
- `git_update` - General repository updates
- `file_changed` - Specific file modifications
- `branch_changed` - Branch operations
- `status_changed` - Repository status updates

## Type Safety

All components are fully typed with TypeScript, including:
- API response types
- Component prop types
- Hook return types
- Event handler types
- Cache key types

## Testing

Unit tests are provided for:
- API client functionality
- Hook behavior
- Component rendering
- Error handling
- Accessibility features

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

- React 18+
- TypeScript 5+
- Tailwind CSS 3+
- Lucide React (icons)
- React Query (server state)
- WebSocket API (real-time updates)

## Performance Considerations

- Components use React.memo for re-render optimization
- Large lists implement virtual scrolling
- API responses are cached with intelligent invalidation
- WebSocket connections use connection pooling
- Images and assets are lazy-loaded

## Security

- All API requests include authentication headers
- User input is sanitized and validated
- WebSocket connections use secure protocols
- Sensitive data is not logged or cached
- Error messages don't expose system internals