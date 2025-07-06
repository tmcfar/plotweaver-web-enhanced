import { FC } from 'react';
import { ComponentStatusDetail } from '../../hooks/useFoundationStatus';

interface ComponentStatusProps {
  title: string;
  ready: boolean;
  details: ComponentStatusDetail[];
  onLock?: () => void;
  missing?: string[];
}

export const ComponentStatus: FC<ComponentStatusProps> = ({
  title,
  ready,
  details,
  onLock,
  missing
}) => {
  return (
    <div
      className={`component-status border rounded-lg p-4 ${ready ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium">{title}</h4>
        {ready ? (
          <button
            onClick={onLock}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            Lock Component
          </button>
        ) : (
          <span className="px-2 py-1 text-sm bg-gray-200 text-gray-600 rounded">
            Not Ready
          </span>
        )}
      </div>

      <div className="space-y-2">
        {details.map((detail, i) => (
          <div
            key={i}
            className={`flex items-center text-sm ${detail.ready ? 'text-green-600' : 'text-gray-600'}`}
          >
            {detail.ready ? '✅' : '⚠️'} <span className="ml-2">{detail.text}</span>
          </div>
        ))}
        {missing && missing.length > 0 && (
          <div className="mt-3 text-sm text-red-600">
            <div>Missing Required Elements:</div>
            <ul className="list-disc list-inside ml-2">
              {missing.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
