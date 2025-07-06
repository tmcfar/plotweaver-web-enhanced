import { render, screen } from '@testing-library/react';
import { WritingModeIndicator } from '../WritingModeIndicator';
import { useWritingModeStore } from '../../../lib/store/writingModeStore';

// Mock the store
jest.mock('../../../lib/store/writingModeStore', () => ({
  useWritingModeStore: jest.fn()
}));

describe('WritingModeIndicator', () => {
  beforeEach(() => {
    (useWritingModeStore as jest.Mock).mockReturnValue({
      writingMode: {
        primary: 'discovery',
        focusArea: undefined
      }
    });
  });

  it('renders current mode', () => {
    render(<WritingModeIndicator />);

    expect(screen.getByText('🔍')).toBeInTheDocument();
    expect(screen.getByText('Discovery')).toBeInTheDocument();
  });

  it('shows focus area when selected', () => {
    (useWritingModeStore as jest.Mock).mockReturnValue({
      writingMode: {
        primary: 'discovery',
        focusArea: 'world-building'
      }
    });

    render(<WritingModeIndicator />);

    expect(screen.getByText('World Building')).toBeInTheDocument();
  });
});
