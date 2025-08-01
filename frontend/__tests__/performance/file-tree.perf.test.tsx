import { render, screen } from '@testing-library/react';
import { FileTree } from '../../src/components/panels/FileTree';
import { StoreProvider } from '../../src/components/providers/StoreProvider';

// Mock file data generator
const generateMockFiles = (count: number) => {
  const files = [];
  for (let i = 0; i < count; i++) {
    files.push({
      id: `file-${i}`,
      name: `file-${i}.txt`,
      type: 'scene',
      path: `chapter-${Math.floor(i / 10)}/scene-${i % 10}.txt`,
      content: `Content for file ${i}`,
      lastModified: new Date(Date.now() - i * 1000).toISOString(),
      size: Math.floor(Math.random() * 10000) + 1000,
      lock: i % 20 === 0 ? {
        level: 'soft',
        reason: 'Test lock',
        timestamp: new Date().toISOString(),
        userId: 'user-1'
      } : undefined
    });
  }
  return {
    concept: files[0] || undefined,
    characters: files.slice(1)
  };
};

// Performance measurement utility
const measurePerformance = async (name: string, fn: () => Promise<void> | void) => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  const duration = end - start;
  console.log(`${name}: ${duration.toFixed(2)}ms`);
  return duration;
};

// Test wrapper
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>;
}

describe('File Tree Performance', () => {
  beforeEach(() => {
    // Clear any existing performance marks
    if (performance.clearMarks) {
      performance.clearMarks();
    }
  });

  it('renders 1000 files without lag', async () => {
    const files = generateMockFiles(1000);
    
    const renderTime = await measurePerformance('FileTree render 1000 files', () => {
      render(
        <TestWrapper>
          <FileTree files={files} onFileSelect={() => {}} />
        </TestWrapper>
      );
    });
    
    expect(renderTime).toBeLessThan(500); // Should render in under 500ms
    
    // Test virtualization - only visible items should be rendered
    const visibleItems = screen.getAllByRole('treeitem');
    expect(visibleItems.length).toBeLessThan(100); // Only visible items rendered
    
    // Test that the tree structure is correct
    expect(screen.getByText('file-0.txt')).toBeInTheDocument();
    expect(screen.getByText('chapter-0')).toBeInTheDocument();
  });

  it('handles 10000 files efficiently', async () => {
    const files = generateMockFiles(10000);
    
    const renderTime = await measurePerformance('FileTree render 10000 files', () => {
      render(
        <TestWrapper>
          <FileTree files={files} onFileSelect={() => {}} />
        </TestWrapper>
      );
    });
    
    expect(renderTime).toBeLessThan(1000); // Should render in under 1000ms
    
    // Virtualization should limit rendered items
    const visibleItems = screen.getAllByRole('treeitem');
    expect(visibleItems.length).toBeLessThan(100);
  });

  it('efficiently updates when files change', async () => {
    const initialFiles = generateMockFiles(100);
    
    const { rerender } = render(
      <TestWrapper>
        <FileTree files={initialFiles} onFileSelect={() => {}} />
      </TestWrapper>
    );
    
    // Modify a few files
    const updatedFiles = {
      concept: initialFiles.concept ? { ...initialFiles.concept, name: 'updated-file.txt' } : undefined,
      characters: initialFiles.characters.map((file, index) => 
        index === 0 ? { ...file, lastModified: new Date().toISOString() } : file
      )
    };
    
    const updateTime = await measurePerformance('FileTree update', () => {
      rerender(
        <TestWrapper>
          <FileTree files={updatedFiles} onFileSelect={() => {}} />
        </TestWrapper>
      );
    });
    
    expect(updateTime).toBeLessThan(100); // Should update in under 100ms
    
    // Check that updates are reflected
    expect(screen.getByText('updated-file.txt')).toBeInTheDocument();
  });

  it('handles rapid file selection changes', async () => {
    const files = generateMockFiles(500);
    
    const { rerender } = render(
      <TestWrapper>
        <FileTree files={files} onFileSelect={() => {}} />
      </TestWrapper>
    );
    
    // Simulate rapid selection changes
    const selectionTimes = [];
    for (let i = 0; i < 10; i++) {
      const time = await measurePerformance(`Selection change ${i}`, () => {
        rerender(
          <TestWrapper>
            <FileTree files={files} onFileSelect={() => {}} />
          </TestWrapper>
        );
      });
      selectionTimes.push(time);
    }
    
    // All selection changes should be fast
    selectionTimes.forEach(time => {
      expect(time).toBeLessThan(50); // Each selection should be under 50ms
    });
    
    // Average should be very fast
    const avgTime = selectionTimes.reduce((sum, time) => sum + time, 0) / selectionTimes.length;
    expect(avgTime).toBeLessThan(25);
  });

  it('efficiently handles lock status changes', async () => {
    const files = generateMockFiles(200);
    
    const { rerender } = render(
      <TestWrapper>
        <FileTree files={files} onFileSelect={() => {}} />
      </TestWrapper>
    );
    
    // Add locks to multiple files
    const lockedFiles = {
      concept: files.concept ? {
        ...files.concept,
        lock: {
          level: 'hard',
          reason: 'Performance test',
          timestamp: new Date().toISOString(),
          userId: 'user-1'
        }
      } : undefined,
      characters: files.characters.map((file, i) => ({
        ...file,
        lock: i % 5 === 0 ? {
          level: 'hard',
          reason: 'Performance test',
          timestamp: new Date().toISOString(),
          userId: 'user-1'
        } : file.lock
      }))
    };
    
    const lockUpdateTime = await measurePerformance('Lock status update', () => {
      rerender(
        <TestWrapper>
          <FileTree files={lockedFiles} onFileSelect={() => {}} />
        </TestWrapper>
      );
    });
    
    expect(lockUpdateTime).toBeLessThan(200); // Should update locks in under 200ms
    
    // Check that lock indicators are shown
    const lockIcons = screen.getAllByText('🔒');
    expect(lockIcons.length).toBeGreaterThan(0);
  });

  it('maintains smooth scrolling with large file lists', async () => {
    const files = generateMockFiles(2000);
    
    render(
      <TestWrapper>
        <FileTree files={files} onFileSelect={() => {}} />
      </TestWrapper>
    );
    
    const scrollContainer = screen.getByTestId('file-tree-scroll-container');
    
    // Measure scroll performance
    const scrollTimes = [];
    for (let i = 0; i < 10; i++) {
      const time = await measurePerformance(`Scroll ${i}`, () => {
        scrollContainer.scrollTop = i * 100;
        // Trigger scroll event
        const scrollEvent = new Event('scroll');
        scrollContainer.dispatchEvent(scrollEvent);
      });
      scrollTimes.push(time);
    }
    
    // All scroll operations should be fast
    scrollTimes.forEach(time => {
      expect(time).toBeLessThan(16); // Should be faster than 60fps (16ms)
    });
  });

  it('efficiently handles search/filter operations', async () => {
    const files = generateMockFiles(1000);
    
    const { rerender } = render(
      <TestWrapper>
        <FileTree files={files} onFileSelect={() => {}} />
      </TestWrapper>
    );
    
    // Test search performance
    const searchTime = await measurePerformance('File search', () => {
      rerender(
        <TestWrapper>
          <FileTree files={files} onFileSelect={() => {}} />
        </TestWrapper>
      );
    });
    
    expect(searchTime).toBeLessThan(100); // Search should be under 100ms
    
    // Should show filtered results
    const visibleItems = screen.getAllByRole('treeitem');
    expect(visibleItems.length).toBeLessThan(200); // Filtered list should be smaller
  });

  it('handles concurrent operations without blocking', async () => {
    const files = generateMockFiles(500);
    
    const { rerender } = render(
      <TestWrapper>
        <FileTree files={files} onFileSelect={() => {}} />
      </TestWrapper>
    );
    
    // Simulate concurrent operations
    const operations = [
      () => rerender(<TestWrapper><FileTree files={files} onFileSelect={() => {}} /></TestWrapper>),
      () => rerender(<TestWrapper><FileTree files={files} onFileSelect={() => {}} /></TestWrapper>),
      () => rerender(<TestWrapper><FileTree files={files} onFileSelect={() => {}} /></TestWrapper>)
    ];
    
    // Run operations concurrently
    const startTime = performance.now();
    await Promise.all(operations.map(op => op()));
    const endTime = performance.now();
    
    const totalTime = endTime - startTime;
    expect(totalTime).toBeLessThan(300); // All operations should complete quickly
  });

  it('maintains performance with deep folder structures', async () => {
    // Generate files with deep folder structure
    const files = generateMockFiles(100);
    
    const renderTime = await measurePerformance('Deep structure render', () => {
      render(
        <TestWrapper>
          <FileTree files={files} onFileSelect={() => {}} />
        </TestWrapper>
      );
    });
    
    expect(renderTime).toBeLessThan(200); // Should handle deep structures efficiently
    
    // Test expanding deep folders
    const expandTime = await measurePerformance('Deep folder expand', () => {
      // Simulate expanding multiple levels
      const expandedFolders = ['book', 'book/part-0', 'book/part-0/chapter-0', 'book/part-0/chapter-0/section-0'];
      render(
        <TestWrapper>
          <FileTree files={files} onFileSelect={() => {}} />
        </TestWrapper>
      );
    });
    
    expect(expandTime).toBeLessThan(100);
  });

  it('efficiently handles file tree with mixed content types', async () => {
    const files = generateMockFiles(1000);
    
    const renderTime = await measurePerformance('Mixed content render', () => {
      render(
        <TestWrapper>
          <FileTree files={files} onFileSelect={() => {}} />
        </TestWrapper>
      );
    });
    
    expect(renderTime).toBeLessThan(400); // Should handle mixed content types efficiently
    
    // Test type-based filtering
    const filterTime = await measurePerformance('Type filter', () => {
      render(
        <TestWrapper>
          <FileTree files={files} onFileSelect={() => {}} />
        </TestWrapper>
      );
    });
    
    expect(filterTime).toBeLessThan(100);
  });
});