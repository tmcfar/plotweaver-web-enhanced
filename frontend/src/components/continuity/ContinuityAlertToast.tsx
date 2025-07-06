import { FC } from 'react';
import { ContinuityIssue } from '../../types/continuity';
import { continuityAPI } from '../../lib/api/continuity';

interface ContinuityAlertToastProps {
  issue: ContinuityIssue;
  toastId?: string;
  onDismiss?: () => void;
}

const showContinuityPanel = (issue: ContinuityIssue) => {
  // In a real app, this would open the continuity panel and navigate to the issue
  console.log('Showing continuity panel for issue:', issue.id);
};

const applyQuickFix = async (quickFix: { id: string; label: string }) => {
  try {
    await continuityAPI.applyFix(quickFix.id);
    console.log('Quick fix applied:', quickFix.label);
  } catch (error) {
    console.error('Failed to apply quick fix:', error);
  }
};

export const ContinuityAlertToast: FC<ContinuityAlertToastProps> = ({ 
  issue, 
  onDismiss 
}) => {
  return (
    <div className="continuity-alert-toast bg-white border border-yellow-200 rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="h-5 w-5 text-yellow-500 mt-0.5">
            ⚠️
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">Continuity Issue Detected</p>
          <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => showContinuityPanel(issue)}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
            >
              View Details
            </button>
            {issue.quickFix && (
              <button
                onClick={() => applyQuickFix(issue.quickFix!)}
                className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                Quick Fix
              </button>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};