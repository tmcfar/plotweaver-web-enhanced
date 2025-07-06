import { Resolution, LockConflict } from '../api/locks';

export interface LockConflictDialogProps {
    conflicts: LockConflict[];
    onResolve: (resolution: Resolution) => void;
    onCancel: () => void;
}

export const LOCK_CONFLICT_DIALOG_CONFIG = {
    showDialog: ({ conflicts, onResolve, onCancel }: LockConflictDialogProps) => {
        // Create a temporary div for the dialog
        const container = document.createElement('div');
        document.body.appendChild(container);

        const cleanup = () => {
            document.body.removeChild(container);
        };

        const handleResolve = (resolution: Resolution) => {
            cleanup();
            onResolve(resolution);
        };

        const handleCancel = () => {
            cleanup();
            onCancel();
        };

        // Return props for the dialog component
        return {
            conflicts,
            onResolve: handleResolve,
            onCancel: handleCancel
        };

        // TODO: Use ReactDOM.render or createRoot based on React version
        // For now, this is a placeholder for the actual rendering logic
    }
};
