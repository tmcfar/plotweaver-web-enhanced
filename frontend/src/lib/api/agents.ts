import { AgentProgress } from '../store/agentProgressStore';
import { LockConflict, Resolution, lockService } from './locks';
import { LOCK_CONFLICT_DIALOG_CONFIG } from '../constants/dialogConfig';

export interface AgentResult {
  cancelled?: boolean;
  result?: unknown;
  error?: string;
}

export class AgentClient {
  async executeAgent(agentName: string, payload: Record<string, unknown>): Promise<AgentResult> {
    // Check lock conflicts first
    const conflicts = await this.checkLockConflicts(agentName, payload);

    if (conflicts.length > 0) {
      const resolution = await this.resolveLockConflicts(conflicts);
      if (resolution.cancelled) return { cancelled: true };
      payload = resolution.modifiedPayload || payload;
    }

    // Start agent with SSE progress
    const { jobId } = await this.startAgent(agentName, payload);
    return this.trackProgress(jobId);
  }

  private async startAgent(agentName: string, payload: Record<string, unknown>): Promise<{ jobId: string }> {
    const response = await fetch(`/api/agents/${agentName}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to start agent: ${response.statusText}`);
    }

    return response.json();
  }

  private async trackProgress(jobId: string): Promise<AgentResult> {
    return new Promise((resolve, reject) => {
      let isDone = false;
      const eventSource = new EventSource(`/api/agents/progress/${jobId}`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data) as AgentProgress;

        // Update UI progress
        // agentProgressStore.updateProgress(jobId, data);

        if (data.status === 'completed' && !isDone) {
          isDone = true;
          eventSource.close();
          resolve({ result: data.result });
        } else if (data.status === 'error' && !isDone) {
          isDone = true;
          eventSource.close();
          reject(new Error(data.error));
        }
      };

      eventSource.onerror = () => {
        if (!isDone) {
          isDone = true;
          eventSource.close();
          reject(new Error('SSE connection error'));
        }
      };
    });
  }

  private async checkLockConflicts(agentName: string, payload: Record<string, unknown>): Promise<LockConflict[]> {
    const affectedComponents = this.extractAffectedComponents(agentName, payload);
    return lockService.checkLockConflicts(`agent:${agentName}`, affectedComponents);
  }

  private extractAffectedComponents(_agentName: string, payload: Record<string, unknown>): string[] {
    // This is a placeholder implementation
    // In a real app, we would analyze the agent type and payload
    // to determine which components might be affected
    const components: string[] = [];

    if (payload.fileId && typeof payload.fileId === 'string') {
      components.push(payload.fileId);
    }

    if (payload.files && Array.isArray(payload.files)) {
      components.push(...payload.files.filter((file): file is string => typeof file === 'string'));
    }

    return components;
  }

  private async resolveLockConflicts(conflicts: LockConflict[]): Promise<Resolution> {
    return new Promise((resolve) => {
      LOCK_CONFLICT_DIALOG_CONFIG.showDialog({
        conflicts,
        onResolve: (resolution: Resolution) => resolve(resolution),
        onCancel: () => resolve({ cancelled: true })
      });
    });
  }
}

// Export singleton instance
export const agentClient = new AgentClient();

// Export agentAPI for compatibility with pre-generation system
export const agentAPI = {
  generateScene: async (spec: Record<string, unknown>) => {
    const response = await fetch('/api/agents/scene-generator/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spec)
    });

    if (!response.ok) {
      throw new Error('Failed to generate scene');
    }

    return response.json();
  }
};
