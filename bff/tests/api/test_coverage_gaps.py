"""
Targeted tests to improve server coverage by testing previously uncovered areas.

This module focuses on testing the biggest coverage gaps identified:
- bounded_collections.py utility classes
- feedback_endpoints.py API endpoints
- git_endpoints.py read operations
- worldbuilding_endpoints.py assistance features
"""

import time
from datetime import datetime, timezone
from typing import Dict
from unittest.mock import patch

from fastapi.testclient import TestClient

# Import the classes to test directly
from server.bounded_collections import LRUCache, BoundedDict, BoundedSet


class TestBoundedCollections:
    """Test suite for bounded collection utility classes."""

    def test_lru_cache_basic_operations(self):
        """Test basic LRU cache get/put operations."""
        cache = LRUCache[str, int](max_size=3)

        # Test empty cache
        assert cache.get("key1") is None
        assert len(cache) == 0

        # Test putting and getting
        cache.put("key1", 100)
        cache.put("key2", 200)
        assert cache.get("key1") == 100
        assert cache.get("key2") == 200
        assert len(cache) == 2

        # Test updating existing key
        cache.put("key1", 150)
        assert cache.get("key1") == 150
        assert len(cache) == 2

    def test_lru_cache_eviction(self):
        """Test LRU cache eviction when max size is reached."""
        cache = LRUCache[str, str](max_size=2)

        # Fill cache to capacity
        cache.put("key1", "value1")
        cache.put("key2", "value2")

        # Add third item, should evict oldest (key1)
        cache.put("key3", "value3")

        assert cache.get("key1") is None  # Evicted
        assert cache.get("key2") == "value2"
        assert cache.get("key3") == "value3"
        assert len(cache) == 2

    def test_lru_cache_access_order(self):
        """Test that accessing items affects LRU order."""
        cache = LRUCache[str, str](max_size=2)

        cache.put("key1", "value1")
        cache.put("key2", "value2")

        # Access key1 to make it most recently used
        cache.get("key1")

        # Add key3, should evict key2 (least recently used)
        cache.put("key3", "value3")

        assert cache.get("key1") == "value1"  # Still present
        assert cache.get("key2") is None  # Evicted
        assert cache.get("key3") == "value3"

    def test_lru_cache_remove_and_clear(self):
        """Test LRU cache remove and clear operations."""
        cache = LRUCache[str, int](max_size=3)

        cache.put("key1", 1)
        cache.put("key2", 2)
        cache.put("key3", 3)

        # Test remove
        removed = cache.remove("key2")
        assert removed == 2
        assert cache.get("key2") is None
        assert len(cache) == 2

        # Test remove non-existent key
        assert cache.remove("nonexistent") is None

        # Test clear
        cache.clear()
        assert len(cache) == 0
        assert cache.get("key1") is None

    def test_lru_cache_iteration(self):
        """Test LRU cache iteration methods."""
        cache = LRUCache[str, int](max_size=3)

        cache.put("key1", 1)
        cache.put("key2", 2)
        cache.put("key3", 3)

        # Test keys
        keys = list(cache.keys())
        assert "key1" in keys
        assert "key2" in keys
        assert "key3" in keys
        assert len(keys) == 3

        # Test values
        values = list(cache.values())
        assert 1 in values
        assert 2 in values
        assert 3 in values

        # Test items
        items = list(cache.items())
        assert len(items) == 3
        assert ("key1", 1) in items

    def test_lru_cache_contains(self):
        """Test LRU cache __contains__ method."""
        cache = LRUCache[str, int](max_size=2)

        cache.put("key1", 1)
        assert "key1" in cache
        assert "key2" not in cache

    def test_bounded_dict_basic_operations(self):
        """Test basic BoundedDict operations."""
        bd = BoundedDict[str, int](max_size=3)

        # Test setting and getting
        bd["key1"] = 100
        bd["key2"] = 200
        assert bd["key1"] == 100
        assert bd["key2"] == 200
        assert len(bd) == 2

        # Test get with default
        assert bd.get("key1") == 100
        assert bd.get("nonexistent") is None
        assert bd.get("nonexistent", 999) == 999

    def test_bounded_dict_eviction(self):
        """Test BoundedDict eviction when max size is reached."""
        bd = BoundedDict[str, str](max_size=2)

        bd["key1"] = "value1"
        bd["key2"] = "value2"

        # Add third item, should evict oldest
        bd["key3"] = "value3"

        assert "key1" not in bd  # Evicted
        assert bd["key2"] == "value2"
        assert bd["key3"] == "value3"
        assert len(bd) == 2

    def test_bounded_dict_update_access_order(self):
        """Test that accessing items updates their position."""
        bd = BoundedDict[str, str](max_size=2)

        bd["key1"] = "value1"
        bd["key2"] = "value2"

        # Access key1 to make it most recently used
        _ = bd["key1"]

        # Add key3, should evict key2
        bd["key3"] = "value3"

        assert bd["key1"] == "value1"  # Still present
        assert "key2" not in bd  # Evicted
        assert bd["key3"] == "value3"

    def test_bounded_dict_with_ttl(self):
        """Test BoundedDict with TTL (time-to-live)."""
        bd = BoundedDict[str, str](max_size=5, ttl_seconds=1)

        bd["key1"] = "value1"
        assert bd["key1"] == "value1"
        assert len(bd) == 1

        # Wait for TTL to expire
        time.sleep(1.1)

        # Should be cleaned up on next access
        assert "key1" not in bd
        assert len(bd) == 0

    def test_bounded_dict_deletion(self):
        """Test BoundedDict deletion operations."""
        bd = BoundedDict[str, int](max_size=3)

        bd["key1"] = 1
        bd["key2"] = 2
        bd["key3"] = 3

        # Test __delitem__
        del bd["key2"]
        assert "key2" not in bd
        assert len(bd) == 2

        # Test pop
        value = bd.pop("key1")
        assert value == 1
        assert "key1" not in bd

        # Test pop with default
        assert bd.pop("nonexistent", 999) == 999

    def test_bounded_dict_iteration(self):
        """Test BoundedDict iteration methods."""
        bd = BoundedDict[str, int](max_size=3)

        bd["key1"] = 1
        bd["key2"] = 2
        bd["key3"] = 3

        # Test keys()
        keys = list(bd.keys())
        assert len(keys) == 3
        assert "key1" in keys

        # Test values()
        values = list(bd.values())
        assert len(values) == 3
        assert 1 in values

        # Test items()
        items = list(bd.items())
        assert len(items) == 3
        assert ("key1", 1) in items

    def test_bounded_dict_clear(self):
        """Test BoundedDict clear operation."""
        bd = BoundedDict[str, int](max_size=3, ttl_seconds=10)

        bd["key1"] = 1
        bd["key2"] = 2
        assert len(bd) == 2

        bd.clear()
        assert len(bd) == 0
        assert "key1" not in bd

    def test_bounded_set_basic_operations(self):
        """Test basic BoundedSet operations."""
        bs = BoundedSet[str](max_size=3)

        # Test add and contains
        bs.add("item1")
        bs.add("item2")
        assert "item1" in bs
        assert "item2" in bs
        assert "item3" not in bs
        assert len(bs) == 2

    def test_bounded_set_eviction(self):
        """Test BoundedSet eviction when max size is reached."""
        bs = BoundedSet[str](max_size=2)

        bs.add("item1")
        bs.add("item2")

        # Add third item, should evict oldest
        bs.add("item3")

        assert "item1" not in bs  # Evicted
        assert "item2" in bs
        assert "item3" in bs
        assert len(bs) == 2

    def test_bounded_set_access_order(self):
        """Test that adding existing items updates their position."""
        bs = BoundedSet[str](max_size=2)

        bs.add("item1")
        bs.add("item2")

        # Re-add item1 to make it most recently used
        bs.add("item1")

        # Add item3, should evict item2
        bs.add("item3")

        assert "item1" in bs  # Still present
        assert "item2" not in bs  # Evicted
        assert "item3" in bs

    def test_bounded_set_remove_operations(self):
        """Test BoundedSet remove operations."""
        bs = BoundedSet[str](max_size=3)

        bs.add("item1")
        bs.add("item2")
        bs.add("item3")

        # Test remove
        bs.remove("item2")
        assert "item2" not in bs
        assert len(bs) == 2

        # Test discard (no error if item doesn't exist)
        bs.discard("nonexistent")  # Should not raise error
        bs.discard("item1")
        assert "item1" not in bs

    def test_bounded_set_iteration_and_clear(self):
        """Test BoundedSet iteration and clear."""
        bs = BoundedSet[str](max_size=3)

        bs.add("item1")
        bs.add("item2")
        bs.add("item3")

        # Test iteration
        items = list(bs)
        assert len(items) == 3
        assert "item1" in items

        # Test clear
        bs.clear()
        assert len(bs) == 0
        assert "item1" not in bs


class TestFeedbackEndpoints:
    """Test suite for feedback and analytics endpoints."""

    def test_track_event_endpoint(self, test_client: TestClient):
        """Test event tracking endpoint."""
        event_data = {
            "eventType": "page_view",
            "eventData": {
                "page": "/dashboard",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "user_id": "test-user-123",
            },
            "sessionId": "session-123",
            "userId": "user-456",
        }

        response = test_client.post("/api/v1/analytics/track", json=event_data)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "eventId" in data
        assert "timestamp" in data

    def test_get_events_endpoint(self, test_client: TestClient):
        """Test getting tracked events."""
        # First track some events
        event1 = {
            "eventType": "click",
            "eventData": {"button": "save"},
            "sessionId": "session-123",
            "userId": "user-456",
        }
        event2 = {
            "eventType": "page_view",
            "eventData": {"page": "/editor"},
            "sessionId": "session-123",
            "userId": "user-456",
        }

        test_client.post("/api/v1/analytics/track", json=event1)
        test_client.post("/api/v1/analytics/track", json=event2)

        # Get events
        response = test_client.get("/api/v1/analytics/events?sessionId=session-123")

        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert len(data["events"]) >= 2

    def test_submit_feedback_endpoint(self, test_client: TestClient):
        """Test feedback submission endpoint."""
        feedback_data = {
            "feedbackType": "bug_report",
            "message": "The save button doesn't work properly",
            "rating": 2,
            "category": "functionality",
            "userAgent": "Mozilla/5.0 (Test Browser)",
            "url": "/editor",
            "userId": "user-123",
            "metadata": {"browser": "Chrome", "version": "91.0"},
        }

        response = test_client.post("/api/v1/feedback", json=feedback_data)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "feedbackId" in data
        assert "timestamp" in data

    def test_get_feedback_endpoint(self, test_client: TestClient):
        """Test getting feedback entries."""
        # Submit feedback first
        feedback_data = {
            "feedbackType": "feature_request",
            "message": "Please add dark mode",
            "rating": 5,
            "category": "ui",
            "userId": "user-456",
        }

        test_client.post("/api/v1/feedback", json=feedback_data)

        # Get feedback
        response = test_client.get("/api/v1/feedback?category=ui")

        assert response.status_code == 200
        data = response.json()
        assert "feedback" in data
        assert len(data["feedback"]) >= 1

    def test_get_help_content_endpoint(self, test_client: TestClient):
        """Test help content retrieval."""
        response = test_client.get("/api/v1/help/getting-started")

        assert response.status_code == 200
        data = response.json()
        assert "helpId" in data
        assert "title" in data
        assert "content" in data
        assert data["helpId"] == "getting-started"

    def test_get_help_content_not_found(self, test_client: TestClient):
        """Test help content not found scenario."""
        response = test_client.get("/api/v1/help/nonexistent-topic")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_search_help_content_endpoint(self, test_client: TestClient):
        """Test help content search."""
        response = test_client.get("/api/v1/help/search?q=getting&category=basics")

        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert "total" in data
        assert "query" in data

    def test_start_help_session_endpoint(self, test_client: TestClient):
        """Test starting a help session."""
        session_data = {
            "userId": "user-123",
            "sessionType": "guided_tour",
            "context": {"page": "/dashboard", "user_level": "beginner"},
        }

        response = test_client.post("/api/v1/help/session", json=session_data)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "sessionId" in data
        assert "startedAt" in data

    def test_update_help_session_endpoint(self, test_client: TestClient):
        """Test updating a help session."""
        # Start session first
        session_data = {
            "userId": "user-123",
            "sessionType": "guided_tour",
            "context": {"page": "/dashboard"},
        }
        start_response = test_client.post("/api/v1/help/session", json=session_data)
        session_id = start_response.json()["sessionId"]

        # Update session
        update_data = {"status": "completed", "currentStep": "final", "progress": 100}

        response = test_client.put(
            f"/api/v1/help/session/{session_id}", json=update_data
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["session"]["status"] == "completed"

    def test_get_help_session_endpoint(self, test_client: TestClient):
        """Test getting help session details."""
        # Start session first
        session_data = {
            "userId": "user-456",
            "sessionType": "tutorial",
            "context": {"page": "/editor"},
        }
        start_response = test_client.post("/api/v1/help/session", json=session_data)
        session_id = start_response.json()["sessionId"]

        # Get session
        response = test_client.get(f"/api/v1/help/session/{session_id}")

        assert response.status_code == 200
        data = response.json()
        assert "session" in data
        assert data["session"]["sessionId"] == session_id

    def test_help_session_not_found(self, test_client: TestClient):
        """Test help session not found scenario."""
        response = test_client.get("/api/v1/help/session/nonexistent-session")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_feedback_endpoint_validation(self, test_client: TestClient):
        """Test feedback endpoint input validation."""
        # Test missing required fields
        invalid_data = {
            "message": "Test feedback",
            # Missing feedbackType
        }

        response = test_client.post("/api/v1/feedback", json=invalid_data)
        assert response.status_code == 422

    def test_analytics_endpoint_validation(self, test_client: TestClient):
        """Test analytics endpoint input validation."""
        # Test missing required fields
        invalid_data = {
            "eventData": {"test": "data"},
            # Missing eventType
        }

        response = test_client.post("/api/v1/analytics/track", json=invalid_data)
        assert response.status_code == 422


class TestGitEndpoints:
    """Test suite for git read operation endpoints."""

    @patch("bff.services.git_manager.GitRepoManager")
    def test_get_file_content_endpoint(
        self, mock_git_manager, test_client: TestClient, auth_headers: Dict[str, str]
    ):
        """Test getting file content from git repository."""
        # Mock git manager response
        mock_instance = mock_git_manager.return_value
        mock_instance.get_file_content.return_value = {
            "content": "# Test File\nThis is test content",
            "path": "test.md",
            "size": 25,
            "encoding": "utf-8",
        }

        response = test_client.get(
            "/api/git/content/test_project/test.md", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "content" in data
        assert data["content"] == "# Test File\nThis is test content"

    @patch("bff.services.git_manager.GitRepoManager")
    def test_get_file_content_not_found(
        self, mock_git_manager, test_client: TestClient, auth_headers: Dict[str, str]
    ):
        """Test file not found scenario."""
        mock_instance = mock_git_manager.return_value
        mock_instance.get_file_content.side_effect = FileNotFoundError("File not found")

        response = test_client.get(
            "/api/git/content/test_project/nonexistent.md", headers=auth_headers
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    @patch("bff.services.git_manager.GitRepoManager")
    def test_get_project_tree_endpoint(
        self, mock_git_manager, test_client: TestClient, auth_headers: Dict[str, str]
    ):
        """Test getting project directory tree."""
        mock_instance = mock_git_manager.return_value
        mock_instance.get_tree.return_value = [
            {"name": "README.md", "type": "file", "path": "README.md"},
            {"name": "src", "type": "directory", "path": "src"},
            {"name": "package.json", "type": "file", "path": "package.json"},
        ]

        response = test_client.get("/api/git/tree/test_project", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 3

    @patch("bff.services.git_manager.GitRepoManager")
    def test_get_diff_endpoint(
        self, mock_git_manager, test_client: TestClient, auth_headers: Dict[str, str]
    ):
        """Test getting diff between refs."""
        mock_instance = mock_git_manager.return_value
        mock_instance.get_diff.return_value = {
            "files_changed": 2,
            "insertions": 15,
            "deletions": 3,
            "diff": "--- a/file1.txt\n+++ b/file1.txt\n@@ -1,3 +1,4 @@\n line1\n+new line\n line2",
        }

        response = test_client.get(
            "/api/git/diff/test_project?base_ref=main&head_ref=feature",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "files_changed" in data
        assert "diff" in data

    @patch("bff.services.git_manager.GitRepoManager")
    def test_get_file_history_endpoint(
        self, mock_git_manager, test_client: TestClient, auth_headers: Dict[str, str]
    ):
        """Test getting file commit history."""
        mock_instance = mock_git_manager.return_value
        mock_instance.get_file_history.return_value = [
            {
                "commit": "abc123",
                "author": "Test Author",
                "date": "2024-01-01T12:00:00Z",
                "message": "Update file",
            },
            {
                "commit": "def456",
                "author": "Another Author",
                "date": "2024-01-02T12:00:00Z",
                "message": "Initial commit",
            },
        ]

        response = test_client.get(
            "/api/git/history/test_project/src/main.py?limit=5", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "history" in data
        assert "file_path" in data
        assert "project_id" in data
        assert len(data["history"]) == 2

    @patch("bff.services.git_manager.GitRepoManager")
    def test_get_characters_endpoint(
        self, mock_git_manager, test_client: TestClient, auth_headers: Dict[str, str]
    ):
        """Test getting character files from repository."""
        mock_instance = mock_git_manager.return_value
        mock_instance.get_tree.return_value = [
            {
                "name": "protagonist.yaml",
                "type": "file",
                "path": "characters/protagonist.yaml",
            },
            {
                "name": "antagonist.json",
                "type": "file",
                "path": "characters/antagonist.json",
            },
        ]
        mock_instance.get_file_content.side_effect = [
            {"content": "name: Hero\nage: 25"},
            {"content": '{"name": "Villain", "age": 35}'},
        ]

        response = test_client.get(
            "/api/git/characters/test_project", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "characters" in data
        assert "project_id" in data
        assert len(data["characters"]) == 2

    @patch("bff.services.git_manager.GitRepoManager")
    def test_get_scenes_endpoint(
        self, mock_git_manager, test_client: TestClient, auth_headers: Dict[str, str]
    ):
        """Test getting scene files from repository."""
        mock_instance = mock_git_manager.return_value
        mock_instance.get_tree.return_value = [
            {"name": "scene1.md", "type": "file", "path": "scenes/chapter1/scene1.md"},
            {"name": "scene2.md", "type": "file", "path": "scenes/chapter1/scene2.md"},
        ]
        mock_instance.get_file_content.side_effect = [
            {"content": "# Scene 1\nThe hero enters..."},
            {"content": "# Scene 2\nThe conflict begins..."},
        ]

        response = test_client.get(
            "/api/git/scenes/test_project?chapter=chapter1", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "scenes" in data
        assert "project_id" in data
        assert "chapter" in data
        assert data["chapter"] == "chapter1"

    @patch("bff.services.git_manager.GitRepoManager")
    def test_get_worldbuilding_endpoint(
        self, mock_git_manager, test_client: TestClient, auth_headers: Dict[str, str]
    ):
        """Test getting worldbuilding data from repository."""
        mock_instance = mock_git_manager.return_value
        mock_instance.get_tree.return_value = [
            {
                "name": "locations.yaml",
                "type": "file",
                "path": "worldbuilding/locations.yaml",
            },
            {
                "name": "timeline.json",
                "type": "file",
                "path": "worldbuilding/timeline.json",
            },
        ]
        mock_instance.get_file_content.side_effect = [
            {"content": "city1:\n  name: Capital\n  population: 1000000"},
            {"content": '{"events": [{"year": 1000, "event": "Kingdom founded"}]}'},
        ]

        response = test_client.get(
            "/api/git/worldbuilding/test_project", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "worldbuilding" in data
        assert "project_id" in data
        assert "locations" in data["worldbuilding"]
        assert "timeline" in data["worldbuilding"]

    @patch("bff.services.git_manager.GitRepoManager")
    def test_git_endpoint_error_handling(
        self, mock_git_manager, test_client: TestClient, auth_headers: Dict[str, str]
    ):
        """Test git endpoint error handling."""
        mock_instance = mock_git_manager.return_value
        mock_instance.get_file_content.side_effect = Exception("Git error")

        response = test_client.get(
            "/api/git/content/test_project/error.md", headers=auth_headers
        )

        assert response.status_code == 500

    def test_git_endpoints_require_auth(self, test_client: TestClient):
        """Test that git endpoints require authentication."""
        endpoints = [
            "/api/git/content/test_project/test.md",
            "/api/git/tree/test_project",
            "/api/git/diff/test_project",
            "/api/git/history/test_project/test.md",
            "/api/git/characters/test_project",
            "/api/git/scenes/test_project",
            "/api/git/worldbuilding/test_project",
        ]

        for endpoint in endpoints:
            response = test_client.get(endpoint)
            assert response.status_code == 403  # Should require authentication


class TestWorldbuildingEndpoints:
    """Test suite for worldbuilding assistance endpoints."""

    def test_get_worldbuilding_categories(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ):
        """Test getting available worldbuilding categories."""
        response = test_client.get(
            "/api/worldbuilding/categories", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert isinstance(data["categories"], list)

    def test_get_category_templates(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ):
        """Test getting templates for a specific category."""
        response = test_client.get(
            "/api/worldbuilding/categories/characters/templates", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "templates" in data
        assert isinstance(data["templates"], list)

    def test_generate_worldbuilding_content(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ):
        """Test generating worldbuilding content."""
        generation_request = {
            "category": "characters",
            "prompt": "Create a mysterious wizard character",
            "style": "fantasy",
            "length": "medium",
            "context": {"setting": "medieval fantasy", "tone": "mysterious"},
        }

        response = test_client.post(
            "/api/worldbuilding/generate", json=generation_request, headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "content" in data

    def test_save_worldbuilding_element(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ):
        """Test saving a worldbuilding element."""
        element_data = {
            "projectId": "test_project",
            "category": "locations",
            "name": "Mystic Forest",
            "description": "A magical forest where time moves differently",
            "properties": {
                "climate": "temperate",
                "danger_level": "moderate",
                "magical_properties": ["time_dilation", "healing_springs"],
            },
            "tags": ["forest", "magical", "mysterious"],
        }

        response = test_client.post(
            "/api/worldbuilding/elements", json=element_data, headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "elementId" in data

    def test_get_worldbuilding_elements(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ):
        """Test getting worldbuilding elements for a project."""
        response = test_client.get(
            "/api/worldbuilding/elements?projectId=test_project&category=locations",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "elements" in data
        assert "total" in data

    def test_update_worldbuilding_element(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ):
        """Test updating a worldbuilding element."""
        # First create an element
        element_data = {
            "projectId": "test_project",
            "category": "characters",
            "name": "Test Character",
            "description": "A test character",
        }

        create_response = test_client.post(
            "/api/worldbuilding/elements", json=element_data, headers=auth_headers
        )
        element_id = create_response.json()["elementId"]

        # Update the element
        update_data = {
            "name": "Updated Character",
            "description": "An updated test character",
            "properties": {"class": "warrior"},
        }

        response = test_client.put(
            f"/api/worldbuilding/elements/{element_id}",
            json=update_data,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_delete_worldbuilding_element(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ):
        """Test deleting a worldbuilding element."""
        # First create an element
        element_data = {
            "projectId": "test_project",
            "category": "items",
            "name": "Magic Sword",
            "description": "A powerful enchanted weapon",
        }

        create_response = test_client.post(
            "/api/worldbuilding/elements", json=element_data, headers=auth_headers
        )
        element_id = create_response.json()["elementId"]

        # Delete the element
        response = test_client.delete(
            f"/api/worldbuilding/elements/{element_id}", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_worldbuilding_endpoints_require_auth(self, test_client: TestClient):
        """Test that worldbuilding endpoints require authentication."""
        endpoints = [
            ("GET", "/api/worldbuilding/categories"),
            ("GET", "/api/worldbuilding/categories/characters/templates"),
            ("POST", "/api/worldbuilding/generate"),
            ("GET", "/api/worldbuilding/elements"),
            ("POST", "/api/worldbuilding/elements"),
        ]

        for method, endpoint in endpoints:
            if method == "GET":
                response = test_client.get(endpoint)
            else:
                response = test_client.post(endpoint, json={})

            assert response.status_code == 403  # Should require authentication

    def test_worldbuilding_content_validation(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ):
        """Test worldbuilding content validation."""
        # Test invalid generation request
        invalid_request = {
            "category": "invalid_category",
            "prompt": "",  # Empty prompt
        }

        response = test_client.post(
            "/api/worldbuilding/generate", json=invalid_request, headers=auth_headers
        )

        assert response.status_code in [400, 422]

    def test_worldbuilding_element_not_found(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ):
        """Test handling of non-existent worldbuilding elements."""
        response = test_client.get(
            "/api/worldbuilding/elements/nonexistent-id", headers=auth_headers
        )

        assert response.status_code == 404
