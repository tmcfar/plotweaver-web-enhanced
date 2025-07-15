import { render, screen, fireEvent } from '@testing-library/react';
import { LockMenu } from '../LockMenu';
import { useLockStore } from '../../../lib/store/lockStore';

// Mock the store
jest.mock('../../../lib/store/lockStore', () => ({
  useLockStore: jest.fn()
}));

describe('LockMenu', () => {
  const mockLockComponent = jest.fn();
  const mockUnlockComponent = jest.fn();

  beforeEach(() => {
    (useLockStore as unknown as jest.Mock).mockReturnValue({
      lockComponent: mockLockComponent,
      unlockComponent: mockUnlockComponent
    });
  });

  it('renders lock menu button', () => {
    render(<LockMenu componentId="test-1" />);
    expect(screen.getByRole('button', { name: 'Lock menu' })).toBeInTheDocument();
  });

  it('shows current lock level', () => {
    render(
      <LockMenu
        componentId="test-1"
        currentLock={{
          id: 'lock-1',
          componentId: 'test-1',
          componentType: 'test',
          level: 'soft',
          type: 'personal',
          reason: 'Test lock',
          lockedBy: 'user',
          lockedAt: new Date().toISOString()
        }}
      />
    );

    expect(document.querySelector('.lock-indicator')).toBeInTheDocument();
  });

  it('shows lock options on click', () => {
    render(<LockMenu componentId="test-1" />);
    const menuButton = screen.getByRole('button', { name: 'Lock menu' });
    fireEvent.click(menuButton);

    expect(screen.getByRole('button', { name: 'Soft Lock' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hard Lock' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Freeze' })).toBeInTheDocument();
  });

  it('allows unlocking when locked', () => {
    render(
      <LockMenu
        componentId="test-1"
        currentLock={{
          id: 'lock-1',
          componentId: 'test-1',
          componentType: 'test',
          level: 'soft',
          type: 'personal',
          reason: 'Test lock',
          lockedBy: 'user',
          lockedAt: new Date().toISOString()
        }}
      />
    );

    const menuButton = screen.getByRole('button', { name: 'Lock menu' });
    fireEvent.click(menuButton);
    const unlockButton = screen.getByText('Unlock');
    fireEvent.click(unlockButton);

    expect(mockUnlockComponent).toHaveBeenCalledWith('test-1');
  });
});
