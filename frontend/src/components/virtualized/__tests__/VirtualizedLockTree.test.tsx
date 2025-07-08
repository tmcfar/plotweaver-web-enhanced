import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VirtualizedLockTree } from '@/components/virtualized/VirtualizedLockTree';

const mockLocks = {
  'node-1': { level: 'soft', reason: 'Initial lock' },
  'node-1-1': { level: 'hard', reason: 'Critical component' },
  'node-2-1': { level: 'frozen', reason: 'Finalized' },
};

// Mock lock store
jest.mock('@/hooks/useLockStore', () => ({
  useLockStore: () => ({
    locks: mockLocks,
    setLock: jest.fn(),
    removeLock: jest.fn(),
    clearLocks: jest.fn(),
  }),
}));

// Mock react-window with a simpler approach
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, height, itemCount, itemSize, width }: any) => (
    <div data-testid="virtual-tree" style={{ height, width }}>
      {Array.from({ length: Math.min(itemCount, 5) }).map((_, index) => (
        <div key={index} data-testid={`tree-item-${index}`}>
          Mock tree item {index}
        </div>
      ))}
    </div>
  ),
}));

// Generate large dataset for performance testing
const generateLargeDataset = (count: number) => {
  const items = [];
  for (let i = 0; i < count; i++) {
    const hasChildren = i % 3 === 0;
    items.push({
      id: `node-${i}`,
      name: `Component ${i}`,
      type: ['plot', 'character', 'setting'][i % 3],
      locked: mockLocks[`node-${i}`] || null,
      children: hasChildren ? [
        {
          id: `node-${i}-1`,
          name: `Sub-component ${i}-1`,
          type: 'scene',
          locked: mockLocks[`node-${i}-1`] || null,
          children: [],
        },
      ] : [],
    });
  }
  return items;
};

describe('VirtualizedLockTree', () => {
  const defaultProps = {
    items: generateLargeDataset(100),
    height: 600,
    width: 400,
    onLockToggle: jest.fn(),
  };

  it('renders virtualized tree structure', () => {
    render(<VirtualizedLockTree {...defaultProps} />);

    const virtualTree = screen.getByTestId('virtual-tree');
    expect(virtualTree).toBeInTheDocument();
    expect(virtualTree).toHaveStyle({ height: '600px', width: '400px' });
  });

  it('displays visible items only', () => {
    render(<VirtualizedLockTree {...defaultProps} />);

    // Should only render first 10 items for performance
    const items = screen.getAllByText(/Component \d+/);
    expect(items).toHaveLength(10);
  });

  it('shows lock indicators for locked items', () => {
    render(<VirtualizedLockTree {...defaultProps} />);

    // Check for lock icons
    const softLock = screen.getByTestId('lock-soft-node-1');
    expect(softLock).toBeInTheDocument();
    expect(softLock).toHaveClass('text-yellow-500');

    const hardLock = screen.getByTestId('lock-hard-node-1-1');
    expect(hardLock).toBeInTheDocument();
    expect(hardLock).toHaveClass('text-orange-500');
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<VirtualizedLockTree {...defaultProps} />);

    const firstItem = screen.getByTestId('tree-item-node-0');
    await user.click(firstItem);

    // Arrow down
    await user.keyboard('{ArrowDown}');
    expect(screen.getByTestId('tree-item-node-1')).toHaveClass('focused');

    // Arrow up
    await user.keyboard('{ArrowUp}');
    expect(screen.getByTestId('tree-item-node-0')).toHaveClass('focused');
  });

  it('expands and collapses nodes', async () => {
    const user = userEvent.setup();
    render(<VirtualizedLockTree {...defaultProps} />);

    // Find expandable node
    const expandButton = screen.getByTestId('expand-node-0');
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');

    // Expand
    await user.click(expandButton);
    expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Sub-component 0-1')).toBeInTheDocument();

    // Collapse
    await user.click(expandButton);
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Sub-component 0-1')).not.toBeInTheDocument();
  });

  it('handles lock toggle with keyboard shortcut', async () => {
    const onLockToggle = jest.fn();
    const user = userEvent.setup();
    
    render(<VirtualizedLockTree {...defaultProps} onLockToggle={onLockToggle} />);

    // Focus item
    const item = screen.getByTestId('tree-item-node-0');
    await user.click(item);

    // Press Ctrl+L
    await user.keyboard('{Control>}l{/Control}');

    expect(onLockToggle).toHaveBeenCalledWith('node-0');
  });

  it('filters items based on search', async () => {
    const user = userEvent.setup();
    render(<VirtualizedLockTree {...defaultProps} searchable />);

    const searchInput = screen.getByPlaceholderText('Search components...');
    await user.type(searchInput, 'Component 5');

    // Should filter to matching items
    await waitFor(() => {
      expect(screen.getByText('Component 5')).toBeInTheDocument();
      expect(screen.queryByText('Component 0')).not.toBeInTheDocument();
    });
  });

  it('highlights search matches', async () => {
    const user = userEvent.setup();
    render(<VirtualizedLockTree {...defaultProps} searchable />);

    const searchInput = screen.getByPlaceholderText('Search components...');
    await user.type(searchInput, 'plot');

    await waitFor(() => {
      const highlights = screen.getAllByTestId('highlight');
      expect(highlights.length).toBeGreaterThan(0);
    });
  });

  it('handles expand all / collapse all', async () => {
    const user = userEvent.setup();
    render(<VirtualizedLockTree {...defaultProps} showControls />);

    // Expand all
    const expandAllButton = screen.getByText('Expand All');
    await user.click(expandAllButton);

    await waitFor(() => {
      const expandButtons = screen.getAllByTestId(/expand-node-/);
      expandButtons.forEach(button => {
        if (button.getAttribute('aria-expanded') !== null) {
          expect(button).toHaveAttribute('aria-expanded', 'true');
        }
      });
    });

    // Collapse all
    const collapseAllButton = screen.getByText('Collapse All');
    await user.click(collapseAllButton);

    await waitFor(() => {
      const expandButtons = screen.getAllByTestId(/expand-node-/);
      expandButtons.forEach(button => {
        if (button.getAttribute('aria-expanded') !== null) {
          expect(button).toHaveAttribute('aria-expanded', 'false');
        }
      });
    });
  });

  it('displays lock reason on hover', async () => {
    const user = userEvent.setup();
    render(<VirtualizedLockTree {...defaultProps} />);

    const lockIcon = screen.getByTestId('lock-soft-node-1');
    await user.hover(lockIcon);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('Initial lock');
    });
  });

  it('shows quick actions menu on right click', async () => {
    const user = userEvent.setup();
    render(<VirtualizedLockTree {...defaultProps} />);

    const item = screen.getByTestId('tree-item-node-0');
    await user.pointer({ keys: '[MouseRight]', target: item });

    await waitFor(() => {
      expect(screen.getByText('Lock Component')).toBeInTheDocument();
      expect(screen.getByText('Unlock Component')).toBeInTheDocument();
      expect(screen.getByText('View Details')).toBeInTheDocument();
    });
  });

  it('performs well with large datasets', () => {
    const largeDataset = generateLargeDataset(10000);
    const startTime = performance.now();

    render(<VirtualizedLockTree {...defaultProps} items={largeDataset} />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render in less than 100ms even with 10k items
    expect(renderTime).toBeLessThan(100);

    // Should still only render visible items
    const items = screen.getAllByText(/Component \d+/);
    expect(items.length).toBeLessThan(20);
  });

  it('maintains scroll position during updates', async () => {
    const { rerender } = render(<VirtualizedLockTree {...defaultProps} />);

    const virtualTree = screen.getByTestId('virtual-tree');
    
    // Simulate scroll
    fireEvent.scroll(virtualTree, { target: { scrollTop: 200 } });

    // Update props
    const updatedItems = [...defaultProps.items];
    updatedItems[0].locked = { level: 'hard', reason: 'Updated' };

    rerender(<VirtualizedLockTree {...defaultProps} items={updatedItems} />);

    // Scroll position should be maintained
    expect(virtualTree.scrollTop).toBe(200);
  });

  it('supports accessibility features', () => {
    render(<VirtualizedLockTree {...defaultProps} />);

    const tree = screen.getByRole('tree');
    expect(tree).toHaveAttribute('aria-label', 'Component lock tree');

    const treeItems = screen.getAllByRole('treeitem');
    treeItems.forEach(item => {
      expect(item).toHaveAttribute('aria-level');
      expect(item).toHaveAttribute('aria-posinset');
      expect(item).toHaveAttribute('aria-setsize');
    });
  });

  it('memoizes row rendering for performance', () => {
    const renderSpy = jest.fn();
    const CustomRow = React.memo(({ data, index, style }: any) => {
      renderSpy(index);
      return <div style={style}>Item {index}</div>;
    });
    CustomRow.displayName = 'CustomRow';

    render(
      <VirtualizedLockTree
        {...defaultProps}
        rowComponent={CustomRow}
      />
    );

    const initialCallCount = renderSpy.mock.calls.length;

    // Trigger re-render with same props
    render(
      <VirtualizedLockTree
        {...defaultProps}
        rowComponent={CustomRow}
      />
    );

    // Should not re-render memoized rows
    expect(renderSpy.mock.calls.length).toBe(initialCallCount);
  });
});
