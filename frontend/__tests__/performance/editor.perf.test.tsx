import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Editor } from '../../src/components/mode-sets/ModeSetDashboard/Editor';
import { StoreProvider } from '../../src/components/providers/StoreProvider';

// Large document generator
const generateLargeDocument = (wordCount: number): string => {
  const words = [
    'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog',
    'Elena', 'stepped', 'into', 'room', 'with', 'confidence', 'mystery',
    'detective', 'investigation', 'revealed', 'truth', 'behind', 'case',
    'chapter', 'scene', 'character', 'development', 'plot', 'twist'
  ];
  
  const sentences = [];
  for (let i = 0; i < wordCount; i += 10) {
    const sentence = [];
    for (let j = 0; j < 10 && i + j < wordCount; j++) {
      sentence.push(words[Math.floor(Math.random() * words.length)]);
    }
    sentences.push(sentence.join(' ') + '.');
  }
  
  return sentences.join(' ');
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

// Input delay measurement
const measureInputDelay = async (inputFn: () => Promise<void>): Promise<number> => {
  const start = performance.now();
  await inputFn();
  const end = performance.now();
  return end - start;
};

// Test wrapper
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>;
}

describe('Editor Performance', () => {
  beforeEach(() => {
    // Clear performance marks
    if (performance.clearMarks) {
      performance.clearMarks();
    }
  });

  it('handles large documents efficiently', async () => {
    const largeContent = generateLargeDocument(50000); // 50k words
    
    const file = {
      id: 'large-doc',
      name: 'large-document.txt',
      type: 'scene',
      path: 'chapter1/large-scene.txt',
      content: largeContent,
      lastModified: new Date().toISOString()
    };
    
    const renderTime = await measurePerformance('Large document render', () => {
      render(
        <TestWrapper>
          <Editor projectId="test-project" />
        </TestWrapper>
      );
    });
    
    expect(renderTime).toBeLessThan(1000); // Should render in under 1 second
    
    // Test that content is loaded
    const editor = screen.getByRole('textbox');
    expect(editor).toBeInTheDocument();
    expect(editor.textContent).toContain('Elena');
  });

  it('maintains typing responsiveness with large content', async () => {
    const largeContent = generateLargeDocument(10000); // 10k words
    
    const file = {
      id: 'large-doc',
      name: 'large-document.txt',
      type: 'scene',
      path: 'chapter1/large-scene.txt',
      content: largeContent,
      lastModified: new Date().toISOString()
    };
    
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Editor projectId="test-project" />
      </TestWrapper>
    );
    
    const editor = screen.getByRole('textbox');
    
    // Position cursor at end
    await user.click(editor);
    
    // Measure typing responsiveness
    const inputDelay = await measureInputDelay(async () => {
      await user.keyboard(' Additional test content for performance measurement.');
    });
    
    expect(inputDelay).toBeLessThan(200); // Should respond in under 200ms
  });

  it('handles rapid text input efficiently', async () => {
    const file = {
      id: 'test-doc',
      name: 'test-document.txt',
      type: 'scene',
      path: 'chapter1/test-scene.txt',
      content: 'Initial content',
      lastModified: new Date().toISOString()
    };
    
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Editor projectId="test-project" />
      </TestWrapper>
    );
    
    const editor = screen.getByRole('textbox');
    await user.click(editor);
    
    // Simulate rapid typing
    const rapidTypingTime = await measurePerformance('Rapid typing', async () => {
      await user.keyboard('The quick brown fox jumps over the lazy dog. This is a test of rapid typing performance in the editor component.');
    });
    
    expect(rapidTypingTime).toBeLessThan(500); // Should handle rapid typing efficiently
  });

  it('efficiently handles undo/redo operations', async () => {
    const file = {
      id: 'undo-test',
      name: 'undo-test.txt',
      type: 'scene',
      path: 'chapter1/undo-test.txt',
      content: 'Original content',
      lastModified: new Date().toISOString()
    };
    
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Editor projectId="test-project" />
      </TestWrapper>
    );
    
    const editor = screen.getByRole('textbox');
    await user.click(editor);
    
    // Make several changes
    await user.keyboard(' First change.');
    await user.keyboard(' Second change.');
    await user.keyboard(' Third change.');
    
    // Measure undo performance
    const undoTime = await measurePerformance('Undo operations', async () => {
      await user.keyboard('{Control>}z{/Control}'); // Undo
      await user.keyboard('{Control>}z{/Control}'); // Undo
      await user.keyboard('{Control>}z{/Control}'); // Undo
    });
    
    expect(undoTime).toBeLessThan(100); // Undo should be very fast
    
    // Measure redo performance
    const redoTime = await measurePerformance('Redo operations', async () => {
      await user.keyboard('{Control>}y{/Control}'); // Redo
      await user.keyboard('{Control>}y{/Control}'); // Redo
    });
    
    expect(redoTime).toBeLessThan(100); // Redo should be very fast
  });

  it('handles search and replace efficiently', async () => {
    const content = generateLargeDocument(5000); // 5k words with repeated patterns
    
    const file = {
      id: 'search-test',
      name: 'search-test.txt',
      type: 'scene',
      path: 'chapter1/search-test.txt',
      content: content,
      lastModified: new Date().toISOString()
    };
    
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Editor projectId="test-project" />
      </TestWrapper>
    );
    
    // Open search dialog
    await user.keyboard('{Control>}f{/Control}');
    
    // Measure search performance
    const searchTime = await measurePerformance('Search operation', async () => {
      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'Elena');
    });
    
    expect(searchTime).toBeLessThan(200); // Search should be fast
    
    // Measure replace performance
    const replaceTime = await measurePerformance('Replace operation', async () => {
      const replaceInput = screen.getByPlaceholderText('Replace with...');
      await user.type(replaceInput, 'Sarah');
      await user.click(screen.getByText('Replace All'));
    });
    
    expect(replaceTime).toBeLessThan(500); // Replace should be reasonably fast
  });

  it('maintains performance with syntax highlighting', async () => {
    const codeContent = `
      function generateScene(context) {
        const characters = context.characters || [];
        const setting = context.setting || 'unknown';
        
        if (characters.length === 0) {
          throw new Error('No characters provided');
        }
        
        const mainCharacter = characters[0];
        const dialogue = generateDialogue(mainCharacter, setting);
        
        return {
          content: dialogue,
          wordCount: dialogue.split(' ').length,
          characters: characters.map(char => char.name)
        };
      }
    `.repeat(50); // Repeat to create larger content
    
    const file = {
      id: 'code-test',
      name: 'script.js',
      type: 'code',
      path: 'scripts/script.js',
      content: codeContent,
      lastModified: new Date().toISOString()
    };
    
    const renderTime = await measurePerformance('Syntax highlighting render', () => {
      render(
        <TestWrapper>
          <Editor projectId="test-project" />
        </TestWrapper>
      );
    });
    
    expect(renderTime).toBeLessThan(800); // Should handle syntax highlighting efficiently
  });

  it('efficiently handles collaborative editing updates', async () => {
    const file = {
      id: 'collab-test',
      name: 'collaborative-doc.txt',
      type: 'scene',
      path: 'chapter1/collaborative-scene.txt',
      content: 'Collaborative content',
      lastModified: new Date().toISOString()
    };
    
    const { rerender } = render(
      <TestWrapper>
        <Editor projectId="test-project" />
      </TestWrapper>
    );
    
    // Simulate collaborative updates
    const collaborativeUpdates = [
      'Collaborative content with first update',
      'Collaborative content with first update and second change',
      'Collaborative content with multiple updates from different users'
    ];
    
    const updateTimes = [];
    for (let i = 0; i < collaborativeUpdates.length; i++) {
      const updateTime = await measurePerformance(`Collaborative update ${i}`, () => {
        const updatedFile = { ...file, content: collaborativeUpdates[i] };
        rerender(
          <TestWrapper>
            <Editor projectId="test-project" />
          </TestWrapper>
        );
      });
      updateTimes.push(updateTime);
    }
    
    // All updates should be fast
    updateTimes.forEach(time => {
      expect(time).toBeLessThan(100);
    });
  });

  it('handles cursor movement efficiently in large documents', async () => {
    const largeContent = generateLargeDocument(20000); // 20k words
    
    const file = {
      id: 'cursor-test',
      name: 'cursor-test.txt',
      type: 'scene',
      path: 'chapter1/cursor-test.txt',
      content: largeContent,
      lastModified: new Date().toISOString()
    };
    
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Editor projectId="test-project" />
      </TestWrapper>
    );
    
    const editor = screen.getByRole('textbox');
    await user.click(editor);
    
    // Measure cursor movement performance
    const cursorMovementTime = await measurePerformance('Cursor movement', async () => {
      // Move cursor to end of document
      await user.keyboard('{Control>}{End}{/Control}');
      // Move cursor to beginning
      await user.keyboard('{Control>}{Home}{/Control}');
      // Move cursor word by word
      await user.keyboard('{Control>}{ArrowRight}{/Control}');
      await user.keyboard('{Control>}{ArrowRight}{/Control}');
      await user.keyboard('{Control>}{ArrowRight}{/Control}');
    });
    
    expect(cursorMovementTime).toBeLessThan(200); // Cursor movement should be fast
  });

  it('efficiently handles content formatting operations', async () => {
    const file = {
      id: 'format-test',
      name: 'format-test.txt',
      type: 'scene',
      path: 'chapter1/format-test.txt',
      content: 'This is a test document for formatting operations. It contains multiple paragraphs and various text elements.',
      lastModified: new Date().toISOString()
    };
    
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Editor projectId="test-project" />
      </TestWrapper>
    );
    
    const editor = screen.getByRole('textbox');
    await user.click(editor);
    
    // Select text
    await user.keyboard('{Control>}a{/Control}');
    
    // Measure formatting performance
    const formattingTime = await measurePerformance('Formatting operations', async () => {
      // Apply bold formatting
      await user.keyboard('{Control>}b{/Control}');
      // Apply italic formatting
      await user.keyboard('{Control>}i{/Control}');
      // Apply underline formatting
      await user.keyboard('{Control>}u{/Control}');
    });
    
    expect(formattingTime).toBeLessThan(150); // Formatting should be fast
  });

  it('maintains performance with auto-save functionality', async () => {
    const file = {
      id: 'autosave-test',
      name: 'autosave-test.txt',
      type: 'scene',
      path: 'chapter1/autosave-test.txt',
      content: 'Content for auto-save testing',
      lastModified: new Date().toISOString()
    };
    
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Editor projectId="test-project" />
      </TestWrapper>
    );
    
    const editor = screen.getByRole('textbox');
    await user.click(editor);
    
    // Measure typing performance with auto-save
    const typingWithAutoSaveTime = await measurePerformance('Typing with auto-save', async () => {
      await user.keyboard(' This is additional content that will trigger auto-save functionality.');
    });
    
    expect(typingWithAutoSaveTime).toBeLessThan(300); // Should handle auto-save without significant delay
  });

  it('handles concurrent editing operations efficiently', async () => {
    const file = {
      id: 'concurrent-test',
      name: 'concurrent-test.txt',
      type: 'scene',
      path: 'chapter1/concurrent-test.txt',
      content: 'Initial content for concurrent editing test',
      lastModified: new Date().toISOString()
    };
    
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Editor projectId="test-project" />
      </TestWrapper>
    );
    
    const editor = screen.getByRole('textbox');
    await user.click(editor);
    
    // Simulate concurrent operations
    const concurrentOpsTime = await measurePerformance('Concurrent operations', async () => {
      // Multiple simultaneous operations
      await Promise.all([
        user.keyboard(' First addition'),
        user.keyboard('{Control>}z{/Control}'), // Undo
        user.keyboard('{Control>}s{/Control}'), // Save
      ]);
    });
    
    expect(concurrentOpsTime).toBeLessThan(200); // Should handle concurrent operations efficiently
  });
});