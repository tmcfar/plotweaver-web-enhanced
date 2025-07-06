import { FC } from 'react';
import { useWritingModeStore } from '../../lib/store/writingModeStore';
import { WRITING_MODE_CONFIGS } from '../../config/writingModeConfigs';
import { FOCUS_AREAS } from '../../config/focusAreas';

export const WritingModeIndicator: FC = () => {
  const { writingMode } = useWritingModeStore();
  const modeConfig = WRITING_MODE_CONFIGS[writingMode.primary];

  const getFocusAreaLabel = (focusArea: string) => {
    const areas = FOCUS_AREAS[writingMode.primary];
    return areas.find((area) => area.value === focusArea)?.label || focusArea;
  };

  return (
    <div className="writing-mode-indicator flex items-center space-x-2">
      <div
        className="mode-badge px-3 py-1.5 rounded-full text-white flex items-center"
        style={{ backgroundColor: modeConfig.color }}
      >
        <span className="mr-1">{modeConfig.icon}</span>
        <span className="font-medium">{modeConfig.label}</span>
      </div>
      {writingMode.focusArea && (
        <div className="focus-area-badge px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm">
          {getFocusAreaLabel(writingMode.focusArea)}
        </div>
      )}
    </div>
  );
};
