"""
Comprehensive project management tests for FastAPI BFF service.

This module tests project CRUD operations, permissions, state management,
collaboration features, and edge cases to ensure robust project handling.
"""

import time
from datetime import datetime, timezone
from typing import Any, Dict, List

import pytest
from fastapi.testclient import TestClient


class ProjectTestHelpers:
    """Helper functions for project testing."""

    @staticmethod
    def create_sample_project_data(
        name: str = "Test Project",
        description: str = "A test project for testing",
        visibility: str = "private",
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Create sample project data for testing."""
        return {
            "name": name,
            "description": description,
            "visibility": visibility,
            "metadata": metadata or {"tags": ["test"], "category": "fiction"}
        }

    @staticmethod
    def create_mock_user(user_id: str, username: str, email: str) -> Dict[str, Any]:
        """Create a mock user for testing."""
        return {
            "id": user_id,
            "username": username,
            "email": email,
            "roles": ["user"],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

    @staticmethod
    def create_auth_headers_for_user(user: Dict[str, Any]) -> Dict[str, str]:
        """Create authentication headers for a specific user."""
        from jose import jwt
        from datetime import timedelta
        import os
        
        JWT_SECRET = os.getenv("JWT_SECRET", "test-secret-key")
        JWT_ALGORITHM = "HS256"
        JWT_EXPIRATION_MINUTES = 30
        
        expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRATION_MINUTES)
        payload = {
            "sub": user["id"],
            "username": user["username"],
            "email": user["email"],
            "roles": user["roles"],
            "exp": expire,
            "iat": datetime.now(timezone.utc)
        }
        
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return {"Authorization": f"Bearer {token}"}

    @staticmethod
    def cleanup_projects(
        test_client: TestClient,
        auth_headers: Dict[str, str],
        project_ids: List[str]
    ) -> None:
        """Clean up test projects."""
        for project_id in project_ids:
            try:
                test_client.delete(f"/api/projects/{project_id}", headers=auth_headers)
            except Exception:
                pass  # Ignore cleanup errors


class TestProjectCRUDOperations:
    """Test suite for project CRUD (Create, Read, Update, Delete) operations."""

    @pytest.mark.unit
    def test_list_empty_projects(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ) -> None:
        """
        Test listing projects when user has no projects.
        
        This test verifies that the projects listing endpoint returns
        an empty result for users without any projects.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
        """
        response = test_client.get("/api/projects", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "projects" in data
        assert "total" in data
        assert "limit" in data
        assert "offset" in data
        assert data["projects"] == []
        assert data["total"] == 0
        assert data["limit"] == 50  # Default limit
        assert data["offset"] == 0

    @pytest.mark.unit
    def test_create_project_with_valid_data(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ) -> None:
        """
        Test creating a project with valid data.
        
        This test verifies that valid project creation requests work correctly
        and return the expected response structure.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
        """
        project_data = ProjectTestHelpers.create_sample_project_data(
            name="My New Project",
            description="Testing project creation",
            visibility="private"
        )
        
        response = test_client.post("/api/projects", json=project_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "project" in data
        
        project = data["project"]
        assert project["name"] == "My New Project"
        assert project["description"] == "Testing project creation"
        assert project["status"] == "draft"  # Default status
        assert project["visibility"] == "private"
        assert "id" in project
        assert "owner_id" in project
        assert "created_at" in project
        assert "updated_at" in project
        
        # Cleanup
        ProjectTestHelpers.cleanup_projects(test_client, auth_headers, [project["id"]])

    @pytest.mark.unit
    def test_get_project_details(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ) -> None:
        """
        Test retrieving project details.
        
        This test verifies that project details can be retrieved correctly
        with all expected fields and collaborator information.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
        """
        # Create a test project first
        project_data = ProjectTestHelpers.create_sample_project_data(name="Detail Test Project")
        create_response = test_client.post("/api/projects", json=project_data, headers=auth_headers)
        project_id = create_response.json()["project"]["id"]
        
        try:
            # Get project details
            response = test_client.get(f"/api/projects/{project_id}", headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            
            assert "project" in data
            project = data["project"]
            
            # Verify all expected fields
            assert project["id"] == project_id
            assert project["name"] == "Detail Test Project"
            assert "collaborators" in project
            assert "user_role" in project
            assert project["user_role"] == "owner"
            assert isinstance(project["collaborators"], list)
            
        finally:
            # Cleanup
            ProjectTestHelpers.cleanup_projects(test_client, auth_headers, [project_id])

    @pytest.mark.unit
    def test_update_project(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ) -> None:
        """
        Test updating project information.
        
        This test verifies that project updates work correctly and
        the updated_at timestamp is properly maintained.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
        """
        # Create a test project first
        project_data = ProjectTestHelpers.create_sample_project_data(name="Update Test")
        create_response = test_client.post("/api/projects", json=project_data, headers=auth_headers)
        project_id = create_response.json()["project"]["id"]
        original_updated_at = create_response.json()["project"]["updated_at"]
        
        try:
            # Wait a moment to ensure timestamp difference
            time.sleep(0.1)
            
            # Update the project
            update_data = {
                "name": "Updated Project Name",
                "description": "Updated description",
                "status": "active",
                "metadata": {"new_field": "new_value"}
            }
            
            response = test_client.put(f"/api/projects/{project_id}", json=update_data, headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["success"] is True
            project = data["project"]
            
            # Verify updates
            assert project["name"] == "Updated Project Name"
            assert project["description"] == "Updated description"
            assert project["status"] == "active"
            assert project["metadata"]["new_field"] == "new_value"
            assert project["updated_at"] != original_updated_at  # Timestamp should be updated
            
        finally:
            # Cleanup
            ProjectTestHelpers.cleanup_projects(test_client, auth_headers, [project_id])

    @pytest.mark.unit
    def test_delete_project(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ) -> None:
        """
        Test deleting a project.
        
        This test verifies that project deletion works correctly and
        cleans up associated data (locks, conflicts, etc.).
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
        """
        # Create a test project first
        project_data = ProjectTestHelpers.create_sample_project_data(name="Delete Test")
        create_response = test_client.post("/api/projects", json=project_data, headers=auth_headers)
        project_id = create_response.json()["project"]["id"]
        
        # Create some associated data (locks)
        lock_data = {
            "id": f"lock_test_{int(time.time())}",
            "componentId": "test_component",
            "level": "soft",
            "type": "personal",
            "reason": "Testing cascading delete",
            "lockedBy": "test-user-123",
            "lockedAt": datetime.now(timezone.utc).isoformat(),
            "sharedWith": [],
            "canOverride": True
        }
        
        test_client.put(
            f"/api/projects/{project_id}/locks/test_component",
            json=lock_data,
            headers=auth_headers
        )
        
        # Delete the project
        response = test_client.delete(f"/api/projects/{project_id}", headers=auth_headers)
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        
        # Verify project is deleted
        get_response = test_client.get(f"/api/projects/{project_id}", headers=auth_headers)
        assert get_response.status_code == 404
        
        # Verify associated locks are cleaned up
        locks_response = test_client.get(f"/api/projects/{project_id}/locks", headers=auth_headers)
        # Should return 404 or empty locks since project is deleted
        assert locks_response.status_code in [404, 200]

    @pytest.mark.unit
    @pytest.mark.parametrize("visibility", ["private", "public"])
    def test_create_projects_with_different_visibility(
        self, test_client: TestClient, auth_headers: Dict[str, str], visibility: str
    ) -> None:
        """
        Test creating projects with different visibility levels.
        
        This parametrized test verifies that both private and public
        projects can be created successfully.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
            visibility: The visibility level to test
        """
        project_data = ProjectTestHelpers.create_sample_project_data(
            name=f"Visibility Test {visibility}",
            visibility=visibility
        )
        
        response = test_client.post("/api/projects", json=project_data, headers=auth_headers)
        
        assert response.status_code == 200
        project = response.json()["project"]
        assert project["visibility"] == visibility
        
        # Cleanup
        ProjectTestHelpers.cleanup_projects(test_client, auth_headers, [project["id"]])


class TestProjectPermissions:
    """Test suite for project permission and access control."""

    @pytest.mark.unit
    def test_owner_can_perform_all_operations(
        self, test_client: TestClient
    ) -> None:
        """
        Test that project owner can perform all operations.
        
        This test verifies that the project owner has full access
        to create, read, update, delete, and manage collaborators.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
        """
        # Create owner user
        owner = ProjectTestHelpers.create_mock_user("owner-123", "owner", "owner@example.com")
        owner_headers = ProjectTestHelpers.create_auth_headers_for_user(owner)
        
        # Create project
        project_data = ProjectTestHelpers.create_sample_project_data(name="Owner Test Project")
        create_response = test_client.post("/api/projects", json=project_data, headers=owner_headers)
        project_id = create_response.json()["project"]["id"]
        
        try:
            # Test read access
            response = test_client.get(f"/api/projects/{project_id}", headers=owner_headers)
            assert response.status_code == 200
            assert response.json()["project"]["user_role"] == "owner"
            
            # Test update access
            update_data = {"name": "Updated by Owner"}
            response = test_client.put(f"/api/projects/{project_id}", json=update_data, headers=owner_headers)
            assert response.status_code == 200
            
            # Test collaborator management
            collaborator_data = {"user_id": "collab-456", "role": "collaborator"}
            response = test_client.post(f"/api/projects/{project_id}/collaborators", json=collaborator_data, headers=owner_headers)
            assert response.status_code == 200
            
            # Test list collaborators
            response = test_client.get(f"/api/projects/{project_id}/collaborators", headers=owner_headers)
            assert response.status_code == 200
            
        finally:
            # Cleanup
            ProjectTestHelpers.cleanup_projects(test_client, owner_headers, [project_id])

    @pytest.mark.unit
    def test_collaborator_has_limited_access(
        self, test_client: TestClient
    ) -> None:
        """
        Test that collaborators have limited access to projects.
        
        This test verifies that collaborators can read project details
        but cannot update the project or manage other collaborators.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
        """
        # Create owner and collaborator users
        owner = ProjectTestHelpers.create_mock_user("owner-123", "owner", "owner@example.com")
        collaborator = ProjectTestHelpers.create_mock_user("collab-456", "collaborator", "collab@example.com")
        
        owner_headers = ProjectTestHelpers.create_auth_headers_for_user(owner)
        collab_headers = ProjectTestHelpers.create_auth_headers_for_user(collaborator)
        
        # Create project as owner
        project_data = ProjectTestHelpers.create_sample_project_data(name="Collaboration Test")
        create_response = test_client.post("/api/projects", json=project_data, headers=owner_headers)
        project_id = create_response.json()["project"]["id"]
        
        try:
            # Add collaborator
            collaborator_data = {"user_id": collaborator["id"], "role": "collaborator"}
            response = test_client.post(f"/api/projects/{project_id}/collaborators", json=collaborator_data, headers=owner_headers)
            assert response.status_code == 200
            
            # Test collaborator can read project
            response = test_client.get(f"/api/projects/{project_id}", headers=collab_headers)
            assert response.status_code == 200
            assert response.json()["project"]["user_role"] == "collaborator"
            
            # Test collaborator can list collaborators
            response = test_client.get(f"/api/projects/{project_id}/collaborators", headers=collab_headers)
            assert response.status_code == 200
            
            # Test collaborator cannot update project
            update_data = {"name": "Unauthorized Update"}
            response = test_client.put(f"/api/projects/{project_id}", json=update_data, headers=collab_headers)
            assert response.status_code == 403
            
            # Test collaborator cannot add other collaborators
            new_collab_data = {"user_id": "another-789", "role": "collaborator"}
            response = test_client.post(f"/api/projects/{project_id}/collaborators", json=new_collab_data, headers=collab_headers)
            assert response.status_code == 403
            
            # Test collaborator cannot delete project
            response = test_client.delete(f"/api/projects/{project_id}", headers=collab_headers)
            assert response.status_code == 403
            
        finally:
            # Cleanup
            ProjectTestHelpers.cleanup_projects(test_client, owner_headers, [project_id])

    @pytest.mark.unit
    def test_non_member_has_no_access_to_private_project(
        self, test_client: TestClient
    ) -> None:
        """
        Test that non-members have no access to private projects.
        
        This test verifies that users who are not owners or collaborators
        cannot access private projects.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
        """
        # Create owner and non-member users
        owner = ProjectTestHelpers.create_mock_user("owner-123", "owner", "owner@example.com")
        non_member = ProjectTestHelpers.create_mock_user("outsider-789", "outsider", "outsider@example.com")
        
        owner_headers = ProjectTestHelpers.create_auth_headers_for_user(owner)
        outsider_headers = ProjectTestHelpers.create_auth_headers_for_user(non_member)
        
        # Create private project as owner
        project_data = ProjectTestHelpers.create_sample_project_data(
            name="Private Project",
            visibility="private"
        )
        create_response = test_client.post("/api/projects", json=project_data, headers=owner_headers)
        project_id = create_response.json()["project"]["id"]
        
        try:
            # Test non-member cannot access private project
            response = test_client.get(f"/api/projects/{project_id}", headers=outsider_headers)
            assert response.status_code == 403
            
            # Test non-member cannot update private project
            update_data = {"name": "Unauthorized Update"}
            response = test_client.put(f"/api/projects/{project_id}", json=update_data, headers=outsider_headers)
            assert response.status_code == 403
            
            # Test non-member cannot delete private project
            response = test_client.delete(f"/api/projects/{project_id}", headers=outsider_headers)
            assert response.status_code == 403
            
            # Test non-member cannot access collaborators
            response = test_client.get(f"/api/projects/{project_id}/collaborators", headers=outsider_headers)
            assert response.status_code == 403
            
        finally:
            # Cleanup
            ProjectTestHelpers.cleanup_projects(test_client, owner_headers, [project_id])

    @pytest.mark.unit
    def test_public_project_visibility(
        self, test_client: TestClient
    ) -> None:
        """
        Test that public projects are visible to non-members.
        
        This test verifies that public projects can be read by anyone
        but still restrict write operations to owners and collaborators.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
        """
        # Create owner and non-member users
        owner = ProjectTestHelpers.create_mock_user("owner-123", "owner", "owner@example.com")
        viewer = ProjectTestHelpers.create_mock_user("viewer-789", "viewer", "viewer@example.com")
        
        owner_headers = ProjectTestHelpers.create_auth_headers_for_user(owner)
        viewer_headers = ProjectTestHelpers.create_auth_headers_for_user(viewer)
        
        # Create public project as owner
        project_data = ProjectTestHelpers.create_sample_project_data(
            name="Public Project",
            visibility="public"
        )
        create_response = test_client.post("/api/projects", json=project_data, headers=owner_headers)
        project_id = create_response.json()["project"]["id"]
        
        try:
            # Test viewer can access public project
            response = test_client.get(f"/api/projects/{project_id}", headers=viewer_headers)
            assert response.status_code == 200
            assert response.json()["project"]["user_role"] == "viewer"
            assert response.json()["project"]["visibility"] == "public"
            
            # Test viewer still cannot update public project
            update_data = {"name": "Unauthorized Update"}
            response = test_client.put(f"/api/projects/{project_id}", json=update_data, headers=viewer_headers)
            assert response.status_code == 403
            
            # Test viewer cannot delete public project
            response = test_client.delete(f"/api/projects/{project_id}", headers=viewer_headers)
            assert response.status_code == 403
            
        finally:
            # Cleanup
            ProjectTestHelpers.cleanup_projects(test_client, owner_headers, [project_id])


class TestProjectStateManagement:
    """Test suite for project status transitions and state management."""

    @pytest.mark.unit
    @pytest.mark.parametrize("status", ["draft", "active", "archived"])
    def test_project_status_transitions(
        self, test_client: TestClient, auth_headers: Dict[str, str], status: str
    ) -> None:
        """
        Test project status transitions.
        
        This parametrized test verifies that projects can be transitioned
        through different status states correctly.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
            status: The target status to test
        """
        # Create project (starts as draft)
        project_data = ProjectTestHelpers.create_sample_project_data(name=f"Status {status} Test")
        create_response = test_client.post("/api/projects", json=project_data, headers=auth_headers)
        project_id = create_response.json()["project"]["id"]
        
        try:
            # Update to target status
            update_data = {"status": status}
            response = test_client.put(f"/api/projects/{project_id}", json=update_data, headers=auth_headers)
            
            assert response.status_code == 200
            project = response.json()["project"]
            assert project["status"] == status
            
            # Verify the status persists when retrieving project
            get_response = test_client.get(f"/api/projects/{project_id}", headers=auth_headers)
            assert get_response.status_code == 200
            assert get_response.json()["project"]["status"] == status
            
        finally:
            # Cleanup
            ProjectTestHelpers.cleanup_projects(test_client, auth_headers, [project_id])

    @pytest.mark.unit
    def test_project_metadata_updates(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ) -> None:
        """
        Test project metadata management.
        
        This test verifies that project metadata can be updated
        and persists correctly.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
        """
        # Create project with initial metadata
        initial_metadata = {"category": "fiction", "tags": ["fantasy", "adventure"]}
        project_data = ProjectTestHelpers.create_sample_project_data(
            name="Metadata Test",
            metadata=initial_metadata
        )
        create_response = test_client.post("/api/projects", json=project_data, headers=auth_headers)
        project_id = create_response.json()["project"]["id"]
        
        try:
            # Update metadata
            updated_metadata = {
                "category": "science-fiction",
                "tags": ["sci-fi", "space", "adventure"],
                "word_count": 50000,
                "target_audience": "young-adult"
            }
            
            update_data = {"metadata": updated_metadata}
            response = test_client.put(f"/api/projects/{project_id}", json=update_data, headers=auth_headers)
            
            assert response.status_code == 200
            project = response.json()["project"]
            
            # Verify metadata updates
            assert project["metadata"]["category"] == "science-fiction"
            assert "space" in project["metadata"]["tags"]
            assert project["metadata"]["word_count"] == 50000
            assert project["metadata"]["target_audience"] == "young-adult"
            
        finally:
            # Cleanup
            ProjectTestHelpers.cleanup_projects(test_client, auth_headers, [project_id])

    @pytest.mark.unit
    def test_cascading_delete_cleanup(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ) -> None:
        """
        Test that project deletion properly cleans up related data.
        
        This test verifies that when a project is deleted, all associated
        data (locks, conflicts, history, collaborators) is properly cleaned up.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
        """
        # Create project
        project_data = ProjectTestHelpers.create_sample_project_data(name="Cleanup Test")
        create_response = test_client.post("/api/projects", json=project_data, headers=auth_headers)
        project_id = create_response.json()["project"]["id"]
        
        # Add collaborator
        collaborator_data = {"user_id": "collab-cleanup", "role": "collaborator"}
        test_client.post(f"/api/projects/{project_id}/collaborators", json=collaborator_data, headers=auth_headers)
        
        # Create locks
        lock_data = {
            "id": f"cleanup_lock_{int(time.time())}",
            "componentId": "cleanup_component",
            "level": "soft",
            "type": "personal",
            "reason": "Testing cleanup",
            "lockedBy": "test-user-123",
            "lockedAt": datetime.now(timezone.utc).isoformat(),
            "sharedWith": [],
            "canOverride": True
        }
        test_client.put(f"/api/projects/{project_id}/locks/cleanup_component", json=lock_data, headers=auth_headers)
        
        # Verify data exists before deletion
        locks_response = test_client.get(f"/api/projects/{project_id}/locks", headers=auth_headers)
        assert locks_response.status_code == 200
        assert len(locks_response.json()["locks"]) > 0
        
        collaborators_response = test_client.get(f"/api/projects/{project_id}/collaborators", headers=auth_headers)
        assert collaborators_response.status_code == 200
        assert len(collaborators_response.json()["collaborators"]) > 0
        
        # Delete project
        delete_response = test_client.delete(f"/api/projects/{project_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        
        # Verify project is gone
        get_response = test_client.get(f"/api/projects/{project_id}", headers=auth_headers)
        assert get_response.status_code == 404
        
        # Verify related data is cleaned up
        locks_after = test_client.get(f"/api/projects/{project_id}/locks", headers=auth_headers)
        # Should return 404 or empty locks
        assert locks_after.status_code in [404, 200]
        if locks_after.status_code == 200:
            assert len(locks_after.json()["locks"]) == 0

    @pytest.mark.unit
    def test_project_limits_per_user(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ) -> None:
        """
        Test project creation limits per user.
        
        This test verifies that users cannot exceed the maximum
        number of projects allowed (10 for testing).
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
        """
        created_projects = []
        
        try:
            # Create projects up to the limit (10)
            for i in range(10):
                project_data = ProjectTestHelpers.create_sample_project_data(name=f"Limit Test {i}")
                response = test_client.post("/api/projects", json=project_data, headers=auth_headers)
                assert response.status_code == 200
                created_projects.append(response.json()["project"]["id"])
            
            # Try to create one more (should fail)
            project_data = ProjectTestHelpers.create_sample_project_data(name="Over Limit Project")
            response = test_client.post("/api/projects", json=project_data, headers=auth_headers)
            assert response.status_code == 403
            assert "Maximum project limit reached" in response.json()["detail"]
            
        finally:
            # Cleanup all created projects
            ProjectTestHelpers.cleanup_projects(test_client, auth_headers, created_projects)


class TestProjectCollaboration:
    """Test suite for project collaboration features."""

    @pytest.mark.unit
    def test_add_collaborator_to_project(
        self, test_client: TestClient
    ) -> None:
        """
        Test adding a collaborator to a project.
        
        This test verifies that project owners can successfully
        add collaborators to their projects.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
        """
        # Create owner user
        owner = ProjectTestHelpers.create_mock_user("owner-123", "owner", "owner@example.com")
        owner_headers = ProjectTestHelpers.create_auth_headers_for_user(owner)
        
        # Create project
        project_data = ProjectTestHelpers.create_sample_project_data(name="Collaboration Test")
        create_response = test_client.post("/api/projects", json=project_data, headers=owner_headers)
        project_id = create_response.json()["project"]["id"]
        
        try:
            # Add collaborator
            collaborator_data = {"user_id": "collab-456", "role": "collaborator"}
            response = test_client.post(f"/api/projects/{project_id}/collaborators", json=collaborator_data, headers=owner_headers)
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["success"] is True
            assert "collaborator" in data
            assert data["collaborator"]["user_id"] == "collab-456"
            assert data["collaborator"]["role"] == "collaborator"
            assert "added_at" in data["collaborator"]
            
        finally:
            # Cleanup
            ProjectTestHelpers.cleanup_projects(test_client, owner_headers, [project_id])

    @pytest.mark.unit
    def test_list_project_collaborators(
        self, test_client: TestClient
    ) -> None:
        """
        Test listing project collaborators.
        
        This test verifies that collaborators can be listed correctly
        with proper details and permissions.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
        """
        # Create owner user
        owner = ProjectTestHelpers.create_mock_user("owner-123", "owner", "owner@example.com")
        owner_headers = ProjectTestHelpers.create_auth_headers_for_user(owner)
        
        # Create project
        project_data = ProjectTestHelpers.create_sample_project_data(name="List Collaborators Test")
        create_response = test_client.post("/api/projects", json=project_data, headers=owner_headers)
        project_id = create_response.json()["project"]["id"]
        
        try:
            # Add multiple collaborators
            collaborator_ids = ["collab-1", "collab-2", "collab-3"]
            for collab_id in collaborator_ids:
                collaborator_data = {"user_id": collab_id, "role": "collaborator"}
                test_client.post(f"/api/projects/{project_id}/collaborators", json=collaborator_data, headers=owner_headers)
            
            # List collaborators
            response = test_client.get(f"/api/projects/{project_id}/collaborators", headers=owner_headers)
            
            assert response.status_code == 200
            data = response.json()
            
            assert "collaborators" in data
            assert "count" in data
            assert data["count"] == len(collaborator_ids)
            assert len(data["collaborators"]) == len(collaborator_ids)
            
            # Verify collaborator details
            for collaborator in data["collaborators"]:
                assert "user_id" in collaborator
                assert "username" in collaborator
                assert "role" in collaborator
                assert "added_at" in collaborator
                assert collaborator["user_id"] in collaborator_ids
                
        finally:
            # Cleanup
            ProjectTestHelpers.cleanup_projects(test_client, owner_headers, [project_id])

    @pytest.mark.unit
    def test_remove_collaborator_from_project(
        self, test_client: TestClient
    ) -> None:
        """
        Test removing a collaborator from a project.
        
        This test verifies that collaborators can be removed by owners
        or can remove themselves from projects.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
        """
        # Create owner and collaborator users
        owner = ProjectTestHelpers.create_mock_user("owner-123", "owner", "owner@example.com")
        collaborator = ProjectTestHelpers.create_mock_user("collab-456", "collaborator", "collab@example.com")
        
        owner_headers = ProjectTestHelpers.create_auth_headers_for_user(owner)
        collab_headers = ProjectTestHelpers.create_auth_headers_for_user(collaborator)
        
        # Create project
        project_data = ProjectTestHelpers.create_sample_project_data(name="Remove Collaborator Test")
        create_response = test_client.post("/api/projects", json=project_data, headers=owner_headers)
        project_id = create_response.json()["project"]["id"]
        
        try:
            # Add collaborator
            collaborator_data = {"user_id": collaborator["id"], "role": "collaborator"}
            test_client.post(f"/api/projects/{project_id}/collaborators", json=collaborator_data, headers=owner_headers)
            
            # Verify collaborator was added
            list_response = test_client.get(f"/api/projects/{project_id}/collaborators", headers=owner_headers)
            assert list_response.json()["count"] == 1
            
            # Test owner can remove collaborator
            remove_response = test_client.delete(f"/api/projects/{project_id}/collaborators/{collaborator['id']}", headers=owner_headers)
            assert remove_response.status_code == 200
            assert remove_response.json()["success"] is True
            
            # Verify collaborator was removed
            list_response = test_client.get(f"/api/projects/{project_id}/collaborators", headers=owner_headers)
            assert list_response.json()["count"] == 0
            
            # Add collaborator back for self-removal test
            test_client.post(f"/api/projects/{project_id}/collaborators", json=collaborator_data, headers=owner_headers)
            
            # Test collaborator can remove themselves
            self_remove_response = test_client.delete(f"/api/projects/{project_id}/collaborators/{collaborator['id']}", headers=collab_headers)
            assert self_remove_response.status_code == 200
            assert self_remove_response.json()["success"] is True
            
        finally:
            # Cleanup
            ProjectTestHelpers.cleanup_projects(test_client, owner_headers, [project_id])

    @pytest.mark.unit
    def test_collaboration_permission_restrictions(
        self, test_client: TestClient
    ) -> None:
        """
        Test collaboration permission restrictions.
        
        This test verifies that only owners can add/remove collaborators
        and that proper error handling is in place.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
        """
        # Create users
        owner = ProjectTestHelpers.create_mock_user("owner-123", "owner", "owner@example.com")
        collaborator = ProjectTestHelpers.create_mock_user("collab-456", "collaborator", "collab@example.com")
        outsider = ProjectTestHelpers.create_mock_user("outsider-789", "outsider", "outsider@example.com")
        
        owner_headers = ProjectTestHelpers.create_auth_headers_for_user(owner)
        collab_headers = ProjectTestHelpers.create_auth_headers_for_user(collaborator)
        outsider_headers = ProjectTestHelpers.create_auth_headers_for_user(outsider)
        
        # Create project
        project_data = ProjectTestHelpers.create_sample_project_data(name="Permission Test")
        create_response = test_client.post("/api/projects", json=project_data, headers=owner_headers)
        project_id = create_response.json()["project"]["id"]
        
        try:
            # Add initial collaborator
            collaborator_data = {"user_id": collaborator["id"], "role": "collaborator"}
            test_client.post(f"/api/projects/{project_id}/collaborators", json=collaborator_data, headers=owner_headers)
            
            # Test collaborator cannot add other collaborators
            new_collab_data = {"user_id": outsider["id"], "role": "collaborator"}
            response = test_client.post(f"/api/projects/{project_id}/collaborators", json=new_collab_data, headers=collab_headers)
            assert response.status_code == 403
            
            # Test outsider cannot add collaborators
            response = test_client.post(f"/api/projects/{project_id}/collaborators", json=new_collab_data, headers=outsider_headers)
            assert response.status_code == 403
            
            # Test collaborator cannot remove other collaborators (only themselves)
            response = test_client.delete(f"/api/projects/{project_id}/collaborators/{outsider['id']}", headers=collab_headers)
            assert response.status_code in [403, 404]  # Access denied or not found
            
            # Test owner cannot add themselves as collaborator
            self_collab_data = {"user_id": owner["id"], "role": "collaborator"}
            response = test_client.post(f"/api/projects/{project_id}/collaborators", json=self_collab_data, headers=owner_headers)
            assert response.status_code == 400
            
            # Test adding duplicate collaborator
            response = test_client.post(f"/api/projects/{project_id}/collaborators", json=collaborator_data, headers=owner_headers)
            assert response.status_code == 409
            
        finally:
            # Cleanup
            ProjectTestHelpers.cleanup_projects(test_client, owner_headers, [project_id])


class TestProjectEdgeCases:
    """Test suite for edge cases and error handling."""

    @pytest.mark.unit
    def test_create_project_with_duplicate_name(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ) -> None:
        """
        Test creating projects with duplicate names.
        
        This test verifies that users cannot create multiple projects
        with the same name.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
        """
        project_name = "Duplicate Name Test"
        project_data = ProjectTestHelpers.create_sample_project_data(name=project_name)
        
        # Create first project
        first_response = test_client.post("/api/projects", json=project_data, headers=auth_headers)
        assert first_response.status_code == 200
        first_project_id = first_response.json()["project"]["id"]
        
        try:
            # Try to create second project with same name
            second_response = test_client.post("/api/projects", json=project_data, headers=auth_headers)
            assert second_response.status_code == 409
            assert "Project name already exists" in second_response.json()["detail"]
            
        finally:
            # Cleanup
            ProjectTestHelpers.cleanup_projects(test_client, auth_headers, [first_project_id])

    @pytest.mark.unit
    def test_update_nonexistent_project(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ) -> None:
        """
        Test updating a non-existent project.
        
        This test verifies that attempts to update non-existent projects
        return appropriate 404 errors.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
        """
        nonexistent_id = "nonexistent-project-123"
        update_data = {"name": "This Should Fail"}
        
        response = test_client.put(f"/api/projects/{nonexistent_id}", json=update_data, headers=auth_headers)
        
        assert response.status_code == 404
        assert "Project not found" in response.json()["detail"]

    @pytest.mark.unit
    @pytest.mark.parametrize("invalid_name", [
        "",  # Empty name
        "   ",  # Whitespace only
        "a" * 1000,  # Extremely long name
        "Test\x00Project",  # Null byte
        "Test\nProject",  # Newline
    ])
    def test_project_name_validation(
        self, test_client: TestClient, auth_headers: Dict[str, str], invalid_name: str
    ) -> None:
        """
        Test project name validation with various invalid inputs.
        
        This parametrized test verifies that invalid project names
        are properly rejected by the validation system.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
            invalid_name: Invalid project name to test
        """
        project_data = ProjectTestHelpers.create_sample_project_data(name=invalid_name)
        
        response = test_client.post("/api/projects", json=project_data, headers=auth_headers)
        
        # Should return validation error (422)
        assert response.status_code == 422

    @pytest.mark.unit
    @pytest.mark.parametrize("malicious_input", [
        {"name": "'; DROP TABLE projects; --"},
        {"name": "<script>alert('xss')</script>"},
        {"description": "'; DELETE FROM projects WHERE 1=1; --"},
        {"metadata": {"evil": "'; DROP TABLE users; --"}},
    ])
    def test_sql_injection_and_xss_protection(
        self, test_client: TestClient, auth_headers: Dict[str, str], malicious_input: Dict[str, Any]
    ) -> None:
        """
        Test protection against SQL injection and XSS attacks.
        
        This parametrized test verifies that malicious inputs in project
        data are safely handled without causing security vulnerabilities.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
            malicious_input: Malicious input to test
        """
        base_data = ProjectTestHelpers.create_sample_project_data()
        base_data.update(malicious_input)
        
        response = test_client.post("/api/projects", json=base_data, headers=auth_headers)
        
        # Should either succeed (with sanitized input) or fail with validation error
        # but should not cause server errors
        assert response.status_code in [200, 400, 422]
        
        if response.status_code == 200:
            # If project was created, clean it up
            project_id = response.json()["project"]["id"]
            ProjectTestHelpers.cleanup_projects(test_client, auth_headers, [project_id])

    @pytest.mark.unit
    def test_invalid_project_data_types(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ) -> None:
        """
        Test handling of invalid data types in project requests.
        
        This test verifies that invalid data types are properly
        rejected with appropriate validation errors.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
        """
        # Test invalid data types that Pydantic will catch
        invalid_data_sets = [
            {"name": 123, "description": "number as name"},  # Number as name
            {"name": None, "description": "null name"},  # None as name
            {"name": ["list", "as", "name"]},  # List as name
        ]
        
        for invalid_data in invalid_data_sets:
            response = test_client.post("/api/projects", json=invalid_data, headers=auth_headers)
            
            # Should return validation error
            assert response.status_code == 422
        
        # Test data that passes Pydantic but may be semantically invalid
        semi_valid_data_sets = [
            {"name": "Valid Name", "visibility": "invalid_visibility"},  # Invalid visibility (but string)
            {"name": "Valid Name", "metadata": "not_a_dict"},  # String instead of dict
        ]
        
        for semi_valid_data in semi_valid_data_sets:
            response = test_client.post("/api/projects", json=semi_valid_data, headers=auth_headers)
            
            # Should either succeed (with coercion) or fail with validation
            assert response.status_code in [200, 422]
            
            # Clean up if project was created
            if response.status_code == 200:
                project_id = response.json()["project"]["id"]
                ProjectTestHelpers.cleanup_projects(test_client, auth_headers, [project_id])

    @pytest.mark.unit
    def test_project_operations_without_authentication(
        self, test_client: TestClient
    ) -> None:
        """
        Test project operations without authentication.
        
        This test verifies that all project endpoints properly
        require authentication and reject unauthenticated requests.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
        """
        project_data = ProjectTestHelpers.create_sample_project_data()
        fake_project_id = "fake-project-123"
        
        # Test unauthenticated requests
        endpoints_to_test = [
            ("GET", "/api/projects"),
            ("POST", "/api/projects", project_data),
            ("GET", f"/api/projects/{fake_project_id}"),
            ("PUT", f"/api/projects/{fake_project_id}", {"name": "Updated"}),
            ("DELETE", f"/api/projects/{fake_project_id}"),
            ("GET", f"/api/projects/{fake_project_id}/collaborators"),
            ("POST", f"/api/projects/{fake_project_id}/collaborators", {"user_id": "test"}),
            ("DELETE", f"/api/projects/{fake_project_id}/collaborators/test"),
        ]
        
        for method, url, *payload in endpoints_to_test:
            if method == "GET":
                response = test_client.get(url)
            elif method == "POST":
                response = test_client.post(url, json=payload[0] if payload else None)
            elif method == "PUT":
                response = test_client.put(url, json=payload[0] if payload else None)
            elif method == "DELETE":
                response = test_client.delete(url)
            
            # Should return 403 (Forbidden) for missing auth
            assert response.status_code == 403

    @pytest.mark.unit
    def test_pagination_edge_cases(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ) -> None:
        """
        Test pagination edge cases in project listing.
        
        This test verifies that pagination parameters are properly
        validated and handled for edge cases.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
        """
        # Test invalid pagination parameters
        test_cases = [
            {"limit": -1},  # Negative limit
            {"limit": 1000},  # Limit too high
            {"offset": -1},  # Negative offset
            {"limit": 0},  # Zero limit
        ]
        
        for params in test_cases:
            response = test_client.get("/api/projects", params=params, headers=auth_headers)
            
            # Should return validation error for invalid pagination
            assert response.status_code == 422