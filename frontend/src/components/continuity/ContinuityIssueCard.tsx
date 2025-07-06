import { FC } from 'react';
import { ContinuityIssueCardProps } from '../../types/continuity';

const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
  switch (severity) {
    case 'low':
      return 'bg-yellow-100 text-yellow-800';
    case 'medium':
      return 'bg-orange-100 text-orange-800';
    case 'high':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const ContinuityIssueCard: FC<ContinuityIssueCardProps> = ({ 
  issue, 
  onSelect, 
  onFix 
}) => {
  const severity = getSeverityColor(issue.severity);
  
  return (
    <div 
      className="continuity-issue-card bg-white border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${severity}`}>
          {issue.type}
        </span>
        <span className="text-sm text-gray-500">
          {issue.affectedScenes.length} scenes affected
        </span>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-700">{issue.description}</p>
        
        {issue.quickFix && (
          <button
            className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onFix(issue.quickFix!.id);
            }}
          >
            Quick Fix: {issue.quickFix.label}
          </button>
        )}
      </div>
    </div>
  );
};