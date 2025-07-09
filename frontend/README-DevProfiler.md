# React DevTools Profiler Integration

This document outlines the React DevTools Profiler integration for PlotWeaver's development workflow.

## Features

### 🔍 Automatic Performance Monitoring
- Tracks render performance for all profiled components
- Identifies slow renders (>16ms) automatically
- Stores performance data in localStorage for analysis

### 📊 Performance Panel
- Real-time performance dashboard
- Component-level performance metrics
- Historical performance data
- Export functionality for detailed analysis

### 🛠️ Developer Tools
- Global `PlotWeaverDevTools` object for console access
- Keyboard shortcuts for quick access
- Automatic performance issue detection

## Usage

### 1. Enable Profiler Mode

```bash
# Run development server with profiler enabled
npm run dev:profile

# Or set environment variable
NEXT_PUBLIC_ENABLE_PROFILER=true npm run dev
```

### 2. Wrap Components with DevProfiler

```tsx
import { DevProfiler } from '@/components/DevProfiler';

function MyComponent() {
  return (
    <DevProfiler id="MyComponent">
      <div>Your component content</div>
    </DevProfiler>
  );
}
```

### 3. Access Performance Data

#### Via Performance Panel
- Press `Ctrl+Shift+P` to open the performance panel
- View real-time performance metrics
- See slow renders highlighted in red
- Clear data or export for analysis

#### Via Console
```javascript
// Available DevTools commands
PlotWeaverDevTools.logPerformanceSummary();
PlotWeaverDevTools.exportPerformanceData();
PlotWeaverDevTools.clearPerformanceData();
PlotWeaverDevTools.togglePerformancePanel();
```

### 4. Analyze Performance Data

```bash
# Export performance data first, then analyze
npm run analyze:performance performance-data.json
```

## Integration with Layout

Add the DevToolsProvider to your root layout:

```tsx
import { DevToolsProvider } from '@/components/DevToolsProvider';
import { DevProfiler } from '@/components/DevProfiler';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <DevToolsProvider>
          <DevProfiler id="App">
            {children}
          </DevProfiler>
        </DevToolsProvider>
      </body>
    </html>
  );
}
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:profile` | Development server with profiler enabled |
| `npm run analyze:performance <file>` | Analyze exported performance data |
| `npm run analyze:bundle` | Analyze bundle size |
| `npm run profile:build` | Build with bundle analysis |

## Keyboard Shortcuts

- `Ctrl+Shift+P` - Toggle Performance Panel
- `Ctrl+Shift+R` - Enable/Disable Profiler

## Health Assessment Integration

The daily health check automatically:
- Checks for performance data availability
- Counts performance issues
- Reports slow render statistics
- Integrates with overall project health metrics

## Performance Metrics

### Tracked Metrics
- **Render Duration**: Time taken to render component
- **Phase**: Mount vs Update renders
- **Base Duration**: Expected render time
- **Slow Renders**: Renders taking >16ms (one frame)
- **Component Frequency**: How often components re-render

### Performance Thresholds
- **Good**: <8ms average render time
- **Warning**: 8-16ms average render time
- **Critical**: >16ms render time (drops frames)

## Best Practices

### 1. Strategic Profiling
```tsx
// Profile critical components
<DevProfiler id="ProjectList">
  <ProjectList />
</DevProfiler>

// Profile complex interactions
<DevProfiler id="Editor">
  <CodeEditor />
</DevProfiler>
```

### 2. Regular Analysis
- Export performance data weekly
- Review slow render patterns
- Monitor performance regressions
- Track improvements over time

### 3. Performance Optimization
- Use React.memo for frequently re-rendering components
- Implement useMemo for expensive calculations
- Use useCallback for event handlers
- Consider code splitting for large components

## Troubleshooting

### No Performance Data
- Ensure components are wrapped with DevProfiler
- Check that profiler is enabled in environment
- Verify localStorage is accessible

### Performance Panel Not Opening
- Check keyboard shortcuts are working
- Ensure development mode is enabled
- Try console command: `PlotWeaverDevTools.togglePerformancePanel()`

### Analysis Script Errors
- Ensure Node.js is installed
- Check file path is correct
- Verify JSON format is valid

## Example Analysis Output

```
📊 Performance Analysis Report
==============================
Data points: 143
Time range: 2025-01-09 10:30:00 - 2025-01-09 10:45:00

🔍 Overall Statistics
Total renders: 143
Slow renders (>16ms): 12 (8.4%)
Average duration: 7.32ms
Slowest render: 23.45ms
Fastest render: 1.23ms

🧩 Component Analysis
Component                     Renders   Slow    Avg (ms)   Max (ms)   Mounts  Updates
------------------------------------------------------------------------------------------
ProjectList                   45        8 (17.8%)   12.34     23.45     1       44
CodeEditor                    32        3 (9.4%)    8.67      18.23     1       31
Sidebar                       24        1 (4.2%)    6.45      16.12     1       23

⚠️ Performance Issues
- ProjectList: 8 slow renders (17.8% of total)
- CodeEditor: 3 slow renders (9.4% of total)

💡 Recommendations
- Consider optimizing ProjectList component
- Use React.memo() for components that re-render frequently
- Implement useMemo() for expensive computations
```

This profiler integration provides comprehensive performance monitoring while maintaining zero impact on production builds.