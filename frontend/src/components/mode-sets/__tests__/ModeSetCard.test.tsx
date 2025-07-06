import { render, screen, fireEvent } from '@testing-library/react';
import { ModeSetCard } from '../ModeSetCard';

describe('ModeSetCard Component', () => {
  const defaultProps = {
    id: 'professional-writer' as const,
    title: 'Professional Writer',
    description: 'Full control with AI assist',
    features: ['Manual control', 'Advanced features', 'Git operations'],
    onSelect: jest.fn(),
  };

  it('renders correctly with all props', () => {
    render(<ModeSetCard {...defaultProps} />);
    
    expect(screen.getByText('Professional Writer')).toBeInTheDocument();
    expect(screen.getByText('Full control with AI assist')).toBeInTheDocument();
    defaultProps.features.forEach(feature => {
      expect(screen.getByText(feature)).toBeInTheDocument();
    });
  });

  it('calls onSelect with correct id when clicked', () => {
    render(<ModeSetCard {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Professional Writer'));
    expect(defaultProps.onSelect).toHaveBeenCalledWith('professional-writer');
  });

  it('renders different mode sets with correct content', () => {
    const aiFirstProps = {
      ...defaultProps,
      id: 'ai-first' as const,
      title: 'AI-Powered Creation',
      description: 'Let AI lead the way',
      features: ['Auto-generation', 'Simplified UI', 'Quick results'],
    };

    const { rerender } = render(<ModeSetCard {...defaultProps} />);
    expect(screen.getByText('Professional Writer')).toBeInTheDocument();

    rerender(<ModeSetCard {...aiFirstProps} />);
    expect(screen.getByText('AI-Powered Creation')).toBeInTheDocument();
    expect(screen.getByText('Let AI lead the way')).toBeInTheDocument();
  });
});
