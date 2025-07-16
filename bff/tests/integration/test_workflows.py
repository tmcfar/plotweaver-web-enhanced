"""
Integration tests that validate complete user workflows across multiple components.

This module tests end-to-end user journeys including collaborative editing,
conflict resolution, error recovery, and performance scenarios to ensure
the system works correctly in real-world usage patterns.
"""

import time
from datetime import datetime, timezone
from typing import Any, Dict, List

import pytest
from fastapi.testclient import TestClient


class WorkflowTestHelpers:
    """Helper functions for workflow testing."""

    @staticmethod
    def create_mock_user(user_id: str, username: str, email: str) -> Dict[str, Any]:
        """Create a mock user for testing collaborative scenarios."""
        return {
            "id": user_id,
            "username": username,
            "email": email,
            "roles": ["user"],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
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
            "iat": datetime.now(timezone.utc),
        }

        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return {"Authorization": f"Bearer {token}"}

    @staticmethod
    def wait_for_async_operations(duration: float = 0.1) -> None:
        """Wait for async operations to complete."""
        time.sleep(duration)

    @staticmethod
    def verify_lock_state(
        test_client: TestClient,
        auth_headers: Dict[str, str],
        project_id: str,
        component_id: str,
        expected_state: Dict[str, Any],
    ) -> None:
        """Verify that a lock has the expected state."""
        response = test_client.get(
            f"/api/projects/{project_id}/locks", headers=auth_headers
        )
        assert response.status_code == 200

        locks = response.json()["locks"]
        if expected_state is None:
            assert component_id not in locks
        else:
            assert component_id in locks
            lock = locks[component_id]
            for key, value in expected_state.items():
                assert lock[key] == value

    @staticmethod
    def cleanup_project_state(
        test_client: TestClient,
        auth_headers: Dict[str, str],
        project_id: str,
        component_ids: List[str],
    ) -> None:
        """Clean up project state after test."""
        for component_id in component_ids:
            try:
                test_client.delete(
                    f"/api/projects/{project_id}/locks/{component_id}",
                    headers=auth_headers,
                )
            except Exception:
                pass  # Ignore cleanup errors


class TestCompleteLockWorkflow:
    """Test complete lock workflow from creation to deletion."""

    @pytest.mark.integration
    def test_complete_lock_lifecycle_workflow(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ) -> None:
        """
        Test complete lock lifecycle: create → update → override → delete.

        This test validates the entire lock management workflow including
        lock creation, level changes, conflict resolution, and cleanup.

        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
        """
        project_id = "workflow_test_project"
        component_id = "comp_lifecycle_123"

        try:
            # Step 1: Create initial soft lock
            lock_data = {
                "id": f"lock_{component_id}_1",
                "componentId": component_id,
                "level": "soft",
                "type": "personal",
                "reason": "Initial editing workflow test",
                "lockedBy": "test-user-123",
                "lockedAt": datetime.now(timezone.utc).isoformat(),
                "sharedWith": [],
                "canOverride": True,
            }

            response = test_client.put(
                f"/api/projects/{project_id}/locks/{component_id}",
                json=lock_data,
                headers=auth_headers,
            )
            assert response.status_code == 200
            assert response.json()["success"] is True

            WorkflowTestHelpers.verify_lock_state(
                test_client,
                auth_headers,
                project_id,
                component_id,
                {"level": "soft", "type": "personal", "canOverride": True},
            )

            # Step 2: Upgrade lock to hard level
            lock_data["level"] = "hard"
            lock_data["reason"] = "Upgrading to hard lock for critical editing"
            lock_data["canOverride"] = False

            response = test_client.put(
                f"/api/projects/{project_id}/locks/{component_id}",
                json=lock_data,
                headers=auth_headers,
            )
            assert response.status_code == 200

            WorkflowTestHelpers.verify_lock_state(
                test_client,
                auth_headers,
                project_id,
                component_id,
                {"level": "hard", "canOverride": False},
            )

            # Step 3: Attempt collaborative sharing
            lock_data["sharedWith"] = ["collaborator-456"]
            lock_data["type"] = "collaborative"
            lock_data["reason"] = "Sharing with collaborator for review"

            response = test_client.put(
                f"/api/projects/{project_id}/locks/{component_id}",
                json=lock_data,
                headers=auth_headers,
            )
            assert response.status_code == 200

            WorkflowTestHelpers.verify_lock_state(
                test_client,
                auth_headers,
                project_id,
                component_id,
                {"type": "collaborative", "sharedWith": ["collaborator-456"]},
            )

            # Step 4: Upgrade to frozen lock for final review
            lock_data["level"] = "frozen"
            lock_data["type"] = "editorial"
            lock_data["reason"] = "Final editorial review - no changes allowed"
            lock_data["canOverride"] = False

            response = test_client.put(
                f"/api/projects/{project_id}/locks/{component_id}",
                json=lock_data,
                headers=auth_headers,
            )
            assert response.status_code == 200

            WorkflowTestHelpers.verify_lock_state(
                test_client,
                auth_headers,
                project_id,
                component_id,
                {"level": "frozen", "type": "editorial"},
            )

            # Step 5: Verify lock audit trail
            audit_response = test_client.get(
                f"/api/projects/{project_id}/locks/audit", headers=auth_headers
            )
            assert audit_response.status_code == 200
            audit_data = audit_response.json()

            assert audit_data["count"] >= 4  # At least 4 lock operations
            assert any(
                record["action"] == "create_lock"
                and record["componentId"] == component_id
                for record in audit_data["audit"]
            )

            # Step 6: Final cleanup - delete lock
            response = test_client.delete(
                f"/api/projects/{project_id}/locks/{component_id}", headers=auth_headers
            )
            assert response.status_code == 200

            WorkflowTestHelpers.verify_lock_state(
                test_client, auth_headers, project_id, component_id, None
            )

        finally:
            # Cleanup
            WorkflowTestHelpers.cleanup_project_state(
                test_client, auth_headers, project_id, [component_id]
            )


class TestCollaborativeEditingWorkflow:
    """Test collaborative editing scenarios with multiple users."""

    @pytest.mark.integration
    def test_multi_user_collaborative_editing_workflow(
        self, test_client: TestClient
    ) -> None:
        """
        Test collaborative editing workflow with multiple users and lock sharing.

        This test simulates a realistic collaborative editing scenario where
        multiple users work on different components with proper lock coordination.

        Args:
            test_client: FastAPI test client from conftest.py fixture
        """
        project_id = "collab_project"

        # Create test users
        user1 = WorkflowTestHelpers.create_mock_user(
            "user1-123", "author1", "author1@example.com"
        )
        user2 = WorkflowTestHelpers.create_mock_user(
            "user2-456", "reviewer1", "reviewer1@example.com"
        )
        user3 = WorkflowTestHelpers.create_mock_user(
            "user3-789", "editor1", "editor1@example.com"
        )

        user1_headers = WorkflowTestHelpers.create_auth_headers_for_user(user1)
        user2_headers = WorkflowTestHelpers.create_auth_headers_for_user(user2)
        user3_headers = WorkflowTestHelpers.create_auth_headers_for_user(user3)

        component1 = "chapter1_scene1"
        component2 = "chapter1_scene2"
        component3 = "character_profiles"

        try:
            # Step 1: User1 locks first component for writing
            lock1_data = {
                "id": f"lock_{component1}_1",
                "componentId": component1,
                "level": "soft",
                "type": "personal",
                "reason": "Writing initial draft",
                "lockedBy": user1["id"],
                "lockedAt": datetime.now(timezone.utc).isoformat(),
                "sharedWith": [],
                "canOverride": True,
            }

            response = test_client.put(
                f"/api/projects/{project_id}/locks/{component1}",
                json=lock1_data,
                headers=user1_headers,
            )
            assert response.status_code == 200

            # Step 2: User2 locks second component for review
            lock2_data = {
                "id": f"lock_{component2}_1",
                "componentId": component2,
                "level": "hard",
                "type": "editorial",
                "reason": "Editorial review in progress",
                "lockedBy": user2["id"],
                "lockedAt": datetime.now(timezone.utc).isoformat(),
                "sharedWith": [],
                "canOverride": False,
            }

            response = test_client.put(
                f"/api/projects/{project_id}/locks/{component2}",
                json=lock2_data,
                headers=user2_headers,
            )
            assert response.status_code == 200

            # Step 3: User1 shares their lock with User3 for collaboration
            lock1_data["sharedWith"] = [user3["id"]]
            lock1_data["type"] = "collaborative"
            lock1_data["reason"] = "Sharing with editor for collaborative work"

            response = test_client.put(
                f"/api/projects/{project_id}/locks/{component1}",
                json=lock1_data,
                headers=user1_headers,
            )
            assert response.status_code == 200

            # Step 4: User3 creates a collaborative lock on character profiles
            lock3_data = {
                "id": f"lock_{component3}_1",
                "componentId": component3,
                "level": "soft",
                "type": "collaborative",
                "reason": "Collaborative character development",
                "lockedBy": user3["id"],
                "lockedAt": datetime.now(timezone.utc).isoformat(),
                "sharedWith": [user1["id"], user2["id"]],
                "canOverride": True,
            }

            response = test_client.put(
                f"/api/projects/{project_id}/locks/{component3}",
                json=lock3_data,
                headers=user3_headers,
            )
            assert response.status_code == 200

            # Step 5: Verify all users can see the collaborative state
            for user_headers in [user1_headers, user2_headers, user3_headers]:
                response = test_client.get(
                    f"/api/projects/{project_id}/locks", headers=user_headers
                )
                assert response.status_code == 200
                locks = response.json()["locks"]
                assert len(locks) == 3

                # Verify collaborative lock sharing
                assert locks[component1]["type"] == "collaborative"
                assert user3["id"] in locks[component1]["sharedWith"]
                assert locks[component3]["type"] == "collaborative"
                assert len(locks[component3]["sharedWith"]) == 2

            # Step 6: Simulate conflict resolution - User2 tries to override User1's lock
            conflict_check_request = {"components": [component1]}
            response = test_client.post(
                f"/api/projects/{project_id}/locks/check-conflicts",
                json=conflict_check_request,
                headers=user2_headers,
            )
            assert response.status_code == 200

            conflicts = response.json()["data"]["conflicts"]
            assert len(conflicts) == 1
            assert conflicts[0]["conflict_type"] == "already_locked"
            assert conflicts[0]["can_override"] is True  # Soft lock can be overridden

            # Step 7: Bulk lock operation for final review
            bulk_request = {
                "operations": [
                    {
                        "type": "change_level",
                        "componentIds": [component1, component3],
                        "lockLevel": "hard",
                        "reason": "Upgrading to hard locks for final review",
                    }
                ]
            }

            response = test_client.post(
                f"/api/projects/{project_id}/locks/bulk",
                json=bulk_request,
                headers=user1_headers,
            )
            assert response.status_code == 200

            results = response.json()["results"]
            assert len(results) == 2
            assert all(result["status"] == "level_changed" for result in results)

        finally:
            # Cleanup all components
            WorkflowTestHelpers.cleanup_project_state(
                test_client,
                user1_headers,
                project_id,
                [component1, component2, component3],
            )


class TestConflictResolutionWorkflow:
    """Test conflict detection and resolution scenarios."""

    @pytest.mark.integration
    def test_complex_conflict_resolution_workflow(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ) -> None:
        """
        Test complex conflict resolution involving multiple conflict types.

        This test validates the system's ability to detect, report, and resolve
        various types of lock conflicts in collaborative editing scenarios.

        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
        """
        project_id = "conflict_resolution_project"

        # Create competing users
        user1 = WorkflowTestHelpers.create_mock_user(
            "conflict_user1", "author_a", "authora@example.com"
        )
        user2 = WorkflowTestHelpers.create_mock_user(
            "conflict_user2", "author_b", "authorb@example.com"
        )

        user1_headers = WorkflowTestHelpers.create_auth_headers_for_user(user1)
        user2_headers = WorkflowTestHelpers.create_auth_headers_for_user(user2)

        component_id = "conflicted_component"

        try:
            # Step 1: User1 creates a hard lock
            lock_data = {
                "id": f"lock_{component_id}_hard",
                "componentId": component_id,
                "level": "hard",
                "type": "personal",
                "reason": "Critical editing in progress",
                "lockedBy": user1["id"],
                "lockedAt": datetime.now(timezone.utc).isoformat(),
                "sharedWith": [],
                "canOverride": False,
            }

            response = test_client.put(
                f"/api/projects/{project_id}/locks/{component_id}",
                json=lock_data,
                headers=user1_headers,
            )
            assert response.status_code == 200

            # Step 2: User2 attempts to check for conflicts before locking
            conflict_check = {"components": [component_id]}
            response = test_client.post(
                f"/api/projects/{project_id}/locks/check-conflicts",
                json=conflict_check,
                headers=user2_headers,
            )
            assert response.status_code == 200

            conflict_data = response.json()["data"]
            assert len(conflict_data["conflicts"]) == 1
            assert conflict_data["conflicts"][0]["conflict_type"] == "already_locked"
            assert conflict_data["conflicts"][0]["can_override"] is False
            assert conflict_data["can_proceed"] is False

            # Step 3: User2 attempts to override (should fail due to hard lock)
            override_lock = {
                "id": f"lock_{component_id}_override",
                "componentId": component_id,
                "level": "soft",
                "type": "personal",
                "reason": "Attempting to override for urgent edit",
                "lockedBy": user2["id"],
                "lockedAt": datetime.now(timezone.utc).isoformat(),
                "sharedWith": [],
                "canOverride": True,
            }

            response = test_client.put(
                f"/api/projects/{component_id}/locks/{component_id}",
                json=override_lock,
                headers=user2_headers,
            )
            # Should still succeed but check that original lock remains
            WorkflowTestHelpers.verify_lock_state(
                test_client,
                user1_headers,
                project_id,
                component_id,
                {"lockedBy": user1["id"], "level": "hard"},
            )

            # Step 4: User1 upgrades to frozen lock
            lock_data["level"] = "frozen"
            lock_data["type"] = "editorial"
            lock_data["reason"] = "Final review - absolutely no changes"

            response = test_client.put(
                f"/api/projects/{project_id}/locks/{component_id}",
                json=lock_data,
                headers=user1_headers,
            )
            assert response.status_code == 200

            # Step 5: User2 checks conflicts again (should be even more restrictive)
            response = test_client.post(
                f"/api/projects/{project_id}/locks/check-conflicts",
                json=conflict_check,
                headers=user2_headers,
            )
            assert response.status_code == 200

            conflict_data = response.json()["data"]
            assert conflict_data["can_proceed"] is False
            existing_lock = conflict_data["conflicts"][0]["existing_lock"]
            assert existing_lock["level"] == "frozen"

            # Step 6: Simulate conflict resolution by User1 downgrading lock
            lock_data["level"] = "soft"
            lock_data["type"] = "collaborative"
            lock_data["reason"] = "Downgrading for collaboration"
            lock_data["canOverride"] = True
            lock_data["sharedWith"] = [user2["id"]]

            response = test_client.put(
                f"/api/projects/{project_id}/locks/{component_id}",
                json=lock_data,
                headers=user1_headers,
            )
            assert response.status_code == 200

            # Step 7: User2 can now proceed with collaboration
            response = test_client.post(
                f"/api/projects/{project_id}/locks/check-conflicts",
                json=conflict_check,
                headers=user2_headers,
            )
            assert response.status_code == 200

            conflict_data = response.json()["data"]
            if conflict_data["conflicts"]:
                assert conflict_data["conflicts"][0]["can_override"] is True
                assert conflict_data["can_proceed"] is True

            # Step 8: Verify resolution through audit trail
            response = test_client.get(
                f"/api/projects/{project_id}/locks/audit", headers=user1_headers
            )
            assert response.status_code == 200

            audit_trail = response.json()["audit"]
            assert len(audit_trail) >= 3  # Multiple lock state changes

        finally:
            # Cleanup
            WorkflowTestHelpers.cleanup_project_state(
                test_client, user1_headers, project_id, [component_id]
            )


class TestErrorRecoveryWorkflow:
    """Test error recovery and graceful degradation scenarios."""

    @pytest.mark.integration
    def test_error_recovery_and_graceful_degradation_workflow(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ) -> None:
        """
        Test error recovery mechanisms and graceful degradation.

        This test validates that the system can recover from various error
        conditions and continue operating with degraded functionality.

        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
        """
        project_id = "error_recovery_project"

        try:
            # Step 1: Test recovery from invalid lock data
            invalid_lock_data = {
                "id": "",  # Invalid empty ID
                "componentId": "error_comp_1",
                "level": "invalid_level",  # Invalid level
                "type": "invalid_type",  # Invalid type
                "reason": "",  # Empty reason
                "lockedBy": "",  # Empty user
                "lockedAt": "invalid_date",  # Invalid date
                "sharedWith": "not_a_list",  # Invalid type
                "canOverride": "not_boolean",  # Invalid type
            }

            response = test_client.put(
                f"/api/projects/{project_id}/locks/error_comp_1",
                json=invalid_lock_data,
                headers=auth_headers,
            )
            # Should handle gracefully, either 422 validation error or 200 with correction
            assert response.status_code in [200, 422]

            # Step 2: Test recovery from network/timeout simulation
            valid_lock = {
                "id": "lock_timeout_test",
                "componentId": "timeout_comp",
                "level": "soft",
                "type": "personal",
                "reason": "Testing timeout recovery",
                "lockedBy": "test-user-123",
                "lockedAt": datetime.now(timezone.utc).isoformat(),
                "sharedWith": [],
                "canOverride": True,
            }

            # Simulate slow operation with timeout
            import time

            start_time = time.time()
            response = test_client.put(
                f"/api/projects/{project_id}/locks/timeout_comp",
                json=valid_lock,
                headers=auth_headers,
            )
            end_time = time.time()

            # Should complete within reasonable time
            assert (end_time - start_time) < 5.0
            assert response.status_code == 200

            # Step 3: Test bulk operation error recovery
            bulk_request = {
                "operations": [
                    {
                        "type": "lock",
                        "componentIds": ["comp1", "comp2", "comp3"],
                        "lockLevel": "soft",
                        "reason": "Bulk lock test",
                    },
                    {
                        "type": "invalid_operation",  # Invalid operation type
                        "componentIds": ["comp4"],
                        "lockLevel": "soft",
                        "reason": "Should fail gracefully",
                    },
                    {
                        "type": "unlock",
                        "componentIds": ["nonexistent_comp"],  # Non-existent component
                        "reason": "Should handle missing component",
                    },
                ]
            }

            response = test_client.post(
                f"/api/projects/{project_id}/locks/bulk",
                json=bulk_request,
                headers=auth_headers,
            )
            assert response.status_code == 200

            results = response.json()["results"]
            # Should have partial success - some operations succeed, others fail gracefully
            assert len(results) >= 3
            success_count = sum(
                1 for r in results if r["status"] in ["locked", "unlocked"]
            )
            assert success_count >= 3  # At least the valid lock operations

            # Step 4: Test state consistency after errors
            response = test_client.get(
                f"/api/projects/{project_id}/locks", headers=auth_headers
            )
            assert response.status_code == 200

            locks = response.json()["locks"]
            # Should have the successfully created locks
            assert "comp1" in locks
            assert "comp2" in locks
            assert "comp3" in locks

            # Step 5: Test conflict resolution error recovery
            conflict_data = {"components": ["comp1", "nonexistent_comp", "comp2"]}

            response = test_client.post(
                f"/api/projects/{project_id}/locks/check-conflicts",
                json=conflict_data,
                headers=auth_headers,
            )
            assert response.status_code == 200

            # Should handle mixed existing/non-existing components gracefully
            conflict_result = response.json()["data"]
            assert "conflicts" in conflict_result

            # Step 6: Test audit trail consistency after errors
            response = test_client.get(
                f"/api/projects/{project_id}/locks/audit", headers=auth_headers
            )
            assert response.status_code == 200

            audit_data = response.json()
            assert "audit" in audit_data
            assert "count" in audit_data
            # Audit should contain records even when some operations failed
            assert audit_data["count"] > 0

        finally:
            # Cleanup - should work even after errors
            WorkflowTestHelpers.cleanup_project_state(
                test_client,
                auth_headers,
                project_id,
                ["error_comp_1", "timeout_comp", "comp1", "comp2", "comp3"],
            )


class TestPerformanceLoadWorkflow:
    """Test performance characteristics and load handling."""

    @pytest.mark.integration
    @pytest.mark.slow
    def test_high_load_concurrent_operations_workflow(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ) -> None:
        """
        Test system performance under high load with concurrent operations.

        This test validates that the system maintains performance and consistency
        when handling multiple concurrent lock operations from different users.

        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
        """
        import concurrent.futures

        project_id = "performance_test_project"
        num_concurrent_users = 10

        # Create multiple test users
        users = [
            WorkflowTestHelpers.create_mock_user(
                f"perf_user_{i}", f"user{i}", f"user{i}@example.com"
            )
            for i in range(num_concurrent_users)
        ]

        user_headers = [
            WorkflowTestHelpers.create_auth_headers_for_user(user) for user in users
        ]

        def create_locks_for_user(user_index: int) -> List[Dict[str, Any]]:
            """Create locks for a specific user."""
            results = []
            headers = user_headers[user_index]
            user_id = users[user_index]["id"]

            # Each user tries to lock 5 components
            for i in range(5):
                component_id = f"perf_comp_{user_index}_{i}"
                lock_data = {
                    "id": f"lock_{component_id}",
                    "componentId": component_id,
                    "level": "soft",
                    "type": "personal",
                    "reason": f"Performance test lock by user {user_index}",
                    "lockedBy": user_id,
                    "lockedAt": datetime.now(timezone.utc).isoformat(),
                    "sharedWith": [],
                    "canOverride": True,
                }

                try:
                    start_time = time.time()
                    response = test_client.put(
                        f"/api/projects/{project_id}/locks/{component_id}",
                        json=lock_data,
                        headers=headers,
                    )
                    end_time = time.time()

                    results.append(
                        {
                            "user_index": user_index,
                            "component_id": component_id,
                            "status_code": response.status_code,
                            "response_time": end_time - start_time,
                            "success": response.status_code == 200,
                        }
                    )
                except Exception as e:
                    results.append(
                        {
                            "user_index": user_index,
                            "component_id": component_id,
                            "status_code": 500,
                            "response_time": -1,
                            "success": False,
                            "error": str(e),
                        }
                    )

            return results

        try:
            # Step 1: Concurrent lock creation
            start_time = time.time()

            with concurrent.futures.ThreadPoolExecutor(
                max_workers=num_concurrent_users
            ) as executor:
                futures = [
                    executor.submit(create_locks_for_user, i)
                    for i in range(num_concurrent_users)
                ]

                all_results = []
                for future in concurrent.futures.as_completed(futures):
                    try:
                        results = future.result(timeout=30)  # 30 second timeout
                        all_results.extend(results)
                    except Exception as e:
                        print(f"Future failed: {e}")

            total_time = time.time() - start_time

            # Step 2: Analyze performance results
            successful_operations = [r for r in all_results if r["success"]]

            # Performance assertions
            success_rate = len(successful_operations) / len(all_results)
            assert success_rate >= 0.9, f"Success rate too low: {success_rate}"

            if successful_operations:
                avg_response_time = sum(
                    r["response_time"] for r in successful_operations
                ) / len(successful_operations)
                max_response_time = max(
                    r["response_time"] for r in successful_operations
                )

                assert avg_response_time < 2.0, (
                    f"Average response time too high: {avg_response_time}s"
                )
                assert max_response_time < 5.0, (
                    f"Max response time too high: {max_response_time}s"
                )

            assert total_time < 30.0, f"Total execution time too high: {total_time}s"

            # Step 3: Verify data consistency under load
            response = test_client.get(
                f"/api/projects/{project_id}/locks", headers=auth_headers
            )
            assert response.status_code == 200

            locks = response.json()["locks"]
            expected_locks = len(successful_operations)
            actual_locks = len(locks)

            # Allow some variance due to concurrency
            assert abs(actual_locks - expected_locks) <= 5, (
                f"Lock count mismatch: expected ~{expected_locks}, got {actual_locks}"
            )

            # Step 4: Test bulk operations under load
            def perform_bulk_operation(operation_index: int) -> Dict[str, Any]:
                """Perform bulk operation."""
                headers = user_headers[operation_index % len(user_headers)]

                bulk_request = {
                    "operations": [
                        {
                            "type": "change_level",
                            "componentIds": [
                                f"perf_comp_{operation_index}_{i}" for i in range(3)
                            ],
                            "lockLevel": "hard",
                            "reason": f"Bulk upgrade by operation {operation_index}",
                        }
                    ]
                }

                start_time = time.time()
                response = test_client.post(
                    f"/api/projects/{project_id}/locks/bulk",
                    json=bulk_request,
                    headers=headers,
                )
                end_time = time.time()

                return {
                    "operation_index": operation_index,
                    "status_code": response.status_code,
                    "response_time": end_time - start_time,
                    "success": response.status_code == 200,
                }

            # Concurrent bulk operations
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                bulk_futures = [
                    executor.submit(perform_bulk_operation, i) for i in range(10)
                ]

                bulk_results = []
                for future in concurrent.futures.as_completed(bulk_futures):
                    try:
                        result = future.result(timeout=15)
                        bulk_results.append(result)
                    except Exception as e:
                        print(f"Bulk operation failed: {e}")

            # Verify bulk operation performance
            if bulk_results:
                bulk_success_rate = sum(1 for r in bulk_results if r["success"]) / len(
                    bulk_results
                )
                assert bulk_success_rate >= 0.8, (
                    f"Bulk operation success rate too low: {bulk_success_rate}"
                )

        finally:
            # Cleanup all created locks
            cleanup_components = [
                f"perf_comp_{user_idx}_{comp_idx}"
                for user_idx in range(num_concurrent_users)
                for comp_idx in range(5)
            ]

            WorkflowTestHelpers.cleanup_project_state(
                test_client, auth_headers, project_id, cleanup_components
            )
