"""Git repository manager for BFF read operations."""

import asyncio
import os
import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import aiofiles
import yaml

logger = logging.getLogger(__name__)


class BFFGitManager:
    """Manages read-only git operations for the BFF server."""

    def __init__(
        self,
        repo_url: str,
        local_path: str = "/tmp/plotweaver-bff-repo",
        branch: str = "main",
        ssh_key_path: Optional[str] = None,
        cache_ttl: int = 300,  # 5 minutes
    ):
        self.repo_url = repo_url
        self.local_path = Path(local_path)
        self.branch = branch
        self.ssh_key_path = ssh_key_path
        self.cache_ttl = cache_ttl
        self._cache: Dict[str, Any] = {}
        self._cache_timestamps: Dict[str, datetime] = {}
        self._lock = asyncio.Lock()
        self._initialized = False

    async def initialize(self):
        """Initialize the repository (clone if needed)."""
        async with self._lock:
            if self._initialized:
                return

            if not self.local_path.exists():
                await self._clone_repository()
            else:
                await self._pull_latest()

            self._initialized = True
            logger.info(f"Git repository initialized at {self.local_path}")

    async def _clone_repository(self):
        """Clone the repository."""
        logger.info(f"Cloning repository from {self.repo_url}")

        env = os.environ.copy()
        if self.ssh_key_path:
            env["GIT_SSH_COMMAND"] = (
                f"ssh -i {self.ssh_key_path} -o StrictHostKeyChecking=no"
            )

        cmd = [
            "git",
            "clone",
            "--depth",
            "1",
            "--branch",
            self.branch,
            self.repo_url,
            str(self.local_path),
        ]

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            env=env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        stdout, stderr = await proc.communicate()

        if proc.returncode != 0:
            raise RuntimeError(f"Git clone failed: {stderr.decode()}")

    async def _pull_latest(self):
        """Pull latest changes from remote."""
        logger.info("Pulling latest changes")

        env = os.environ.copy()
        if self.ssh_key_path:
            env["GIT_SSH_COMMAND"] = (
                f"ssh -i {self.ssh_key_path} -o StrictHostKeyChecking=no"
            )

        cmd = ["git", "pull", "origin", self.branch]

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=self.local_path,
            env=env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        stdout, stderr = await proc.communicate()

        if proc.returncode != 0:
            logger.error(f"Git pull failed: {stderr.decode()}")
            raise RuntimeError(f"Git pull failed: {stderr.decode()}")

    async def pull_and_invalidate_cache(self):
        """Pull latest changes and invalidate cache."""
        async with self._lock:
            await self._pull_latest()
            self._cache.clear()
            self._cache_timestamps.clear()
            logger.info("Repository updated and cache invalidated")

    def _is_cache_valid(self, key: str) -> bool:
        """Check if cache entry is still valid."""
        if key not in self._cache_timestamps:
            return False

        age = datetime.now() - self._cache_timestamps[key]
        return age.total_seconds() < self.cache_ttl

    def _set_cache(self, key: str, value: Any):
        """Set cache value."""
        self._cache[key] = value
        self._cache_timestamps[key] = datetime.now()

    async def read_characters(self) -> Dict[str, Any]:
        """Read all character files from repository."""
        cache_key = "characters"

        if self._is_cache_valid(cache_key):
            return self._cache[cache_key]

        characters = {}
        char_dir = self.local_path / "characters"

        if char_dir.exists():
            for char_file in char_dir.glob("*.json"):
                try:
                    async with aiofiles.open(char_file, mode="r") as f:
                        content = await f.read()
                        characters[char_file.stem] = json.loads(content)
                except Exception as e:
                    logger.error(f"Failed to read character file {char_file}: {e}")

        self._set_cache(cache_key, characters)
        return characters

    async def read_plot_outline(self) -> Dict[str, Any]:
        """Read plot outline from repository."""
        cache_key = "plot_outline"

        if self._is_cache_valid(cache_key):
            return self._cache[cache_key]

        plot_file = self.local_path / "plot" / "outline.json"
        plot_data = {}

        if plot_file.exists():
            try:
                async with aiofiles.open(plot_file, mode="r") as f:
                    content = await f.read()
                    plot_data = json.loads(content)
            except Exception as e:
                logger.error(f"Failed to read plot outline: {e}")

        self._set_cache(cache_key, plot_data)
        return plot_data

    async def read_chapter_scenes(self, chapter: str) -> List[Dict[str, Any]]:
        """Read all scenes for a chapter."""
        cache_key = f"chapter_scenes_{chapter}"

        if self._is_cache_valid(cache_key):
            return self._cache[cache_key]

        scenes = []
        chapter_dir = self.local_path / "content" / "chapters" / chapter

        if chapter_dir.exists():
            for scene_file in sorted(chapter_dir.glob("scene-*.md")):
                try:
                    async with aiofiles.open(scene_file, mode="r") as f:
                        content = await f.read()

                    # Parse scene metadata from filename
                    parts = scene_file.stem.split("-", 2)
                    scene_num = int(parts[1]) if len(parts) > 1 else 0
                    scene_title = parts[2] if len(parts) > 2 else "Untitled"

                    scenes.append(
                        {
                            "scene_number": scene_num,
                            "title": scene_title.replace("-", " ").title(),
                            "filename": scene_file.name,
                            "content": content,
                            "word_count": len(content.split()),
                            "path": str(scene_file.relative_to(self.local_path)),
                        }
                    )
                except Exception as e:
                    logger.error(f"Failed to read scene file {scene_file}: {e}")

        # Sort by scene number
        scenes.sort(key=lambda x: x["scene_number"])

        self._set_cache(cache_key, scenes)
        return scenes

    async def read_world_data(self) -> Dict[str, Any]:
        """Read world-building data from repository."""
        cache_key = "world_data"

        if self._is_cache_valid(cache_key):
            return self._cache[cache_key]

        world_data = {}
        world_dir = self.local_path / "world"

        if world_dir.exists():
            # Read JSON files
            for world_file in world_dir.glob("*.json"):
                try:
                    async with aiofiles.open(world_file, mode="r") as f:
                        content = await f.read()
                        world_data[world_file.stem] = json.loads(content)
                except Exception as e:
                    logger.error(f"Failed to read world file {world_file}: {e}")

            # Read YAML files
            for world_file in world_dir.glob("*.yaml"):
                try:
                    async with aiofiles.open(world_file, mode="r") as f:
                        content = await f.read()
                        world_data[world_file.stem] = yaml.safe_load(content)
                except Exception as e:
                    logger.error(f"Failed to read world file {world_file}: {e}")

        self._set_cache(cache_key, world_data)
        return world_data

    async def get_repository_info(self) -> Dict[str, Any]:
        """Get information about the repository."""
        info = {
            "url": self.repo_url,
            "branch": self.branch,
            "local_path": str(self.local_path),
            "last_pull": None,
            "commit_hash": None,
            "commit_message": None,
            "commit_author": None,
            "commit_date": None,
        }

        if self.local_path.exists():
            # Get last commit info
            cmd = ["git", "log", "-1", "--format=%H|%an|%ae|%at|%s"]
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=self.local_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            stdout, stderr = await proc.communicate()

            if proc.returncode == 0:
                parts = stdout.decode().strip().split("|")
                if len(parts) >= 5:
                    info.update(
                        {
                            "commit_hash": parts[0],
                            "commit_author": parts[1],
                            "commit_author_email": parts[2],
                            "commit_date": datetime.fromtimestamp(
                                int(parts[3])
                            ).isoformat(),
                            "commit_message": parts[4],
                        }
                    )

        return info

    async def search_content(
        self, query: str, file_pattern: str = "*.md"
    ) -> List[Dict[str, Any]]:
        """Search for content in the repository."""
        results = []

        # Simple grep-based search
        cmd = [
            "grep",
            "-r",
            "-i",
            "-n",
            "--include",
            file_pattern,
            query,
            str(self.local_path),
        ]

        proc = await asyncio.create_subprocess_exec(
            *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await proc.communicate()

        if proc.returncode == 0:
            lines = stdout.decode().strip().split("\n")
            for line in lines[:20]:  # Limit to 20 results
                if ":" in line:
                    parts = line.split(":", 2)
                    if len(parts) >= 3:
                        file_path = Path(parts[0])
                        line_number = parts[1]
                        content = parts[2].strip()

                        results.append(
                            {
                                "file": str(file_path.relative_to(self.local_path)),
                                "line": int(line_number),
                                "content": content[:200],  # Limit content length
                            }
                        )

        return results
