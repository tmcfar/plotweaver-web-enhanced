import { FC } from 'react';
import { Check, AlertCircle, Save } from 'lucide-react';

export type EditStatus = 'saved' | 'unsaved' | 'error';

interface EditStatusProps {
  status: EditStatus;
}

export const EditStatus: FC<EditStatusProps> = ({ status }) => {
  const icon = {
    saved: <Check className="w-4 h-4 text-green-500" />,
    unsaved: <Save className="w-4 h-4 text-yellow-500" />,
    error: <AlertCircle className="w-4 h-4 text-red-500" />
  }[status];

  return (
    <div className="edit-status" title={`Edit status: ${status}`}>
      {icon}
    </div>
  );
};
