import { render, screen } from '@testing-library/react';
import { LockIndicator } from '../LockIndicator';

describe('LockIndicator', () => {
  it('renders soft lock indicator', () => {
    render(<LockIndicator componentId="test-1" lockLevel="soft" />);
    expect(screen.getByText('🟡')).toBeInTheDocument();
  });

  it('renders hard lock indicator', () => {
    render(<LockIndicator componentId="test-1" lockLevel="hard" />);
    expect(screen.getByText('🟠')).toBeInTheDocument();
  });

  it('renders frozen lock indicator', () => {
    render(<LockIndicator componentId="test-1" lockLevel="frozen" />);
    expect(screen.getByText('🔴')).toBeInTheDocument();
  });

  it('applies size class', () => {
    render(<LockIndicator componentId="test-1" lockLevel="soft" size="lg" />);
    expect(screen.getByText('🟡')).toHaveClass('text-lg');
  });

  it('renders non-interactive mode', () => {
    render(<LockIndicator componentId="test-1" lockLevel={null} interactive={false} />);
    expect(screen.getByText('🔓')).toBeInTheDocument();
    // Should not be a button when non-interactive
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
