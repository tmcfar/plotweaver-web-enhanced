import { FC } from 'react';

type ModeSetId = 'professional-writer' | 'ai-first' | 'editor' | 'hobbyist';

interface ModeSetCardProps {
  id: ModeSetId;
  title: string;
  description: string;
  features: string[];
  onSelect: (id: ModeSetId) => void;
}

export const ModeSetCard: FC<ModeSetCardProps> = ({ id, title, description, features, onSelect }) => {
  return (
    <div 
      className="p-6 border rounded-lg hover:border-blue-500 cursor-pointer transition-all"
      onClick={() => onSelect(id)}
    >
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-600 mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-sm text-gray-700">
            <span className="mr-2">•</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
};
