"""
Git read operations endpoints for PlotWeaver BFF.
These endpoints handle reading from the local git repository cache.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any

# from ..auth.jwt_auth import get_current_user  # TODO: Implement authentication
from server.git_manager import BFFGitManager

router = APIRouter()

# Initialize git manager instance
git_manager = BFFGitManager(repo_url="")


@router.get("/api/git/content/{project_id}/{file_path:path}")
async def get_file_content(
    project_id: str,
    file_path: str,
    ref: Optional[str] = None,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
) -> Dict[str, Any]:
    """
    Get file content from the local git repository.

    Args:
        project_id: The project identifier
        file_path: Path to the file within the repository
        ref: Optional git ref (branch, tag, commit) to read from

    Returns:
        Dict containing file content and metadata
    """
    try:
        result = await git_manager.get_file_content(project_id, file_path)
        return result

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File {file_path} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/git/tree/{project_id}")
async def get_project_tree(
    project_id: str,
    path: Optional[str] = "",
    ref: Optional[str] = None,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
) -> Dict[str, Any]:
    """
    Get directory tree from the local git repository.

    Args:
        project_id: The project identifier
        path: Optional subdirectory path
        ref: Optional git ref to read from

    Returns:
        Dict containing tree structure
    """
    try:
        tree = await git_manager.get_tree(project_id, path or "")
        return tree

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/git/diff/{project_id}")
async def get_diff(
    project_id: str,
    base_ref: Optional[str] = None,
    head_ref: Optional[str] = "HEAD",
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
) -> Dict[str, Any]:
    """
    Get diff between two refs in the repository.

    Args:
        project_id: The project identifier
        base_ref: Base reference for comparison (defaults to HEAD~1)
        head_ref: Head reference for comparison (defaults to HEAD)

    Returns:
        Dict containing diff information
    """
    try:
        diff = await git_manager.get_diff(project_id, base_ref or "HEAD~1", head_ref)
        return diff

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/git/history/{project_id}/{file_path:path}")
async def get_file_history(
    project_id: str,
    file_path: str,
    limit: int = 10,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
) -> Dict[str, Any]:
    """
    Get commit history for a specific file.

    Args:
        project_id: The project identifier
        file_path: Path to the file
        limit: Maximum number of commits to return

    Returns:
        Dict containing commit history
    """
    try:
        history = await git_manager.get_file_history(project_id, file_path, limit)
        return {
            "history": history,
            "file_path": file_path,
            "project_id": project_id,
        }

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File {file_path} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Specialized content endpoints for PlotWeaver
# These endpoints read specific file patterns from the repository
@router.get("/api/git/characters/{project_id}")
async def get_characters(
    project_id: str,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
) -> Dict[str, Any]:
    """Get all character files from the repository."""
    try:
        # Read character files from characters/ directory
        tree = await git_manager.get_tree(project_id, "characters")
        characters = []

        for item in tree:
            if item["type"] == "file" and item["name"].endswith(
                (".yaml", ".yml", ".json")
            ):
                content = await git_manager.get_file_content(project_id, item["path"])
                characters.append(
                    {
                        "name": item["name"]
                        .replace(".yaml", "")
                        .replace(".yml", "")
                        .replace(".json", ""),
                        "path": item["path"],
                        "content": content["content"],
                    }
                )

        return {
            "characters": characters,
            "project_id": project_id,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/git/scenes/{project_id}")
async def get_scenes(
    project_id: str,
    chapter: Optional[str] = None,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
) -> Dict[str, Any]:
    """Get scene files, optionally filtered by chapter."""
    try:
        # Read scene files from scenes/ directory
        path = f"scenes/{chapter}" if chapter else "scenes"
        tree = await git_manager.get_tree(project_id, path)
        scenes = []

        for item in tree:
            if item["type"] == "file" and item["name"].endswith(".md"):
                content = await git_manager.get_file_content(project_id, item["path"])
                scenes.append(
                    {
                        "name": item["name"].replace(".md", ""),
                        "path": item["path"],
                        "content": content["content"],
                    }
                )

        return {
            "scenes": scenes,
            "project_id": project_id,
            "chapter": chapter,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/git/worldbuilding/{project_id}")
async def get_worldbuilding(
    project_id: str,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
) -> Dict[str, Any]:
    """Get worldbuilding data from the repository."""
    try:
        # Read worldbuilding files from worldbuilding/ directory
        tree = await git_manager.get_tree(project_id, "worldbuilding")
        worldbuilding = {}

        for item in tree:
            if item["type"] == "file" and item["name"].endswith(
                (".yaml", ".yml", ".json")
            ):
                content = await git_manager.get_file_content(project_id, item["path"])
                category = (
                    item["name"]
                    .replace(".yaml", "")
                    .replace(".yml", "")
                    .replace(".json", "")
                )
                worldbuilding[category] = content["content"]

        return {
            "worldbuilding": worldbuilding,
            "project_id": project_id,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
