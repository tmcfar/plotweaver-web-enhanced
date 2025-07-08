import { render, screen } from '@testing-library/react';
import { PermissionGate } from '../PermissionGate';
import { useWritingModeStore } from '../../lib/store/writingModeStore';

// Mock the store
jest.mock('../../lib/store/writingModeStore', () => ({
  useWritingModeStore: jest.fn()
}));

describe('PermissionGate', () => {
  const mockCheckPermission = jest.fn();

  beforeEach(() => {
    (useWritingModeStore as unknown as jest.Mock).mockReturnValue({
      checkPermission: mockCheckPermission
    });
  });

  it('renders children when permission granted', () => {
    mockCheckPermission.mockReturnValue(true);

    render(
      <PermissionGate action="plot:edit">
        <div>Protected Content</div>
      </PermissionGate>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders fallback when permission denied', () => {
    mockCheckPermission.mockReturnValue(false);

    render(
      <PermissionGate
        action="plot:edit"
        fallback={<div>Access Denied</div>}
      >
        <div>Protected Content</div>
      </PermissionGate>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders nothing when permission denied and no fallback', () => {
    mockCheckPermission.mockReturnValue(false);

    const { container } = render(
      <PermissionGate action="plot:edit">
        <div>Protected Content</div>
      </PermissionGate>
    );

    expect(container).toBeEmptyDOMElement();
  });
});
