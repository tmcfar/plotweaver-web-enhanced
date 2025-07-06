import { FC, useState, useEffect } from 'react';
import { ContinuityFixPanelProps, Fix } from '../../types/continuity';
import { continuityAPI } from '../../lib/api/continuity';

export const ContinuityFixPanel: FC<ContinuityFixPanelProps> = ({ 
  issue, 
  onApplyFix 
}) => {
  const [fixes, setFixes] = useState<Fix[]>([]);
  const [selectedFix, setSelectedFix] = useState<string>();
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const loadFixes = async () => {
      setLoading(true);
      try {
        const fetchedFixes = await continuityAPI.getFixes(issue.id);
        setFixes(fetchedFixes);
      } catch (error) {
        console.error('Failed to load fixes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadFixes();
  }, [issue.id]);
  
  if (loading) {
    return (
      <div className="continuity-fix-panel p-4 bg-gray-50 rounded-lg">
        <div className="text-center">Loading fixes...</div>
      </div>
    );
  }
  
  return (
    <div className="continuity-fix-panel p-4 bg-gray-50 rounded-lg">
      <h3 className="font-semibold mb-3">Available Fixes</h3>
      
      <div className="space-y-3">
        {fixes.map(fix => (
          <div key={fix.id} className="fix-option">
            <div className="flex items-start space-x-3">
              <input
                type="radio"
                id={fix.id}
                name="fix-option"
                value={fix.id}
                checked={selectedFix === fix.id}
                onChange={(e) => setSelectedFix(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor={fix.id} className="block font-medium text-sm cursor-pointer">
                  {fix.description}
                </label>
                <div className="text-xs text-gray-500 mt-1">
                  Confidence: {Math.round(fix.confidence * 100)}%
                </div>
                {fix.preview && (
                  <div className="mt-2 p-2 bg-white rounded text-sm border">
                    {fix.preview}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => onApplyFix(selectedFix!)}
        disabled={!selectedFix}
      >
        Apply Fix
      </button>
    </div>
  );
};