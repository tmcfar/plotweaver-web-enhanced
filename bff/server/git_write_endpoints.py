"""
Git write operations endpoints for PlotWeaver BFF.
These endpoints handle file modifications, commits, and branch operations.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from ..auth.jwt_auth import get_current_user
from ..services.git_manager import BFFGitManager
from ..server.main import enhanced_connection_manager

router = APIRouter()


# Request Models
class FileCreateRequest(BaseModel):
    path: str
    content: str
    encoding: str = "utf-8"


class FileUpdateRequest(BaseModel):
    content: str
    encoding: str = "utf-8"


class CommitRequest(BaseModel):
    message: str
    author_name: Optional[str] = None
    author_email: Optional[str] = None
    files: List[str] = []


class StageRequest(BaseModel):
    files: List[str]


class BranchCreateRequest(BaseModel):
    name: str
    source_branch: Optional[str] = None


class BranchSwitchRequest(BaseModel):
    branch_name: str
    create_if_missing: bool = False


class PushRequest(BaseModel):
    branch: Optional[str] = None
    force: bool = False
    remote: str = "origin"


# Response Models
class GitOperationResponse(BaseModel):
    success: bool
    message: str
    operation_id: Optional[str] = None
    files_affected: List[str] = []


class CommitResponse(GitOperationResponse):
    commit_hash: str
    author: str
    timestamp: str


# File Operations
@router.post("/api/git/files/{project_id}", response_model=GitOperationResponse)
async def create_file(
    project_id: str,
    request: FileCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """Create a new file in the git repository."""
    try:
        git_manager = BFFGitManager.get_instance()

        # Create the file
        success = await git_manager.create_file(
            project_id=project_id,
            file_path=request.path,
            content=request.content,
            encoding=request.encoding,
        )

        if success:
            # Broadcast file creation to WebSocket subscribers
            background_tasks.add_task(
                broadcast_file_change,
                project_id=project_id,
                file_path=request.path,
                change_type="created",
                user_id=current_user["id"],
            )

            return GitOperationResponse(
                success=True,
                message=f"File {request.path} created successfully",
                files_affected=[request.path],
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to create file")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put(
    "/api/git/files/{project_id}/{file_path:path}", response_model=GitOperationResponse
)
async def update_file(
    project_id: str,
    file_path: str,
    request: FileUpdateRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """Update an existing file in the git repository."""
    try:
        git_manager = BFFGitManager.get_instance()

        # Update the file
        success = await git_manager.update_file(
            project_id=project_id,
            file_path=file_path,
            content=request.content,
            encoding=request.encoding,
        )

        if success:
            # Broadcast file update to WebSocket subscribers
            background_tasks.add_task(
                broadcast_file_change,
                project_id=project_id,
                file_path=file_path,
                change_type="modified",
                user_id=current_user["id"],
            )

            return GitOperationResponse(
                success=True,
                message=f"File {file_path} updated successfully",
                files_affected=[file_path],
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to update file")

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File {file_path} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete(
    "/api/git/files/{project_id}/{file_path:path}", response_model=GitOperationResponse
)
async def delete_file(
    project_id: str,
    file_path: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """Delete a file from the git repository."""
    try:
        git_manager = BFFGitManager.get_instance()

        # Delete the file
        success = await git_manager.delete_file(
            project_id=project_id, file_path=file_path
        )

        if success:
            # Broadcast file deletion to WebSocket subscribers
            background_tasks.add_task(
                broadcast_file_change,
                project_id=project_id,
                file_path=file_path,
                change_type="deleted",
                user_id=current_user["id"],
            )

            return GitOperationResponse(
                success=True,
                message=f"File {file_path} deleted successfully",
                files_affected=[file_path],
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to delete file")

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File {file_path} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Staging Operations
@router.post("/api/git/stage/{project_id}", response_model=GitOperationResponse)
async def stage_files(
    project_id: str,
    request: StageRequest,
    current_user: dict = Depends(get_current_user),
):
    """Stage files for commit."""
    try:
        git_manager = BFFGitManager.get_instance()

        success = await git_manager.stage_files(
            project_id=project_id, files=request.files
        )

        if success:
            return GitOperationResponse(
                success=True,
                message=f"Staged {len(request.files)} files",
                files_affected=request.files,
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to stage files")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/git/unstage/{project_id}", response_model=GitOperationResponse)
async def unstage_files(
    project_id: str,
    request: StageRequest,
    current_user: dict = Depends(get_current_user),
):
    """Unstage files from the staging area."""
    try:
        git_manager = BFFGitManager.get_instance()

        success = await git_manager.unstage_files(
            project_id=project_id, files=request.files
        )

        if success:
            return GitOperationResponse(
                success=True,
                message=f"Unstaged {len(request.files)} files",
                files_affected=request.files,
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to unstage files")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Commit Operations
@router.post("/api/git/commit/{project_id}", response_model=CommitResponse)
async def create_commit(
    project_id: str,
    request: CommitRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """Create a git commit with staged changes."""
    try:
        git_manager = BFFGitManager.get_instance()

        # Use current user info if not provided
        author_name = request.author_name or current_user.get("username", "Unknown")
        author_email = request.author_email or current_user.get(
            "email", "unknown@example.com"
        )

        commit_hash = await git_manager.create_commit(
            project_id=project_id,
            message=request.message,
            author_name=author_name,
            author_email=author_email,
            files=request.files if request.files else None,
        )

        if commit_hash:
            # Broadcast commit to WebSocket subscribers
            background_tasks.add_task(
                broadcast_git_update,
                project_id=project_id,
                operation="commit",
                files=request.files,
                user_id=current_user["id"],
                commit_hash=commit_hash,
            )

            return CommitResponse(
                success=True,
                message="Commit created successfully",
                commit_hash=commit_hash,
                author=f"{author_name} <{author_email}>",
                timestamp=datetime.utcnow().isoformat(),
                files_affected=request.files,
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to create commit")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Branch Operations
@router.post("/api/git/branches/{project_id}", response_model=GitOperationResponse)
async def create_branch(
    project_id: str,
    request: BranchCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """Create a new git branch."""
    try:
        git_manager = BFFGitManager.get_instance()

        success = await git_manager.create_branch(
            project_id=project_id,
            name=request.name,
            source_branch=request.source_branch,
        )

        if success:
            # Broadcast branch creation to WebSocket subscribers
            background_tasks.add_task(
                broadcast_branch_change,
                project_id=project_id,
                branch_name=request.name,
                operation="created",
                user_id=current_user["id"],
            )

            return GitOperationResponse(
                success=True, message=f"Branch {request.name} created successfully"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to create branch")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put(
    "/api/git/branches/{project_id}/switch", response_model=GitOperationResponse
)
async def switch_branch(
    project_id: str,
    request: BranchSwitchRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """Switch to a different branch."""
    try:
        git_manager = BFFGitManager.get_instance()

        success = await git_manager.switch_branch(
            project_id=project_id,
            branch_name=request.branch_name,
            create_if_missing=request.create_if_missing,
        )

        if success:
            # Broadcast branch switch to WebSocket subscribers
            background_tasks.add_task(
                broadcast_branch_change,
                project_id=project_id,
                branch_name=request.branch_name,
                operation="switched",
                user_id=current_user["id"],
            )

            return GitOperationResponse(
                success=True, message=f"Switched to branch {request.branch_name}"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to switch branch")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/git/push/{project_id}", response_model=GitOperationResponse)
async def push_changes(
    project_id: str,
    request: PushRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """Push changes to remote repository."""
    try:
        git_manager = BFFGitManager.get_instance()

        success = await git_manager.push_changes(
            project_id=project_id,
            branch=request.branch,
            remote=request.remote,
            force=request.force,
        )

        if success:
            # Broadcast push to WebSocket subscribers
            background_tasks.add_task(
                broadcast_git_update,
                project_id=project_id,
                operation="push",
                files=[],
                user_id=current_user["id"],
            )

            return GitOperationResponse(
                success=True, message=f"Changes pushed successfully to {request.remote}"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to push changes")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# WebSocket Broadcasting Functions
async def broadcast_file_change(
    project_id: str, file_path: str, change_type: str, user_id: str
):
    """Broadcast file changes to WebSocket subscribers."""
    message = {
        "type": "file_changed",
        "project_id": project_id,
        "file_path": file_path,
        "change_type": change_type,
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat(),
    }

    await enhanced_connection_manager.broadcast_to_project(project_id, message)


async def broadcast_git_update(
    project_id: str,
    operation: str,
    files: List[str],
    user_id: str,
    commit_hash: Optional[str] = None,
):
    """Broadcast git operations to WebSocket subscribers."""
    message = {
        "type": "git_update",
        "project_id": project_id,
        "operation": operation,
        "updated_files": files,
        "user_id": user_id,
        "commit_hash": commit_hash,
        "timestamp": datetime.utcnow().isoformat(),
    }

    await enhanced_connection_manager.broadcast_to_project(project_id, message)


async def broadcast_branch_change(
    project_id: str, branch_name: str, operation: str, user_id: str
):
    """Broadcast branch operations to WebSocket subscribers."""
    message = {
        "type": "branch_changed",
        "project_id": project_id,
        "branch_name": branch_name,
        "operation": operation,
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat(),
    }

    await enhanced_connection_manager.broadcast_to_project(project_id, message)
