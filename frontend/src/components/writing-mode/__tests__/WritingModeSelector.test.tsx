import { render, screen, fireEvent } from '@testing-library/react';
import { WritingModeSelector } from '../WritingModeSelector';
import { useWritingModeStore } from '../../../lib/store/writingModeStore';

// Mock the store
jest.mock('../../../lib/store/writingModeStore', () => ({
  useWritingModeStore: jest.fn()
}));

describe('WritingModeSelector', () => {
  const mockSetWritingMode = jest.fn();
  const mockSetFocusArea = jest.fn();

  beforeEach(() => {
    (useWritingModeStore as jest.Mock).mockReturnValue({
      writingMode: {
        primary: 'discovery',
        focusArea: undefined
      },
      setWritingMode: mockSetWritingMode,
      setFocusArea: mockSetFocusArea
    });
  });

  it('renders mode options', () => {
    render(<WritingModeSelector />);

    expect(screen.getByText('🔍 Discovery')).toBeInTheDocument();
    expect(screen.getByText('🎯 Refinement')).toBeInTheDocument();
    expect(screen.getByText('✨ Polish')).toBeInTheDocument();
  });

  it('changes writing mode when clicked', () => {
    render(<WritingModeSelector />);

    fireEvent.click(screen.getByText('🎯 Refinement'));
    expect(mockSetWritingMode).toHaveBeenCalledWith('refinement');
  });

  it('shows focus areas after mode selection', () => {
    render(<WritingModeSelector />);

    fireEvent.click(screen.getByText('🎯 Refinement'));
    expect(screen.getByText('Focus Area')).toBeInTheDocument();
  });
});
