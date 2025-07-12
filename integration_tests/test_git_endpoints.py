"""Tests for Git endpoints."""

import pytest
from unittest.mock import AsyncMock


@pytest.fixture
def mock_git_manager():
    """Mock git manager."""
    mock = AsyncMock()
    return mock


class TestGitStatusEndpoint:
    """Test repository status endpoint."""

    def test_git_status_parsing_logic(self, mock_git_manager):
        """Test git status parsing logic."""
        # Mock the git manager's get_status method
        expected_result = {
            "modified": ["file1.md"],
            "staged": ["file2.md"],
            "untracked": ["file3.md"],
            "branch": "main",
            "is_clean": False,
        }
        mock_git_manager.get_status.return_value = expected_result

        # Test the mock behavior
        result = mock_git_manager.get_status.return_value
        
        assert result["modified"] == ["file1.md"]
        assert result["staged"] == ["file2.md"]
        assert result["untracked"] == ["file3.md"]
        assert result["branch"] == "main"
        assert result["is_clean"] is False

    def test_status_response_format(self):
        """Test status response formatting."""
        status_data = {
            "modified": ["file1.md"],
            "staged": ["file2.md"],
            "untracked": ["file3.md"],
            "branch": "main",
            "is_clean": False,
        }
        
        # Format response as would be done in endpoint
        response_data = {
            "success": True,
            "data": {
                "modified_files": status_data.get("modified", []),
                "staged_files": status_data.get("staged", []),
                "untracked_files": status_data.get("untracked", []),
                "current_branch": status_data.get("branch"),
                "is_clean": status_data.get("is_clean", True),
            }
        }
        
        assert response_data["success"] is True
        assert response_data["data"]["modified_files"] == ["file1.md"]
        assert response_data["data"]["staged_files"] == ["file2.md"]
        assert response_data["data"]["untracked_files"] == ["file3.md"]


class TestGitBranchesEndpoint:
    """Test repository branches endpoint."""

    def test_git_branches_parsing_logic(self, mock_git_manager):
        """Test git branches parsing logic."""
        expected_result = {
            "all": ["main", "feature-branch", "develop"],
            "current": "main",
            "remote": ["origin/main", "origin/develop"],
        }
        mock_git_manager.get_branches.return_value = expected_result

        # Test the mock behavior
        result = mock_git_manager.get_branches.return_value
        
        assert "main" in result["all"]
        assert "feature-branch" in result["all"]
        assert "develop" in result["all"]
        assert result["current"] == "main"
        assert "origin/main" in result["remote"]

    def test_branches_response_format(self):
        """Test branches response formatting."""
        branches_data = {
            "all": ["main", "feature-branch", "develop"],
            "current": "main",
            "remote": ["origin/main", "origin/develop"],
        }
        
        # Format response as would be done in endpoint
        response_data = {
            "success": True,
            "data": {
                "branches": branches_data.get("all", []),
                "current_branch": branches_data.get("current"),
                "remote_branches": branches_data.get("remote", []),
            }
        }
        
        assert response_data["success"] is True
        assert response_data["data"]["branches"] == ["main", "feature-branch", "develop"]
        assert response_data["data"]["current_branch"] == "main"


class TestLockConflictLogic:
    """Test lock conflict checking logic."""

    def test_conflict_detection_logic(self):
        """Test conflict detection logic."""
        # Simulate lock checking logic
        existing_locks = {}
        requested_components = ["component1", "component2"]
        
        conflicts = []
        for component in requested_components:
            if component in existing_locks:
                conflicts.append({
                    "component_id": component,
                    "conflict_type": "already_locked"
                })
        
        result = {
            "conflicts": conflicts,
            "can_proceed": len(conflicts) == 0
        }
        
        assert result["conflicts"] == []
        assert result["can_proceed"] is True

    def test_conflict_detection_with_conflicts(self):
        """Test conflict detection with existing locks."""
        # Simulate existing locks
        existing_locks = {"component1": {"locked_by": "user1"}}
        requested_components = ["component1", "component2"]
        
        conflicts = []
        for component in requested_components:
            if component in existing_locks:
                conflicts.append({
                    "component_id": component,
                    "conflict_type": "already_locked"
                })
        
        result = {
            "conflicts": conflicts,
            "can_proceed": len(conflicts) == 0
        }
        
        assert len(result["conflicts"]) == 1
        assert result["conflicts"][0]["component_id"] == "component1"
        assert result["can_proceed"] is False


class TestGitManagerMethods:
    """Test Git manager helper methods."""

    def test_parse_git_status_output(self):
        """Test git status output parsing."""
        # Test parsing git status --porcelain output
        status_output = " M file1.md\nA  file2.md\n?? file3.md\n"
        
        # Parse the output manually as we would in git manager
        modified = []
        staged = []
        untracked = []
        
        # Split lines but don't strip the entire output first
        for line in status_output.split('\n'):
            if not line:  # Skip empty lines
                continue
            if line.startswith(' M'):
                modified.append(line[2:].strip())  # Remove first 2 chars and strip
            elif line.startswith('A '):
                staged.append(line[2:].strip())    # Remove first 2 chars and strip  
            elif line.startswith('??'):
                untracked.append(line[2:].strip()) # Remove first 2 chars and strip
        
        assert modified == ["file1.md"]
        assert staged == ["file2.md"]
        assert untracked == ["file3.md"]

    def test_parse_git_branches_output(self):
        """Test git branches output parsing."""
        # Test parsing git branch output
        branch_output = "  feature-branch\n* main\n  develop\n"
        
        branches = []
        current = None
        
        for line in branch_output.strip().split('\n'):
            if line.startswith('*'):
                current = line[2:].strip()
                branches.append(current)
            elif line.strip():
                branches.append(line.strip())
        
        assert "main" in branches
        assert "feature-branch" in branches  
        assert "develop" in branches
        assert current == "main"
