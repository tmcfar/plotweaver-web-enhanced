import { FC, useState } from 'react';

interface LockReasonDialogProps {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export const LockReasonDialog: FC<LockReasonDialogProps> = ({
  onConfirm,
  onCancel
}) => {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Lock Reason</h2>
        <p className="text-sm text-gray-600 mb-4">
          Please provide a reason for locking this component. This helps other team
          members understand why changes are restricted.
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-2 border rounded-md mb-4"
          rows={3}
          placeholder="Enter reason for locking..."
        />

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={!reason.trim()}
          >
            Confirm Lock
          </button>
        </div>
      </div>
    </div>
  );
};
