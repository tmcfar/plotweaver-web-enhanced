import { FC, useState } from 'react';
import { useWritingModeStore } from '../../lib/store/writingModeStore';
import { WritingMode } from '../../lib/permissions/writingModePermissions';
import { FocusAreaSelector } from './FocusAreaSelector';

const MODE_OPTIONS = [
  { value: 'discovery' as const, label: '🔍 Discovery', description: 'Explore and create' },
  { value: 'refinement' as const, label: '🎯 Refinement', description: 'Polish and perfect' },
  { value: 'polish' as const, label: '✨ Polish', description: 'Final touches' }
];

export const WritingModeSelector: FC = () => {
  const { writingMode, setWritingMode, setFocusArea } = useWritingModeStore();
  const [showFocusAreas, setShowFocusAreas] = useState(false);

  const handleModeChange = (mode: WritingMode) => {
    setWritingMode(mode);
    setShowFocusAreas(true);
  };

  const handleFocusAreaChange = (area: string) => {
    setFocusArea(area);
  };

  return (
    <div className="writing-mode-selector">
      <div className="flex flex-col space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Writing Mode</h3>
        <div className="grid grid-cols-3 gap-3">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleModeChange(option.value)}
              className={`p-3 border rounded-lg text-left transition-colors ${writingMode.primary === option.value ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-sm text-gray-500">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {showFocusAreas && (
        <FocusAreaSelector
          mode={writingMode.primary}
          value={writingMode.focusArea}
          onChange={handleFocusAreaChange}
        />
      )}
    </div>
  );
};
