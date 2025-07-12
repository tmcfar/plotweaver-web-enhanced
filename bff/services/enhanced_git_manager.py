"""
Enhanced Git Manager for PlotWeaver BFF.
Extends the existing GitRepoManager with write operations and advanced features.
"""

import git
from typing import List, Dict, Optional, Union
from pathlib import Path
import logging

from .git_manager import GitRepoManager

logger = logging.getLogger(__name__)


class EnhancedGitRepoManager(GitRepoManager):
    """Extended GitRepoManager with write operations and advanced git features."""

    def __init__(self, repo_path: str):
        super().__init__(repo_path)
        self.repo_path = Path(repo_path)

        # Ensure we have a valid git repository
        if not self.repo_path.exists():
            raise FileNotFoundError(f"Repository path {repo_path} does not exist")

        try:
            self.repo = git.Repo(repo_path)
        except git.exc.InvalidGitRepositoryError:
            raise ValueError(f"Invalid git repository at {repo_path}")

    # File Operations
    async def create_file(
        self, file_path: str, content: str, encoding: str = "utf-8"
    ) -> bool:
        """Create a new file in the repository."""
        try:
            full_path = self.repo_path / file_path

            # Create parent directories if they don't exist
            full_path.parent.mkdir(parents=True, exist_ok=True)

            # Check if file already exists
            if full_path.exists():
                raise FileExistsError(f"File {file_path} already exists")

            # Write the file
            with open(full_path, "w", encoding=encoding) as f:
                f.write(content)

            logger.info(f"Created file: {file_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to create file {file_path}: {str(e)}")
            raise

    async def update_file(
        self, file_path: str, content: str, encoding: str = "utf-8"
    ) -> bool:
        """Update an existing file in the repository."""
        try:
            full_path = self.repo_path / file_path

            # Check if file exists
            if not full_path.exists():
                raise FileNotFoundError(f"File {file_path} not found")

            # Write the updated content
            with open(full_path, "w", encoding=encoding) as f:
                f.write(content)

            logger.info(f"Updated file: {file_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to update file {file_path}: {str(e)}")
            raise

    async def delete_file(self, file_path: str) -> bool:
        """Delete a file from the repository."""
        try:
            full_path = self.repo_path / file_path

            # Check if file exists
            if not full_path.exists():
                raise FileNotFoundError(f"File {file_path} not found")

            # Remove the file
            full_path.unlink()

            logger.info(f"Deleted file: {file_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete file {file_path}: {str(e)}")
            raise

    # Staging Operations
    async def stage_files(self, files: List[str]) -> bool:
        """Stage files for commit."""
        try:
            # Validate files exist
            for file_path in files:
                full_path = self.repo_path / file_path
                if not full_path.exists():
                    raise FileNotFoundError(f"File {file_path} not found")

            # Stage the files
            self.repo.index.add(files)

            logger.info(f"Staged {len(files)} files: {files}")
            return True

        except Exception as e:
            logger.error(f"Failed to stage files {files}: {str(e)}")
            raise

    async def unstage_files(self, files: List[str]) -> bool:
        """Unstage files from the staging area."""
        try:
            # Reset the specified files
            self.repo.index.reset(paths=files)

            logger.info(f"Unstaged {len(files)} files: {files}")
            return True

        except Exception as e:
            logger.error(f"Failed to unstage files {files}: {str(e)}")
            raise

    async def get_staged_files(self) -> List[str]:
        """Get list of currently staged files."""
        try:
            staged_files = []

            # Get staged files from index
            for (path, stage), blob_info in self.repo.index.entries.items():
                if stage == 0:  # Stage 0 means staged for commit
                    staged_files.append(str(path))

            return staged_files

        except Exception as e:
            logger.error(f"Failed to get staged files: {str(e)}")
            raise

    # Commit Operations
    async def create_commit(
        self,
        message: str,
        author_name: str,
        author_email: str,
        files: Optional[List[str]] = None,
    ) -> str:
        """Create a git commit."""
        try:
            # Stage specific files if provided
            if files:
                await self.stage_files(files)

            # Check if there are any staged changes
            if not self.repo.index.diff("HEAD"):
                raise ValueError("No changes to commit")

            # Create actor objects
            actor = git.Actor(author_name, author_email)

            # Create the commit
            commit = self.repo.index.commit(message, author=actor, committer=actor)

            logger.info(f"Created commit {commit.hexsha}: {message}")
            return commit.hexsha

        except Exception as e:
            logger.error(f"Failed to create commit: {str(e)}")
            raise

    # Branch Operations
    async def create_branch(
        self, name: str, source_branch: Optional[str] = None
    ) -> bool:
        """Create a new branch."""
        try:
            # Check if branch already exists
            if name in [head.name for head in self.repo.heads]:
                raise ValueError(f"Branch {name} already exists")

            # Create branch from source or current HEAD
            if source_branch:
                if source_branch not in [head.name for head in self.repo.heads]:
                    raise ValueError(f"Source branch {source_branch} not found")
                source = self.repo.heads[source_branch]
                self.repo.create_head(name, source)
            else:
                self.repo.create_head(name)

            logger.info(f"Created branch: {name}")
            return True

        except Exception as e:
            logger.error(f"Failed to create branch {name}: {str(e)}")
            raise

    async def switch_branch(
        self, branch_name: str, create_if_missing: bool = False
    ) -> bool:
        """Switch to a different branch."""
        try:
            # Check if branch exists
            if branch_name not in [head.name for head in self.repo.heads]:
                if create_if_missing:
                    await self.create_branch(branch_name)
                else:
                    raise ValueError(f"Branch {branch_name} not found")

            # Check for uncommitted changes
            if self.repo.is_dirty():
                raise ValueError("Cannot switch branch with uncommitted changes")

            # Switch to the branch
            branch = self.repo.heads[branch_name]
            branch.checkout()

            logger.info(f"Switched to branch: {branch_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to switch to branch {branch_name}: {str(e)}")
            raise

    async def delete_branch(self, branch_name: str, force: bool = False) -> bool:
        """Delete a git branch."""
        try:
            # Check if branch exists
            if branch_name not in [head.name for head in self.repo.heads]:
                raise ValueError(f"Branch {branch_name} not found")

            # Cannot delete current branch
            if branch_name == self.repo.active_branch.name:
                raise ValueError("Cannot delete current branch")

            # Delete the branch
            branch = self.repo.heads[branch_name]
            self.repo.delete_head(branch, force=force)

            logger.info(f"Deleted branch: {branch_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete branch {branch_name}: {str(e)}")
            raise

    async def merge_branch(
        self,
        source_branch: str,
        target_branch: str = None,
        message: Optional[str] = None,
    ) -> bool:
        """Merge a branch into target branch (or current branch)."""
        try:
            # Use current branch as target if not specified
            if target_branch is None:
                target_branch = self.repo.active_branch.name

            # Switch to target branch if not already there
            if self.repo.active_branch.name != target_branch:
                await self.switch_branch(target_branch)

            # Check if source branch exists
            if source_branch not in [head.name for head in self.repo.heads]:
                raise ValueError(f"Source branch {source_branch} not found")

            # Get source branch
            source = self.repo.heads[source_branch]

            # Perform merge
            merge_msg = (
                message or f"Merge branch '{source_branch}' into '{target_branch}'"
            )

            # Use git command for merge to handle conflicts properly
            try:
                self.repo.git.merge(source, m=merge_msg)
                logger.info(f"Merged branch {source_branch} into {target_branch}")
                return True

            except git.exc.GitCommandError as e:
                if "conflict" in str(e).lower():
                    raise ValueError(f"Merge conflict occurred: {str(e)}")
                else:
                    raise ValueError(f"Merge failed: {str(e)}")

        except Exception as e:
            logger.error(f"Failed to merge branch {source_branch}: {str(e)}")
            raise

    # Remote Operations
    async def push_changes(
        self, branch: Optional[str] = None, remote: str = "origin", force: bool = False
    ) -> bool:
        """Push changes to remote repository."""
        try:
            # Check if remote exists
            if remote not in [r.name for r in self.repo.remotes]:
                raise ValueError(f"Remote {remote} not found")

            origin = self.repo.remotes[remote]

            # Push specific branch or current branch
            if branch:
                # Check if branch exists
                if branch not in [head.name for head in self.repo.heads]:
                    raise ValueError(f"Branch {branch} not found")
                origin.push(branch, force=force)
            else:
                # Push current branch
                current_branch = self.repo.active_branch.name
                origin.push(current_branch, force=force)

            logger.info(f"Pushed changes to {remote}")
            return True

        except Exception as e:
            logger.error(f"Failed to push changes: {str(e)}")
            raise

    async def pull_changes(
        self, branch: Optional[str] = None, remote: str = "origin"
    ) -> bool:
        """Pull changes from remote repository."""
        try:
            # Check if remote exists
            if remote not in [r.name for r in self.repo.remotes]:
                raise ValueError(f"Remote {remote} not found")

            origin = self.repo.remotes[remote]

            # Pull specific branch or current branch
            if branch:
                origin.pull(branch)
            else:
                origin.pull()

            logger.info(f"Pulled changes from {remote}")
            return True

        except Exception as e:
            logger.error(f"Failed to pull changes: {str(e)}")
            raise

    # Conflict Detection and Resolution
    async def check_conflicts(self) -> Dict[str, Union[bool, List[str]]]:
        """Check for merge conflicts."""
        try:
            conflicts = []

            # Check for conflicted files
            try:
                conflicted_files = self.repo.git.diff(
                    "--name-only", "--diff-filter=U"
                ).splitlines()
                conflicts.extend(conflicted_files)
            except git.exc.GitCommandError:
                # No conflicts or no diff
                pass

            return {"has_conflicts": len(conflicts) > 0, "conflicted_files": conflicts}

        except Exception as e:
            logger.error(f"Failed to check conflicts: {str(e)}")
            raise

    async def resolve_conflict(self, file_path: str, resolved_content: str) -> bool:
        """Resolve a merge conflict by providing the resolved content."""
        try:
            full_path = self.repo_path / file_path

            # Write the resolved content
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(resolved_content)

            # Stage the resolved file
            self.repo.index.add([file_path])

            logger.info(f"Resolved conflict in file: {file_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to resolve conflict in {file_path}: {str(e)}")
            raise

    # Status and Information
    async def get_working_tree_status(self) -> Dict[str, List[str]]:
        """Get comprehensive working tree status."""
        try:
            status: Dict[str, List[str]] = {
                "modified": [],
                "added": [],
                "deleted": [],
                "renamed": [],
                "untracked": [],
            }

            # Get modified files
            for item in self.repo.index.diff(None):
                if item.change_type == "M":
                    status["modified"].append(item.a_path)
                elif item.change_type == "D":
                    status["deleted"].append(item.a_path)

            # Get staged files
            for item in self.repo.index.diff("HEAD"):
                if item.change_type == "A":
                    status["added"].append(item.a_path or item.b_path)
                elif item.change_type == "R":
                    status["renamed"].append(f"{item.a_path} -> {item.b_path}")

            # Get untracked files
            status["untracked"] = self.repo.untracked_files

            return status

        except Exception as e:
            logger.error(f"Failed to get working tree status: {str(e)}")
            raise
