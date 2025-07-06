import { render, screen, fireEvent } from '@testing-library/react';
import { LockConflictDialog } from '../LockConflictDialog';

describe('LockConflictDialog', () => {
  const mockConflicts = [
    {
      componentId: 'test-1',
      componentName: 'Test Component 1',
      componentType: 'test',
      lockLevel: 'soft' as const,
      lockedBy: 'user-1',
      lockedAt: new Date().toISOString(),
      reason: 'Test reason'
    },
    {
      componentId: 'test-2',
      componentName: 'Test Component 2',
      componentType: 'test',
      lockLevel: 'hard' as const,
      lockedBy: 'user-2',
      lockedAt: new Date().toISOString()
    }
  ];

  const mockOperation = {
    type: 'test-operation',
    componentIds: ['test-1', 'test-2']
  };

  it('renders conflicts list', () => {
    render(
      <LockConflictDialog
        conflicts={mockConflicts}
        operation={mockOperation}
        onResolve={jest.fn()}
      />
    );

    expect(screen.getByText('Test Component 1')).toBeInTheDocument();
    expect(screen.getByText('Test Component 2')).toBeInTheDocument();
    expect(screen.getByText('Test reason')).toBeInTheDocument();
  });

  it('allows selecting resolutions', () => {
    render(
      <LockConflictDialog
        conflicts={mockConflicts}
        operation={mockOperation}
        onResolve={jest.fn()}
      />
    );

    const unlockRadios = screen.getAllByLabelText('Unlock and proceed');
    const skipRadios = screen.getAllByLabelText('Skip this component');

    expect(unlockRadios).toHaveLength(2);
    expect(skipRadios).toHaveLength(2);

    fireEvent.click(unlockRadios[0]);
    fireEvent.click(skipRadios[1]);

    expect(unlockRadios[0]).toBeChecked();
    expect(skipRadios[1]).toBeChecked();
  });

  it('requires all conflicts to be resolved', () => {
    render(
      <LockConflictDialog
        conflicts={mockConflicts}
        operation={mockOperation}
        onResolve={jest.fn()}
      />
    );

    const continueButton = screen.getByText('Select All Resolutions');
    expect(continueButton).toBeDisabled();

    fireEvent.click(screen.getAllByLabelText('Unlock and proceed')[0]);
    expect(continueButton).toBeDisabled();

    fireEvent.click(screen.getAllByLabelText('Skip this component')[1]);
    expect(continueButton).toBeEnabled();
  });

  it('provides correct resolution data', () => {
    const onResolve = jest.fn();
    render(
      <LockConflictDialog
        conflicts={mockConflicts}
        operation={mockOperation}
        onResolve={onResolve}
      />
    );

    fireEvent.click(screen.getAllByLabelText('Unlock and proceed')[0]);
    fireEvent.click(screen.getAllByLabelText('Skip this component')[1]);
    fireEvent.click(screen.getByText('Continue'));

    expect(onResolve).toHaveBeenCalledWith({
      cancelled: false,
      componentIds: ['test-2']
    });
  });
});
