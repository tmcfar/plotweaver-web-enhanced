export interface SSEOptions {
  onOpen?: () => void;
  onMessage?: (data: unknown) => void;
  onError?: (error: Event) => void;
  onMaxReconnectAttemptsReached?: () => void;
  maxReconnectAttempts?: number;
}

export interface AgentProgress {
  jobId: string;
  agentName: string;
  percentage: number;
  currentStep: string;
  subSteps?: {
    label: string;
    completed: boolean;
  }[];
  estimatedTimeRemaining?: number;
  status: 'running' | 'completed' | 'error';
}

export interface AgentProgressItemProps {
  job: {
    id: string;
    agentName: string;
  };
  progress: AgentProgress | undefined;
}