import { FC, ReactNode, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface FileTreeSectionProps {
  title: string;
  icon?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

export const FileTreeSection: FC<FileTreeSectionProps> = ({
  title,
  icon,
  children,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="file-tree-section">
      <div
        className="flex items-center p-2 cursor-pointer hover:bg-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 mr-1" />
        ) : (
          <ChevronRight className="w-4 h-4 mr-1" />
        )}
        {icon && <span className="mr-2">{icon}</span>}
        <span className="font-medium">{title}</span>
      </div>
      {isExpanded && <div className="pl-4">{children}</div>}
    </div>
  );
};
