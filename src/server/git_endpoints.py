import os
import hmac
import hashlib
import logging
from datetime import datetime, UTC
from typing import Dict, Any
from fastapi import FastAPI, HTTPException, Query, Request, Header
from .git_manager import BFFGitManager

logger = logging.getLogger(__name__)

# Add after your existing imports and before app initialization
GIT_REPO_URL = os.getenv("GIT_REPO_URL", "https://github.com/example/novel.git")
GIT_BRANCH = os.getenv("GIT_BRANCH", "main")
GIT_SSH_KEY_PATH = os.getenv("GIT_SSH_KEY_PATH")
GITHUB_WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET", "")
GITLAB_WEBHOOK_TOKEN = os.getenv("GITLAB_WEBHOOK_TOKEN", "")

# Initialize git manager
git_manager = BFFGitManager(
    repo_url=GIT_REPO_URL,
    branch=GIT_BRANCH,
    ssh_key_path=GIT_SSH_KEY_PATH,
    cache_ttl=int(os.getenv("GIT_CACHE_TTL", "300")),
)


def setup_git_endpoints(app: FastAPI, manager):
    """Setup git endpoints on the FastAPI app."""

    # Add startup event to initialize git repository
    @app.on_event("startup")
    async def startup_event():
        """Initialize git repository on startup."""
        try:
            await git_manager.initialize()
            logger.info("Git repository initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize git repository: {e}")
            # Don't fail startup, but log the error

    # Git read endpoints
    @app.get("/api/git/characters")
    async def get_characters():
        """Get all characters from git repository."""
        try:
            characters = await git_manager.read_characters()
            return {"characters": characters, "count": len(characters)}
        except Exception as e:
            logger.error(f"Failed to read characters: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @app.get("/api/git/plot")
    async def get_plot_outline():
        """Get plot outline from git repository."""
        try:
            plot = await git_manager.read_plot_outline()
            return {"plot_outline": plot}
        except Exception as e:
            logger.error(f"Failed to read plot: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @app.get("/api/git/chapters")
    async def get_chapters():
        """Get list of all chapters."""
        try:
            chapters_dir = git_manager.local_path / "content" / "chapters"
            chapters = []

            if chapters_dir.exists():
                for chapter_dir in sorted(chapters_dir.iterdir()):
                    if chapter_dir.is_dir() and chapter_dir.name.startswith("chapter-"):
                        chapter_num = chapter_dir.name.replace("chapter-", "")
                        scene_count = len(list(chapter_dir.glob("scene-*.md")))
                        chapters.append(
                            {
                                "chapter": chapter_num,
                                "name": chapter_dir.name,
                                "scene_count": scene_count,
                            }
                        )

            return {"chapters": chapters}
        except Exception as e:
            logger.error(f"Failed to list chapters: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @app.get("/api/git/chapters/{chapter}/scenes")
    async def get_chapter_scenes(chapter: str):
        """Get all scenes for a chapter from git repository."""
        try:
            scenes = await git_manager.read_chapter_scenes(chapter)
            return {
                "chapter": chapter,
                "scenes": scenes,
                "count": len(scenes),
                "total_words": sum(s["word_count"] for s in scenes),
            }
        except Exception as e:
            logger.error(f"Failed to read scenes for chapter {chapter}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @app.get("/api/git/world")
    async def get_world_data():
        """Get world-building data from git repository."""
        try:
            world_data = await git_manager.read_world_data()
            return {"world": world_data}
        except Exception as e:
            logger.error(f"Failed to read world data: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @app.get("/api/git/info")
    async def get_repository_info():
        """Get information about the git repository."""
        try:
            info = await git_manager.get_repository_info()
            return info
        except Exception as e:
            logger.error(f"Failed to get repository info: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @app.get("/api/git/search")
    async def search_content(q: str = Query(..., description="Search query")):
        """Search for content in the repository."""
        try:
            results = await git_manager.search_content(q)
            return {"query": q, "results": results, "count": len(results)}
        except Exception as e:
            logger.error(f"Failed to search content: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # Webhook endpoints
    def verify_github_signature(payload: bytes, signature: str, secret: str) -> bool:
        """Verify GitHub webhook signature."""
        if not signature.startswith("sha256="):
            return False

        expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()

        return hmac.compare_digest(signature[7:], expected)

    @app.post("/api/webhooks/github")
    async def handle_github_webhook(
        request: Request, x_hub_signature_256: str = Header(None)
    ):
        """Handle GitHub webhook notifications."""
        if not GITHUB_WEBHOOK_SECRET:
            raise HTTPException(status_code=403, detail="Webhook secret not configured")

        # Get raw payload
        payload = await request.body()

        # Verify signature
        if not verify_github_signature(
            payload, x_hub_signature_256, GITHUB_WEBHOOK_SECRET
        ):
            raise HTTPException(status_code=403, detail="Invalid signature")

        # Parse payload
        data = await request.json()
        event_type = request.headers.get("X-GitHub-Event", "")

        # Handle push events
        if event_type == "push":
            branch = data.get("ref", "").replace("refs/heads/", "")
            if branch == git_manager.branch:
                logger.info(f"Received push event for branch {branch}")

                # Pull latest changes
                try:
                    await git_manager.pull_and_invalidate_cache()

                    # Broadcast update to connected clients
                    await manager.broadcast_to_project(
                        {
                            "channel": "git_update",
                            "data": {
                                "type": "push",
                                "branch": branch,
                                "commit": data.get("after"),
                                "timestamp": datetime.now(UTC).isoformat(),
                            },
                        },
                        "all",  # Broadcast to all projects
                    )

                    return {"status": "success", "message": "Repository updated"}
                except Exception as e:
                    logger.error(f"Failed to pull changes: {e}")
                    return {"status": "error", "message": str(e)}

        return {"status": "ignored", "event": event_type}

    @app.post("/api/webhooks/gitlab")
    async def handle_gitlab_webhook(
        request: Request, x_gitlab_token: str = Header(None)
    ):
        """Handle GitLab webhook notifications."""
        if not GITLAB_WEBHOOK_TOKEN:
            raise HTTPException(status_code=403, detail="Webhook token not configured")

        # Verify token
        if x_gitlab_token != GITLAB_WEBHOOK_TOKEN:
            raise HTTPException(status_code=403, detail="Invalid token")

        # Parse payload
        data = await request.json()
        event_type = data.get("object_kind", "")

        # Handle push events
        if event_type == "push":
            branch = data.get("ref", "").replace("refs/heads/", "")
            if branch == git_manager.branch:
                logger.info(f"Received push event for branch {branch}")

                # Pull latest changes
                try:
                    await git_manager.pull_and_invalidate_cache()

                    # Broadcast update
                    await manager.broadcast_to_project(
                        {
                            "channel": "git_update",
                            "data": {
                                "type": "push",
                                "branch": branch,
                                "commit": data.get("after"),
                                "timestamp": datetime.now(UTC).isoformat(),
                            },
                        },
                        "all",
                    )

                    return {"status": "success", "message": "Repository updated"}
                except Exception as e:
                    logger.error(f"Failed to pull changes: {e}")
                    return {"status": "error", "message": str(e)}

        return {"status": "ignored", "event": event_type}

    # Agent progress endpoint (for backend to notify BFF)
    @app.post("/api/agent-progress/{project_id}")
    async def receive_agent_progress(project_id: str, progress_data: Dict[str, Any]):
        """
        Receive progress updates from backend and broadcast via WebSocket.

        This endpoint is called by the backend agent execution service
        to send real-time progress updates to connected clients.
        """
        # Broadcast to all clients subscribed to this project
        await manager.broadcast_to_project(
            {"channel": f"agent_progress:{project_id}", "data": progress_data},
            project_id,
        )

        # If generation completed, trigger cache invalidation
        if progress_data.get("status") == "completed":
            try:
                await git_manager.pull_and_invalidate_cache()
                logger.info("Cache invalidated after content generation")
            except Exception as e:
                logger.error(f"Failed to invalidate cache: {e}")

        return {"status": "broadcasted", "project_id": project_id}
