import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContinuityPanel } from '../ContinuityPanel';
import { useContinuityCheck } from '../../../hooks/useContinuityCheck';
import { ContinuityIssue } from '../../../types/continuity';

// Mock the hook
jest.mock('../../../hooks/useContinuityCheck');

const mockUseContinuityCheck = useContinuityCheck as jest.MockedFunction<typeof useContinuityCheck>;

const mockIssues: ContinuityIssue[] = [
  {
    id: 'issue-1',
    type: 'character',
    severity: 'high',
    description: 'Character inconsistency detected',
    affectedScenes: ['scene-1', 'scene-2'],
    quickFix: {
      id: 'fix-1',
      label: 'Update character description'
    }
  },
  {
    id: 'issue-2',
    type: 'timeline',
    severity: 'medium',
    description: 'Timeline mismatch',
    affectedScenes: ['scene-3']
  }
];

describe('ContinuityPanel', () => {
  const mockFixIssue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state when checking', () => {
    mockUseContinuityCheck.mockReturnValue({
      issues: [],
      checking: true,
      fixIssue: mockFixIssue
    });

    render(<ContinuityPanel sceneId="test-scene" />);
    
    expect(screen.getByText('Checking continuity...')).toBeInTheDocument();
  });

  it('shows no issues message when no issues found', () => {
    mockUseContinuityCheck.mockReturnValue({
      issues: [],
      checking: false,
      fixIssue: mockFixIssue
    });

    render(<ContinuityPanel sceneId="test-scene" />);
    
    expect(screen.getByText('No continuity issues found')).toBeInTheDocument();
  });

  it('displays issues when found', () => {
    mockUseContinuityCheck.mockReturnValue({
      issues: mockIssues,
      checking: false,
      fixIssue: mockFixIssue
    });

    render(<ContinuityPanel sceneId="test-scene" />);
    
    expect(screen.getByText('Continuity Issues')).toBeInTheDocument();
    expect(screen.getByText('Character inconsistency detected')).toBeInTheDocument();
    expect(screen.getByText('Timeline mismatch')).toBeInTheDocument();
  });

  it('can select an issue to show fix panel', async () => {
    mockUseContinuityCheck.mockReturnValue({
      issues: mockIssues,
      checking: false,
      fixIssue: mockFixIssue
    });

    render(<ContinuityPanel sceneId="test-scene" />);
    
    const issueCard = screen.getByText('Character inconsistency detected').closest('.continuity-issue-card');
    fireEvent.click(issueCard!);
    
    await waitFor(() => {
      expect(screen.getByText('Fix Issue: character')).toBeInTheDocument();
    });
  });

  it('can apply quick fix', async () => {
    mockUseContinuityCheck.mockReturnValue({
      issues: mockIssues,
      checking: false,
      fixIssue: mockFixIssue
    });

    render(<ContinuityPanel sceneId="test-scene" />);
    
    const quickFixButton = screen.getByText('Quick Fix: Update character description');
    fireEvent.click(quickFixButton);
    
    expect(mockFixIssue).toHaveBeenCalledWith('issue-1', 'fix-1');
  });

  it('can close fix panel', async () => {
    mockUseContinuityCheck.mockReturnValue({
      issues: mockIssues,
      checking: false,
      fixIssue: mockFixIssue
    });

    render(<ContinuityPanel sceneId="test-scene" />);
    
    // Select an issue
    const issueCard = screen.getByText('Character inconsistency detected').closest('.continuity-issue-card');
    fireEvent.click(issueCard!);
    
    await waitFor(() => {
      expect(screen.getByText('Fix Issue: character')).toBeInTheDocument();
    });
    
    // Close the fix panel
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Fix Issue: character')).not.toBeInTheDocument();
    });
  });
});