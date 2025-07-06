import { render, screen, fireEvent } from '@testing-library/react';
import { PanelContainer } from '../PanelContainer';

describe('PanelContainer Component', () => {
  const defaultProps = {
    side: 'left' as const,
    defaultSize: 250,
    minSize: 200,
    maxSize: 400,
    config: {
      visible: true,
      defaultSize: 250,
    },
    children: <div>Panel Content</div>,
  };

  it('renders correctly with default props', () => {
    render(<PanelContainer {...defaultProps} />);
    expect(screen.getByText('Panel Content')).toBeInTheDocument();
  });

  it('collapses and expands when clicking the collapse button', () => {
    render(<PanelContainer {...defaultProps} />);
    const collapseButton = screen.getByRole('button');
    
    fireEvent.click(collapseButton);
    expect(document.querySelector('.collapsed')).toBeInTheDocument();
    
    fireEvent.click(collapseButton);
    expect(document.querySelector('.collapsed')).not.toBeInTheDocument();
  });

  it('shows resize handle when not collapsed', () => {
    render(<PanelContainer {...defaultProps} />);
    expect(document.querySelector('.resize-handle')).toBeInTheDocument();
  });

  it('hides resize handle when collapsed', () => {
    render(<PanelContainer {...defaultProps} />);
    const collapseButton = screen.getByRole('button');
    
    fireEvent.click(collapseButton);
    expect(document.querySelector('.resize-handle')).not.toBeInTheDocument();
  });

  it('applies correct styles based on side prop', () => {
    const { rerender } = render(<PanelContainer {...defaultProps} />);
    expect(document.querySelector('.panel-left')).toBeInTheDocument();

    rerender(<PanelContainer {...defaultProps} side="right" />);
    expect(document.querySelector('.panel-right')).toBeInTheDocument();

    rerender(<PanelContainer {...defaultProps} side="bottom" />);
    expect(document.querySelector('.panel-bottom')).toBeInTheDocument();
  });
});
