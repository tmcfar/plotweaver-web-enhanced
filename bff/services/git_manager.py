import asyncio
from pathlib import Path
from typing import Dict, List, Optional
import aiofiles
import git
from fastapi import HTTPException

class GitRepoManager:
    def __init__(self, repos_base_path: str = "/home/tmcfar/plotweaver-repos"):
        self.repos_base = Path(repos_base_path)
        self.repos: Dict[str, git.Repo] = {}
    
    def get_repo(self, project_id: str) -> git.Repo:
        """Get or clone repository for project"""
        if project_id not in self.repos:
            repo_path = self.repos_base / project_id
            if repo_path.exists():
                self.repos[project_id] = git.Repo(repo_path)
            else:
                raise HTTPException(404, f"Repository not found for project {project_id}")
        return self.repos[project_id]
    
    async def get_file_content(self, project_id: str, file_path: str) -> Dict[str, any]:
        """Read file content from git"""
        repo = self.get_repo(project_id)
        full_path = Path(repo.working_dir) / file_path
        
        if not full_path.exists():
            raise HTTPException(404, f"File not found: {file_path}")
        
        async with aiofiles.open(full_path, 'r') as f:
            content = await f.read()
        
        # Get git info
        try:
            last_commit = next(repo.iter_commits(paths=file_path, max_count=1))
            commit_info = {
                "sha": last_commit.hexsha,
                "message": last_commit.message,
                "author": str(last_commit.author),
                "timestamp": last_commit.committed_datetime.isoformat()
            }
        except StopIteration:
            # File not tracked in git yet
            commit_info = None
        
        return {
            "content": content,
            "path": file_path,
            "last_commit": commit_info
        }
    
    async def get_tree(self, project_id: str, path: str = "") -> List[Dict]:
        """Get directory tree from git"""
        repo = self.get_repo(project_id)
        tree_items = []
        
        base_path = Path(repo.working_dir) / path
        if not base_path.exists():
            return []
            
        for item in base_path.iterdir():
            # Skip .git directory and other hidden files
            if item.name.startswith('.'):
                continue
                
            tree_items.append({
                "name": item.name,
                "path": str(item.relative_to(repo.working_dir)),
                "type": "directory" if item.is_dir() else "file",
                "size": item.stat().st_size if item.is_file() else None
            })
        
        return sorted(tree_items, key=lambda x: (x["type"] == "file", x["name"]))
    
    async def pull_latest(self, project_id: str) -> Dict[str, any]:
        """Pull latest changes from remote"""
        repo = self.get_repo(project_id)
        
        try:
            origin = repo.remote('origin')
            
            # Get current commit SHA before pull
            current_sha = repo.head.commit.hexsha
            
            # Fetch and get diff
            fetch_info = origin.fetch()
            
            # Pull changes
            pull_info = origin.pull()
            
            # Get new commit SHA after pull
            new_sha = repo.head.commit.hexsha
            
            # Get updated files
            updated_files = []
            if current_sha != new_sha:
                # Get diff between old and new commit
                diff = repo.git.diff('--name-only', current_sha, new_sha)
                updated_files = diff.split('\n') if diff else []
            
            return {
                "status": "success",
                "updated_files": updated_files,
                "old_sha": current_sha,
                "new_sha": new_sha
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "updated_files": []
            }
    
    async def get_diff(self, project_id: str, base_ref: str, head_ref: str = "HEAD") -> Dict[str, any]:
        """Get diff between two refs"""
        repo = self.get_repo(project_id)
        
        try:
            # Get the diff as text
            diff_text = repo.git.diff(base_ref, head_ref)
            
            # Get list of changed files
            changed_files = repo.git.diff('--name-only', base_ref, head_ref).split('\n')
            changed_files = [f for f in changed_files if f.strip()]
            
            return {
                "diff": diff_text,
                "changed_files": changed_files,
                "base_ref": base_ref,
                "head_ref": head_ref
            }
        except Exception as e:
            raise HTTPException(400, f"Error getting diff: {str(e)}")
    
    async def get_file_history(self, project_id: str, file_path: str, limit: int = 10) -> List[Dict]:
        """Get commit history for a file"""
        repo = self.get_repo(project_id)
        
        try:
            commits = list(repo.iter_commits(paths=file_path, max_count=limit))
            
            history = []
            for commit in commits:
                history.append({
                    "sha": commit.hexsha,
                    "message": commit.message.strip(),
                    "author": str(commit.author),
                    "email": commit.author.email,
                    "timestamp": commit.committed_datetime.isoformat(),
                    "short_sha": commit.hexsha[:7]
                })
            
            return history
        except Exception as e:
            raise HTTPException(400, f"Error getting file history: {str(e)}")