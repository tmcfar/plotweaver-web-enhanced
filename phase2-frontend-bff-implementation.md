# Frontend/BFF Phase 2 Implementation Instructions

## Context
You are a senior full-stack developer working on PlotWeaver's web interface. Most UI components are built but need to be connected to real backend data. The priority is implementing mode-set behaviors, connecting components to live data, and adding missing analytics features.

## Current State
- Frontend: Next.js 15 with extensive component library
- BFF: FastAPI with WebSocket support
- Git operations: ✅ Complete
- Components exist but need data connections
- Mode-sets exist but don't change behavior

## Priority 1: BFF Git-Native Worldbuilding Integration

The worldbuilding components need to read data from git, not just proxy to backend:

```python
# Add to bff/server/git_endpoints.py

@router.get("/api/projects/{project_id}/worldbuilding/data")
async def get_worldbuilding_from_git(project_id: str):
    """Read worldbuilding data from git repository."""
    try:
        # Get worldbuilding directory contents
        tree = await git_manager.get_tree(project_id, ".plotweaver/worldbuilding")
        
        worldbuilding_data = {
            "concept_analysis": None,
            "assumptions": None,
            "setup_progress": None,
            "characters": [],
            "settings": [],
            "plot": None
        }
        
        # Read each JSON file
        for item in tree:
            if item['type'] == 'file' and item['name'].endswith('.json'):
                file_path = f".plotweaver/worldbuilding/{item['name']}"
                content = await git_manager.get_file_content(project_id, file_path)
                data = json.loads(content['content'])
                
                # Organize by type
                if item['name'] == 'concept_analysis.json':
                    worldbuilding_data['concept_analysis'] = data
                elif item['name'] == 'assumptions.json':
                    worldbuilding_data['assumptions'] = data
                elif item['name'] == 'setup_progress.json':
                    worldbuilding_data['setup_progress'] = data
        
        # Also read character/setting files
        char_tree = await git_manager.get_tree(project_id, "characters")
        for char in char_tree:
            if char['type'] == 'file' and char['name'].endswith('.json'):
                char_content = await git_manager.get_file_content(project_id, f"characters/{char['name']}")
                worldbuilding_data['characters'].append(json.loads(char_content['content']))
        
        return worldbuilding_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read worldbuilding data: {str(e)}")

# Update the worldbuilding progress endpoint to read from git
@router.get("/api/worldbuilding/progress/{project_id}")
async def get_setup_progress_from_git(project_id: str):
    """Get setup progress from git repo instead of backend."""
    try:
        progress_file = await git_manager.get_file_content(
            project_id, 
            ".plotweaver/worldbuilding/setup_progress.json"
        )
        return json.loads(progress_file['content'])
    except FileNotFoundError:
        return {
            "has_worldbuilding": False,
            "message": "No worldbuilding setup found"
        }
```

## Priority 2: Agent Activity WebSocket Integration

Connect the existing agent components to real-time data:

```python
# Add to bff/server/main.py

# Agent activity storage
agent_activities: Dict[str, List[Dict[str, Any]]] = {}

@app.post("/api/webhook/agent-activity")
async def receive_agent_activity(request: Request):
    """Receive agent activity updates from backend."""
    data = await request.json()
    project_id = data.get('project_id')
    
    # Store activity
    if project_id not in agent_activities:
        agent_activities[project_id] = []
    
    agent_activities[project_id].append(data)
    
    # Broadcast to connected clients
    await manager.broadcast_to_project({
        "channel": f"agent-activity:{project_id}",
        "data": data
    }, project_id)
    
    return {"status": "received"}

@app.get("/api/projects/{project_id}/agents/activity")
async def get_agent_activity(project_id: str):
    """Get current agent activities."""
    # First try to get from backend
    try:
        response = await client.get(f"/api/v1/projects/{project_id}/agents/activity")
        if response.status_code == 200:
            return response.json()
    except:
        pass
    
    # Fall back to cached data
    return {
        "active_agents": agent_activities.get(project_id, []),
        "timestamp": datetime.now(UTC).isoformat()
    }
```

### Frontend Hook Updates

```typescript
// Update frontend/src/hooks/useAgentProgress.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import { useEffect } from 'react';

export function useAgentProgress(projectId: string) {
  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket(projectId);
  
  // Subscribe to agent activity updates
  useEffect(() => {
    if (lastMessage?.channel === `agent-activity:${projectId}`) {
      // Update the query cache with new data
      queryClient.setQueryData(
        ['agent-activity', projectId],
        (old: any) => {
          const newActivity = lastMessage.data;
          const existing = old?.active_agents || [];
          
          // Update or add the activity
          const index = existing.findIndex((a: any) => a.agent_id === newActivity.agent_id);
          if (index >= 0) {
            existing[index] = newActivity;
          } else {
            existing.push(newActivity);
          }
          
          return { ...old, active_agents: existing };
        }
      );
    }
  }, [lastMessage, projectId, queryClient]);
  
  // Fetch initial data
  const { data, isLoading } = useQuery({
    queryKey: ['agent-activity', projectId],
    queryFn: () => bffApi.getAgentActivity(projectId),
    refetchInterval: 30000, // Refresh every 30s as backup
  });
  
  return {
    activities: data?.active_agents || [],
    isLoading,
  };
}
```

## Priority 3: Mode-Set Behavior Implementation

Make mode-sets actually change the UI:

```typescript
// Create frontend/src/lib/mode-set-configs.ts

import { ModeSetId } from '@/types';

interface ModeSetConfig {
  layout: {
    panels: string[];
    defaultSplitSizes: number[];
    hiddenPanels?: string[];
  };
  features: {
    showGitOperations: boolean;
    showCostTracking: boolean;
    showAdvancedSettings: boolean;
    showAgentDetails: boolean;
    autoSuggestions: boolean;
  };
  defaults: {
    editorMode: 'simple' | 'advanced';
    autoSave: boolean;
    showTooltips: boolean;
    keyboardShortcuts: 'full' | 'basic';
  };
  theme: {
    complexity: 'minimal' | 'balanced' | 'full';
    animations: boolean;
  };
}

export const modeSetConfigs: Record<ModeSetId, ModeSetConfig> = {
  'professional-writer': {
    layout: {
      panels: ['project-tree', 'editor', 'tools'],
      defaultSplitSizes: [20, 60, 20],
    },
    features: {
      showGitOperations: true,
      showCostTracking: true,
      showAdvancedSettings: true,
      showAgentDetails: true,
      autoSuggestions: false,
    },
    defaults: {
      editorMode: 'advanced',
      autoSave: true,
      showTooltips: false,
      keyboardShortcuts: 'full',
    },
    theme: {
      complexity: 'full',
      animations: true,
    },
  },
  'ai-first': {
    layout: {
      panels: ['editor', 'ai-assistant'],
      defaultSplitSizes: [70, 30],
      hiddenPanels: ['project-tree'],
    },
    features: {
      showGitOperations: false,
      showCostTracking: false,
      showAdvancedSettings: false,
      showAgentDetails: false,
      autoSuggestions: true,
    },
    defaults: {
      editorMode: 'simple',
      autoSave: true,
      showTooltips: true,
      keyboardShortcuts: 'basic',
    },
    theme: {
      complexity: 'minimal',
      animations: true,
    },
  },
  'editor': {
    layout: {
      panels: ['project-tree', 'editor', 'review-tools'],
      defaultSplitSizes: [15, 65, 20],
    },
    features: {
      showGitOperations: false,
      showCostTracking: false,
      showAdvancedSettings: false,
      showAgentDetails: false,
      autoSuggestions: false,
    },
    defaults: {
      editorMode: 'advanced',
      autoSave: false,
      showTooltips: true,
      keyboardShortcuts: 'full',
    },
    theme: {
      complexity: 'balanced',
      animations: false,
    },
  },
  'hobbyist': {
    layout: {
      panels: ['editor', 'fun-tools'],
      defaultSplitSizes: [75, 25],
      hiddenPanels: ['project-tree', 'git-panel'],
    },
    features: {
      showGitOperations: false,
      showCostTracking: false,
      showAdvancedSettings: false,
      showAgentDetails: false,
      autoSuggestions: true,
    },
    defaults: {
      editorMode: 'simple',
      autoSave: true,
      showTooltips: true,
      keyboardShortcuts: 'basic',
    },
    theme: {
      complexity: 'minimal',
      animations: true,
    },
  },
};

// Hook to use mode-set config
export function useModeSetConfig() {
  const modeSet = useStore((state) => state.currentModeSet);
  return modeSetConfigs[modeSet];
}
```

### Apply Mode-Set Behaviors to Layout

```typescript
// Update frontend/src/components/layout/MainLayout.tsx

import { useModeSetConfig } from '@/lib/mode-set-configs';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const config = useModeSetConfig();
  const { layout, features } = config;
  
  return (
    <div className="h-screen flex flex-col">
      <Header showAdvanced={features.showAdvancedSettings} />
      
      <PanelGroup direction="horizontal" className="flex-1">
        {layout.panels.includes('project-tree') && (
          <>
            <Panel defaultSize={layout.defaultSplitSizes[0]} minSize={15}>
              <ProjectTree 
                showGitOps={features.showGitOperations}
                simplified={!features.showAdvancedSettings}
              />
            </Panel>
            <PanelResizeHandle />
          </>
        )}
        
        <Panel defaultSize={layout.defaultSplitSizes[1]}>
          <Editor mode={config.defaults.editorMode} />
        </Panel>
        
        {layout.panels.includes('tools') && (
          <>
            <PanelResizeHandle />
            <Panel defaultSize={layout.defaultSplitSizes[2]} minSize={20}>
              <ToolsPanel 
                showCosts={features.showCostTracking}
                showAgents={features.showAgentDetails}
              />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}
```

## Priority 4: Cost Tracking Integration

Connect the CostEstimator to real data:

```typescript
// Create frontend/src/services/costApi.ts

export const costApi = {
  getCurrentCost: async (projectId: string) => {
    const response = await bffClient.get(`/api/projects/${projectId}/cost/current`);
    return response.data;
  },
  
  getCostBreakdown: async (projectId: string, groupBy: string = 'agent') => {
    const response = await bffClient.get(`/api/projects/${projectId}/cost/breakdown`, {
      params: { group_by: groupBy }
    });
    return response.data;
  },
  
  getCostHistory: async (projectId: string, days: number = 30) => {
    const response = await bffClient.get(`/api/projects/${projectId}/cost/history`, {
      params: { days }
    });
    return response.data;
  },
  
  setBudget: async (projectId: string, budget: BudgetConfig) => {
    const response = await bffClient.post(`/api/projects/${projectId}/cost/budget`, budget);
    return response.data;
  },
};

// Update the cost tracking hook
export function useCostTracking(projectId: string) {
  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket(projectId);
  
  // Listen for cost updates
  useEffect(() => {
    if (lastMessage?.channel === `cost-update:${projectId}`) {
      queryClient.invalidateQueries(['cost', projectId]);
    }
  }, [lastMessage, projectId, queryClient]);
  
  const currentCost = useQuery({
    queryKey: ['cost', projectId, 'current'],
    queryFn: () => costApi.getCurrentCost(projectId),
    refetchInterval: 60000, // Refresh every minute
  });
  
  const costHistory = useQuery({
    queryKey: ['cost', projectId, 'history'],
    queryFn: () => costApi.getCostHistory(projectId),
    staleTime: 300000, // 5 minutes
  });
  
  return {
    currentCost: currentCost.data,
    history: costHistory.data,
    isLoading: currentCost.isLoading || costHistory.isLoading,
  };
}
```

## Priority 5: Quality Analytics Dashboard

Create the missing quality analytics components:

```typescript
// Create frontend/src/components/analytics/QualityDashboard.tsx

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface QualityDashboardProps {
  projectId: string;
}

export function QualityDashboard({ projectId }: QualityDashboardProps) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['quality', projectId],
    queryFn: () => qualityApi.getMetrics(projectId),
    refetchInterval: 300000, // 5 minutes
  });
  
  if (isLoading) return <LoadingSpinner />;
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };
  
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Quality Score</span>
            <span className={`text-3xl font-bold ${getScoreColor(metrics.overall_score)}`}>
              {metrics.overall_score}/100
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={metrics.overall_score} className="h-3" />
          <div className="mt-4 grid grid-cols-3 gap-4">
            <MetricCard
              title="Characters"
              score={metrics.metrics.character_consistency.score}
              issues={metrics.metrics.character_consistency.issues}
            />
            <MetricCard
              title="Plot"
              score={metrics.metrics.plot_continuity.score}
              issues={metrics.metrics.plot_continuity.contradictions}
            />
            <MetricCard
              title="Style"
              score={metrics.metrics.style_consistency.score}
              issues={0}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Character Details */}
      <Card>
        <CardHeader>
          <CardTitle>Character Consistency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics.metrics.character_consistency.details).map(([name, details]) => (
              <div key={name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{name}</h4>
                  {getScoreIcon(details.voice_consistency)}
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Voice:</span>
                    <span className={`ml-2 font-medium ${getScoreColor(details.voice_consistency)}`}>
                      {details.voice_consistency}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className={`ml-2 font-medium ${getScoreColor(details.name_consistency)}`}>
                      {details.name_consistency}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Traits:</span>
                    <span className={`ml-2 font-medium ${getScoreColor(details.trait_consistency)}`}>
                      {details.trait_consistency}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Recommendations */}
      {metrics.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {metrics.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                    {rec.priority}
                  </Badge>
                  <span className="text-sm">{rec.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ title, score, issues }: { title: string; score: number; issues: number }) {
  return (
    <div className="text-center">
      <h5 className="text-sm font-medium text-muted-foreground">{title}</h5>
      <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}%</div>
      {issues > 0 && (
        <div className="text-xs text-muted-foreground">{issues} issues</div>
      )}
    </div>
  );
}
```

## Implementation Checklist

### BFF Tasks
- [ ] Implement git-native worldbuilding reads
- [ ] Add agent activity webhook receiver
- [ ] Create cost tracking proxy endpoints
- [ ] Add quality metrics caching

### Frontend Tasks
- [ ] Connect agent components to real data
- [ ] Implement mode-set behavior system
- [ ] Update layout to respect mode configs
- [ ] Create quality analytics dashboard
- [ ] Add ROI calculator component
- [ ] Connect cost estimator to live data

### Integration Tasks
- [ ] Test WebSocket agent updates
- [ ] Verify mode-set transitions
- [ ] Validate cost accuracy
- [ ] Test quality metrics performance

## Testing Strategy

```typescript
// Test mode-set behaviors
describe('ModeSetBehavior', () => {
  it('should hide git operations in AI-first mode', () => {
    setModeSet('ai-first');
    render(<ProjectTree />);
    expect(screen.queryByText('Git Operations')).not.toBeInTheDocument();
  });
  
  it('should show cost tracking in professional mode', () => {
    setModeSet('professional-writer');
    render(<ToolsPanel />);
    expect(screen.getByText('Cost Tracking')).toBeInTheDocument();
  });
});

// Test real-time updates
describe('AgentActivityUpdates', () => {
  it('should update agent progress via WebSocket', async () => {
    const { result } = renderHook(() => useAgentProgress('project-1'));
    
    // Simulate WebSocket message
    act(() => {
      mockWebSocket.send({
        channel: 'agent-activity:project-1',
        data: {
          agent_id: 'agent-1',
          progress: 0.5,
          status: 'running'
        }
      });
    });
    
    await waitFor(() => {
      expect(result.current.activities[0].progress).toBe(0.5);
    });
  });
});
```

## Success Criteria

1. [ ] Mode-sets visibly change UI layout and features
2. [ ] Agent activities update in real-time (<100ms)
3. [ ] Cost tracking shows live data with <1min delay
4. [ ] Quality metrics dashboard loads in <2 seconds
5. [ ] Git-native worldbuilding data displays correctly

Remember: Focus on connecting existing components to real data first, then add missing features. The goal is a professional writing environment that adapts to user needs.
