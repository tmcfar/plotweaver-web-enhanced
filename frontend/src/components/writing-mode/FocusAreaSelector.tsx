import { FC } from 'react';
import { FOCUS_AREAS } from '../../config/focusAreas';
import { WritingMode } from '../../lib/permissions/writingModePermissions';

interface FocusAreaSelectorProps {
  mode: WritingMode;
  value?: string;
  onChange: (value: string) => void;
}

export const FocusAreaSelector: FC<FocusAreaSelectorProps> = ({
  mode,
  value,
  onChange
}) => {
  const focusAreas = FOCUS_AREAS[mode];

  return (
    <div className="focus-area-selector mt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Focus Area</h3>
      <div className="space-y-2">
        {focusAreas.map((area) => (
          <label
            key={area.value}
            className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <input
              type="radio"
              name="focus-area"
              value={area.value}
              checked={value === area.value}
              onChange={(e) => onChange(e.target.value)}
              className="mt-1 mr-3"
            />
            <div>
              <div className="font-medium">{area.label}</div>
              <div className="text-sm text-gray-500">{area.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};
