export interface ContinuityIssue {
  id: string;
  type: 'character' | 'setting' | 'timeline' | 'plot';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedScenes: string[];
  quickFix?: {
    id: string;
    label: string;
  };
}

export interface Fix {
  id: string;
  description: string;
  preview?: string;
  affectedScenes: string[];
  confidence: number;
}

export interface ContinuityIssueCardProps {
  issue: ContinuityIssue;
  onSelect: () => void;
  onFix: (fixId: string) => void;
}

export interface ContinuityFixPanelProps {
  issue: ContinuityIssue;
  onApplyFix: (fixId: string) => void;
}