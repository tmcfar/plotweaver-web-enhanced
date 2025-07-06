import { FC, useState } from 'react';

export type ModeSetId = 'professional-writer' | 'ai-first' | 'editor' | 'hobbyist';

export interface ModeSet {
  id: ModeSetId;
  name: string;
  description: string;
  features: string[];
  color: string;
  icon: string;
}

interface ModeSetSelectorProps {
  currentModeSet: ModeSetId;
  availableModeSets: ModeSet[];
  onModeSetChange: (modeSetId: ModeSetId) => void;
  showMigrationWarning?: boolean;
}

export const ModeSetSelector: FC<ModeSetSelectorProps> = ({
  currentModeSet,
  availableModeSets,
  onModeSetChange,
  showMigrationWarning = false
}) => {
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [selectedModeSet, setSelectedModeSet] = useState<ModeSetId | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const currentMode = availableModeSets.find(ms => ms.id === currentModeSet);

  const handleModeSetSelect = (modeSetId: ModeSetId) => {
    setShowDropdown(false);
    
    if (showMigrationWarning && modeSetId !== currentModeSet) {
      setSelectedModeSet(modeSetId);
      setShowMigrationDialog(true);
    } else {
      onModeSetChange(modeSetId);
    }
  };

  const confirmMigration = () => {
    if (selectedModeSet) {
      onModeSetChange(selectedModeSet);
      setShowMigrationDialog(false);
      setSelectedModeSet(null);
    }
  };

  const cancelMigration = () => {
    setShowMigrationDialog(false);
    setSelectedModeSet(null);
  };

  const targetMode = availableModeSets.find(ms => ms.id === selectedModeSet);

  return (
    <div className="mode-set-selector relative">
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-gray-700">Writing Mode:</span>
        
        {/* Current Mode Display */}
        <div
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
        >
          <span className="text-lg">{currentMode?.icon}</span>
          <span className="font-medium">{currentMode?.name}</span>
          <svg
            className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Feature Indicators */}
        <div className="flex space-x-1">
          {currentMode?.features.slice(0, 3).map((feature) => (
            <span
              key={feature}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
            >
              {feature}
            </span>
          ))}
          {currentMode && currentMode.features.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              +{currentMode.features.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            {availableModeSets.map((modeSet) => (
              <div
                key={modeSet.id}
                onClick={() => handleModeSetSelect(modeSet.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  modeSet.id === currentModeSet
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-xl">{modeSet.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{modeSet.name}</h3>
                      {modeSet.id === currentModeSet && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{modeSet.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {modeSet.features.map((feature) => (
                        <span
                          key={feature}
                          className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* Migration Warning Dialog */}
      {showMigrationDialog && targetMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Switch Writing Mode</h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                You're switching from <strong>{currentMode?.name}</strong> to <strong>{targetMode.name}</strong>.
                This will change your available features and interface.
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Current Features</h4>
                  <ul className="space-y-1">
                    {currentMode?.features.map((feature) => (
                      <li key={feature} className="text-gray-600">• {feature}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">New Features</h4>
                  <ul className="space-y-1">
                    {targetMode.features.map((feature) => (
                      <li key={feature} className="text-gray-600">• {feature}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Some current settings may not be compatible with the new mode.
                  Your work will be preserved, but the interface will adapt to the new mode's capabilities.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={confirmMigration}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Switch to {targetMode.name}
              </button>
              <button
                onClick={cancelMigration}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};