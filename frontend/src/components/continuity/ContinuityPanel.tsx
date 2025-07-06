import { FC, useState } from 'react';
import { useContinuityCheck } from '../../hooks/useContinuityCheck';
import { ContinuityIssueCard } from './ContinuityIssueCard';
import { ContinuityFixPanel } from './ContinuityFixPanel';

interface ContinuityPanelProps {
  sceneId: string;
}

export const ContinuityPanel: FC<ContinuityPanelProps> = ({ sceneId }) => {
  const { issues, checking, fixIssue } = useContinuityCheck(sceneId);
  const [selectedIssue, setSelectedIssue] = useState<string>();
  
  if (checking) {
    return (
      <div className="continuity-panel p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Checking continuity...</span>
        </div>
      </div>
    );
  }
  
  if (issues.length === 0) {
    return (
      <div className="continuity-panel p-4">
        <div className="text-center text-gray-500">
          <div className="text-green-600 mb-2">✓</div>
          <p>No continuity issues found</p>
        </div>
      </div>
    );
  }
  
  const selectedIssueData = issues.find(i => i.id === selectedIssue);
  
  return (
    <div className="continuity-panel space-y-4">
      <div className="issues-list space-y-3">
        <h3 className="font-semibold text-lg">Continuity Issues</h3>
        {issues.map(issue => (
          <ContinuityIssueCard
            key={issue.id}
            issue={issue}
            onSelect={() => setSelectedIssue(issue.id)}
            onFix={(fixId) => fixIssue(issue.id, fixId)}
          />
        ))}
      </div>
      
      {selectedIssue && selectedIssueData && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Fix Issue: {selectedIssueData.type}</h4>
            <button
              onClick={() => setSelectedIssue(undefined)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <ContinuityFixPanel
            issue={selectedIssueData}
            onApplyFix={(fixId) => fixIssue(selectedIssue, fixId)}
          />
        </div>
      )}
    </div>
  );
};