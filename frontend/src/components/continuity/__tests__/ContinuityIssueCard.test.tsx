import { render, screen, fireEvent } from '@/test-utils/render';
import { ContinuityIssueCard } from '../ContinuityIssueCard';
import { ContinuityIssue } from '../../../types/continuity';

describe('ContinuityIssueCard', () => {
  const mockOnSelect = jest.fn();
  const mockOnFix = jest.fn();

  const mockIssue: ContinuityIssue = {
    id: 'issue-1',
    type: 'character',
    severity: 'medium',
    description: 'Character John appears to be 25 in scene 1 but 30 in scene 3',
    affectedScenes: ['scene-1', 'scene-3'],
    quickFix: {
      id: 'fix-1',
      label: 'Update age consistently'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('displays issue information correctly', () => {
      render(
        <ContinuityIssueCard 
          issue={mockIssue} 
          onSelect={mockOnSelect} 
          onFix={mockOnFix} 
        />
      );

      expect(screen.getByText('character')).toBeInTheDocument();
      expect(screen.getByText('2 scenes affected')).toBeInTheDocument();
      expect(screen.getByText(mockIssue.description)).toBeInTheDocument();
    });

    it('applies correct severity styling', () => {
      const { rerender } = render(
        <ContinuityIssueCard 
          issue={{ ...mockIssue, severity: 'low' }} 
          onSelect={mockOnSelect} 
          onFix={mockOnFix} 
        />
      );

      let severityBadge = screen.getByText('character');
      expect(severityBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');

      rerender(
        <ContinuityIssueCard 
          issue={{ ...mockIssue, severity: 'high' }} 
          onSelect={mockOnSelect} 
          onFix={mockOnFix} 
        />
      );

      severityBadge = screen.getByText('character');
      expect(severityBadge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('shows affected scenes count', () => {
      render(
        <ContinuityIssueCard 
          issue={mockIssue} 
          onSelect={mockOnSelect} 
          onFix={mockOnFix} 
        />
      );

      expect(screen.getByText('2 scenes affected')).toBeInTheDocument();
    });
  });

  describe('Quick Fix', () => {
    it('displays quick fix button when available', () => {
      render(
        <ContinuityIssueCard 
          issue={mockIssue} 
          onSelect={mockOnSelect} 
          onFix={mockOnFix} 
        />
      );

      expect(screen.getByText('Quick Fix: Update age consistently')).toBeInTheDocument();
    });

    it('does not display quick fix button when not available', () => {
      const issueWithoutFix = { ...mockIssue, quickFix: undefined };
      
      render(
        <ContinuityIssueCard 
          issue={issueWithoutFix} 
          onSelect={mockOnSelect} 
          onFix={mockOnFix} 
        />
      );

      expect(screen.queryByText(/Quick Fix:/)).not.toBeInTheDocument();
    });

    it('calls onFix when quick fix button is clicked', () => {
      render(
        <ContinuityIssueCard 
          issue={mockIssue} 
          onSelect={mockOnSelect} 
          onFix={mockOnFix} 
        />
      );

      const quickFixButton = screen.getByText('Quick Fix: Update age consistently');
      fireEvent.click(quickFixButton);

      expect(mockOnFix).toHaveBeenCalledWith('fix-1');
      expect(mockOnSelect).not.toHaveBeenCalled(); // Should not trigger card selection
    });
  });

  describe('Card Interaction', () => {
    it('calls onSelect when card is clicked', () => {
      render(
        <ContinuityIssueCard 
          issue={mockIssue} 
          onSelect={mockOnSelect} 
          onFix={mockOnFix} 
        />
      );

      const card = screen.getByText(mockIssue.description).closest('.continuity-issue-card');
      fireEvent.click(card!);

      expect(mockOnSelect).toHaveBeenCalled();
    });

    it('has proper hover styling', () => {
      render(
        <ContinuityIssueCard 
          issue={mockIssue} 
          onSelect={mockOnSelect} 
          onFix={mockOnFix} 
        />
      );

      const card = screen.getByText(mockIssue.description).closest('.continuity-issue-card');
      expect(card).toHaveClass('hover:bg-gray-50', 'cursor-pointer');
    });
  });

  describe('Different Issue Types', () => {
    const issueTypes: Array<ContinuityIssue['type']> = ['character', 'setting', 'timeline', 'plot'];

    issueTypes.forEach(type => {
      it(`displays ${type} issue type correctly`, () => {
        render(
          <ContinuityIssueCard 
            issue={{ ...mockIssue, type }} 
            onSelect={mockOnSelect} 
            onFix={mockOnFix} 
          />
        );

        expect(screen.getByText(type)).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Scenes', () => {
    it('handles single scene correctly', () => {
      const singleSceneIssue = { 
        ...mockIssue, 
        affectedScenes: ['scene-1'] 
      };

      render(
        <ContinuityIssueCard 
          issue={singleSceneIssue} 
          onSelect={mockOnSelect} 
          onFix={mockOnFix} 
        />
      );

      expect(screen.getByText('1 scenes affected')).toBeInTheDocument();
    });

    it('handles many scenes correctly', () => {
      const manySceneIssue = { 
        ...mockIssue, 
        affectedScenes: ['scene-1', 'scene-2', 'scene-3', 'scene-4', 'scene-5'] 
      };

      render(
        <ContinuityIssueCard 
          issue={manySceneIssue} 
          onSelect={mockOnSelect} 
          onFix={mockOnFix} 
        />
      );

      expect(screen.getByText('5 scenes affected')).toBeInTheDocument();
    });
  });
});