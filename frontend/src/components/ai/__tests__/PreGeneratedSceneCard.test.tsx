import { render, screen, fireEvent } from '@/test-utils/render';
import { PreGeneratedSceneCard } from '../PreGeneratedSceneCard';
import { PreGeneratedScene } from '../../../types/preGeneration';

describe('PreGeneratedSceneCard', () => {
  const mockOnUse = jest.fn();
  const mockOnDiscard = jest.fn();

  const mockScene: PreGeneratedScene = {
    id: 'scene-1',
    title: 'The Discovery',
    content: 'Full scene content here...',
    summary: 'A short summary of the scene',
    preview: 'Preview text of the scene content that gives a taste of what the full scene contains.',
    generatedAt: new Date('2024-01-01T10:00:00Z'),
    scores: {
      plotAlignment: 0.85,
      characterConsistency: 0.92,
      contextRelevance: 0.78,
      overallQuality: 0.88,
      overall: 0.86
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('displays scene information correctly', () => {
      render(
        <PreGeneratedSceneCard 
          scene={mockScene} 
          onUse={mockOnUse} 
          onDiscard={mockOnDiscard} 
        />
      );

      expect(screen.getByText('The Discovery')).toBeInTheDocument();
      expect(screen.getByText('86% match')).toBeInTheDocument();
      expect(screen.getByText('A short summary of the scene')).toBeInTheDocument();
    });

    it('shows overall score as percentage', () => {
      render(
        <PreGeneratedSceneCard 
          scene={mockScene} 
          onUse={mockOnUse} 
          onDiscard={mockOnDiscard} 
        />
      );

      const scoreElement = screen.getByText('86% match');
      expect(scoreElement).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('displays action buttons', () => {
      render(
        <PreGeneratedSceneCard 
          scene={mockScene} 
          onUse={mockOnUse} 
          onDiscard={mockOnDiscard} 
        />
      );

      expect(screen.getByText('Use This Scene')).toBeInTheDocument();
      expect(screen.getByText('Discard')).toBeInTheDocument();
    });
  });

  describe('Expandable Content', () => {
    it('starts in collapsed state', () => {
      render(
        <PreGeneratedSceneCard 
          scene={mockScene} 
          onUse={mockOnUse} 
          onDiscard={mockOnDiscard} 
        />
      );

      expect(screen.getByText('Show More')).toBeInTheDocument();
      expect(screen.queryByText('Show Less')).not.toBeInTheDocument();
      expect(screen.queryByText('Preview text of the scene')).not.toBeInTheDocument();
    });

    it('expands when Show More is clicked', () => {
      render(
        <PreGeneratedSceneCard 
          scene={mockScene} 
          onUse={mockOnUse} 
          onDiscard={mockOnDiscard} 
        />
      );

      const showMoreButton = screen.getByText('Show More');
      fireEvent.click(showMoreButton);

      expect(screen.getByText('Show Less')).toBeInTheDocument();
      expect(screen.queryByText('Show More')).not.toBeInTheDocument();
      expect(screen.getByText(/Preview text of the scene/)).toBeInTheDocument();
    });

    it('collapses when Show Less is clicked', () => {
      render(
        <PreGeneratedSceneCard 
          scene={mockScene} 
          onUse={mockOnUse} 
          onDiscard={mockOnDiscard} 
        />
      );

      // First expand
      fireEvent.click(screen.getByText('Show More'));
      
      // Then collapse
      fireEvent.click(screen.getByText('Show Less'));

      expect(screen.getByText('Show More')).toBeInTheDocument();
      expect(screen.queryByText('Show Less')).not.toBeInTheDocument();
      expect(screen.queryByText(/Preview text of the scene/)).not.toBeInTheDocument();
    });
  });

  describe('Detailed Scores', () => {
    it('shows detailed scores when expanded', () => {
      render(
        <PreGeneratedSceneCard 
          scene={mockScene} 
          onUse={mockOnUse} 
          onDiscard={mockOnDiscard} 
        />
      );

      fireEvent.click(screen.getByText('Show More'));

      expect(screen.getByText('Plot:')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Characters:')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('Context:')).toBeInTheDocument();
      expect(screen.getByText('78%')).toBeInTheDocument();
    });

    it('does not show detailed scores when collapsed', () => {
      render(
        <PreGeneratedSceneCard 
          scene={mockScene} 
          onUse={mockOnUse} 
          onDiscard={mockOnDiscard} 
        />
      );

      expect(screen.queryByText('Plot:')).not.toBeInTheDocument();
      expect(screen.queryByText('Characters:')).not.toBeInTheDocument();
      expect(screen.queryByText('Context:')).not.toBeInTheDocument();
    });
  });

  describe('Action Handlers', () => {
    it('calls onUse when Use This Scene button is clicked', () => {
      render(
        <PreGeneratedSceneCard 
          scene={mockScene} 
          onUse={mockOnUse} 
          onDiscard={mockOnDiscard} 
        />
      );

      fireEvent.click(screen.getByText('Use This Scene'));

      expect(mockOnUse).toHaveBeenCalledTimes(1);
      expect(mockOnDiscard).not.toHaveBeenCalled();
    });

    it('calls onDiscard when Discard button is clicked', () => {
      render(
        <PreGeneratedSceneCard 
          scene={mockScene} 
          onUse={mockOnUse} 
          onDiscard={mockOnDiscard} 
        />
      );

      fireEvent.click(screen.getByText('Discard'));

      expect(mockOnDiscard).toHaveBeenCalledTimes(1);
      expect(mockOnUse).not.toHaveBeenCalled();
    });
  });

  describe('Score Variations', () => {
    it('handles low scores correctly', () => {
      const lowScoreScene = {
        ...mockScene,
        scores: {
          ...mockScene.scores,
          overall: 0.45
        }
      };

      render(
        <PreGeneratedSceneCard 
          scene={lowScoreScene} 
          onUse={mockOnUse} 
          onDiscard={mockOnDiscard} 
        />
      );

      expect(screen.getByText('45% match')).toBeInTheDocument();
    });

    it('handles perfect scores correctly', () => {
      const perfectScoreScene = {
        ...mockScene,
        scores: {
          plotAlignment: 1.0,
          characterConsistency: 1.0,
          contextRelevance: 1.0,
          overallQuality: 1.0,
          overall: 1.0
        }
      };

      render(
        <PreGeneratedSceneCard 
          scene={perfectScoreScene} 
          onUse={mockOnUse} 
          onDiscard={mockOnDiscard} 
        />
      );

      expect(screen.getByText('100% match')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Show More'));
      expect(screen.getAllByText('100%')).toHaveLength(3); // Plot, Characters, Context
    });
  });

  describe('Preview Content', () => {
    it('displays preview content in scrollable area when expanded', () => {
      render(
        <PreGeneratedSceneCard 
          scene={mockScene} 
          onUse={mockOnUse} 
          onDiscard={mockOnDiscard} 
        />
      );

      fireEvent.click(screen.getByText('Show More'));

      const previewArea = screen.getByText(/Preview text of the scene/).closest('.scene-preview');
      expect(previewArea).toBeInTheDocument();
      
      const scrollableArea = previewArea?.querySelector('.max-h-48.overflow-y-auto');
      expect(scrollableArea).toBeInTheDocument();
    });
  });

  describe('CSS Classes and Styling', () => {
    it('applies correct CSS classes', () => {
      render(
        <PreGeneratedSceneCard 
          scene={mockScene} 
          onUse={mockOnUse} 
          onDiscard={mockOnDiscard} 
        />
      );

      const card = screen.getByText('The Discovery').closest('.pre-generated-scene-card');
      expect(card).toHaveClass('bg-white', 'border', 'rounded-lg', 'p-4');
    });

    it('applies hover states to buttons', () => {
      render(
        <PreGeneratedSceneCard 
          scene={mockScene} 
          onUse={mockOnUse} 
          onDiscard={mockOnDiscard} 
        />
      );

      const useButton = screen.getByText('Use This Scene');
      const discardButton = screen.getByText('Discard');

      expect(useButton).toHaveClass('hover:bg-blue-700');
      expect(discardButton).toHaveClass('hover:bg-gray-50');
    });
  });
});