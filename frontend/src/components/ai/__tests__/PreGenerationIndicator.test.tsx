import { render, screen, fireEvent } from '@testing-library/react';
import { PreGenerationIndicator } from '../PreGenerationIndicator';
import { usePreGeneration } from '../../../hooks/usePreGeneration';

// Mock the hook
jest.mock('../../../hooks/usePreGeneration');

const mockUsePreGeneration = usePreGeneration as jest.MockedFunction<typeof usePreGeneration>;

const mockPreGeneratedScenes = new Map([
  ['scene-1', {
    id: 'scene-1',
    title: 'Test Scene 1',
    content: 'Scene content...',
    summary: 'Scene summary',
    preview: 'Scene preview...',
    generatedAt: new Date(),
    scores: {
      plotAlignment: 0.8,
      characterConsistency: 0.75,
      contextRelevance: 0.85,
      overallQuality: 0.8,
      overall: 0.8
    }
  }],
  ['scene-2', {
    id: 'scene-2',
    title: 'Test Scene 2',
    content: 'Scene content 2...',
    summary: 'Scene summary 2',
    preview: 'Scene preview 2...',
    generatedAt: new Date(),
    scores: {
      plotAlignment: 0.9,
      characterConsistency: 0.85,
      contextRelevance: 0.8,
      overallQuality: 0.85,
      overall: 0.85
    }
  }]
]);

describe('PreGenerationIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when not enabled', () => {
    mockUsePreGeneration.mockReturnValue({
      preGenerated: new Map(),
      usePreGenerated: jest.fn(),
      isEnabled: false
    });

    const { container } = render(<PreGenerationIndicator />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not render when no scenes are pre-generated', () => {
    mockUsePreGeneration.mockReturnValue({
      preGenerated: new Map(),
      usePreGenerated: jest.fn(),
      isEnabled: true
    });

    const { container } = render(<PreGenerationIndicator />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders with correct scene count', () => {
    mockUsePreGeneration.mockReturnValue({
      preGenerated: mockPreGeneratedScenes,
      usePreGenerated: jest.fn(),
      isEnabled: true
    });

    render(<PreGenerationIndicator />);
    
    expect(screen.getByText('2 scenes ready')).toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
  });

  it('can toggle scene list visibility', () => {
    mockUsePreGeneration.mockReturnValue({
      preGenerated: mockPreGeneratedScenes,
      usePreGenerated: jest.fn(),
      isEnabled: true
    });

    render(<PreGenerationIndicator />);
    
    // Initially list should not be visible
    expect(screen.queryByText('Pre-Generated Scenes')).not.toBeInTheDocument();
    
    // Click view button
    fireEvent.click(screen.getByText('View'));
    
    // List should now be visible
    expect(screen.getByText('Pre-Generated Scenes')).toBeInTheDocument();
    expect(screen.getByText('Test Scene 1')).toBeInTheDocument();
    expect(screen.getByText('Test Scene 2')).toBeInTheDocument();
    
    // Button text should change
    expect(screen.getByText('Hide')).toBeInTheDocument();
    
    // Click hide button
    fireEvent.click(screen.getByText('Hide'));
    
    // List should be hidden again
    expect(screen.queryByText('Pre-Generated Scenes')).not.toBeInTheDocument();
  });
});