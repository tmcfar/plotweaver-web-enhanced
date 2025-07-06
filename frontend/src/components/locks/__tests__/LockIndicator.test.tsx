import { render, screen } from '@testing-library/react';
import { LockIndicator } from '../LockIndicator';

describe('LockIndicator', () => {
  it('renders soft lock indicator', () => {
    render(<LockIndicator level="soft" />);
    expect(screen.getByText('🔐')).toBeInTheDocument();
    expect(screen.getByTitle('Soft locked - AI suggestions only')).toBeInTheDocument();
  });

  it('renders hard lock indicator', () => {
    render(<LockIndicator level="hard" />);
    expect(screen.getByText('🔒')).toBeInTheDocument();
    expect(screen.getByTitle('Hard locked - Edits require confirmation')).toBeInTheDocument();
  });

  it('renders frozen lock indicator', () => {
    render(<LockIndicator level="frozen" />);
    expect(screen.getByText('🧯')).toBeInTheDocument();
    expect(screen.getByTitle('Frozen - No changes allowed')).toBeInTheDocument();
  });

  it('applies size class', () => {
    render(<LockIndicator level="soft" size="lg" />);
    expect(screen.getByText('🔐')).toHaveClass('text-lg');
  });

  it('hides tooltip when showTooltip is false', () => {
    render(<LockIndicator level="soft" showTooltip={false} />);
    expect(screen.queryByTitle('Soft locked - AI suggestions only')).not.toBeInTheDocument();
  });
});
