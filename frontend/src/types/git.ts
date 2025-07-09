// Git integration types for PlotWeaver

export interface FileContent {
  success: boolean;
  file_path: string;
  content: string;
  size: number;
  lines: number;
  modified_time: number;
  encoding: string;
  last_commit: CommitInfo | null;
}

export interface DirectoryTree {
  success: boolean;
  project_id: string;
  path: string;
  tree: DirectoryNode[];
  depth: number;
}

export interface DirectoryNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified_time?: number;
  extension?: string;
  children?: DirectoryNode[];
}

export interface FileHistory {
  success: boolean;
  project_id: string;
  file_path: string;
  history: CommitInfo[];
  pagination: {
    limit: number;
    skip: number;
    total: number;
    has_more: boolean;
  };
}

export interface CommitInfo {
  hash: string;
  author_name: string;
  author_email: string;
  date: string;
  message: string;
  body: string;
}

export interface GitDiff {
  success: boolean;
  project_id: string;
  base_ref: string;
  head_ref: string;
  diff: string;
  stats: {
    files_changed: number;
    insertions: number;
    deletions: number;
  };
  files_changed: string[];
}

export interface RepositoryStatus {
  project_id: string;
  current_branch: string;
  modified_files: string[];
  staged_files: string[];
  untracked_files: string[];
  ahead_by: number;
  behind_by: number;
  has_remote: boolean;
  is_clean: boolean;
}

export interface ProjectBranches {
  success: boolean;
  project_id: string;
  current_branch: string;
  local_branches: Branch[];
  remote_branches: Branch[];
}

export interface Branch {
  name: string;
  is_current?: boolean;
}

export interface PushOptions {
  message?: string;
  force?: boolean;
  remote?: string;
  branch?: string;
}

export interface PushResult {
  success: boolean;
  message: string;
  remote: string;
  branch: string;
  files_pushed: number;
}

// Legacy interfaces for backward compatibility
export interface GitFile {
  content: string;
  path: string;
  encoding: string;
  size: number;
  last_modified: string;
  sha: string;
}

export interface GitDirectoryEntry {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  last_modified?: string;
}

export interface GitDirectory {
  path: string;
  entries: GitDirectoryEntry[];
}

export interface GitCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  timestamp: string;
  changes?: {
    additions: number;
    deletions: number;
  };
}

export interface GitFileHistory {
  file_path: string;
  commits: GitCommit[];
}

export interface GitBranch {
  name: string;
  is_current: boolean;
  last_commit: GitCommit;
}

export interface GitRepositoryStatus {
  branch: string;
  clean: boolean;
  ahead: number;
  behind: number;
  untracked_files: string[];
  modified_files: string[];
  staged_files: string[];
  last_commit: GitCommit;
  remote_url?: string;
}

export interface GitWebhookEvent {
  event: 'push' | 'pull_request' | 'release';
  repository: {
    id: number;
    name: string;
    full_name: string;
    clone_url: string;
  };
  sender: {
    login: string;
    avatar_url: string;
  };
  commits?: GitCommit[];
  ref?: string;
  before?: string;
  after?: string;
}

export interface GitUpdateNotification {
  event: 'push';
  branch: string;
  commits: GitCommit[];
  timestamp: string;
}

export interface GitFileChangeNotification {
  file_path: string;
  change_type: 'added' | 'modified' | 'deleted';
  old_sha?: string;
  new_sha?: string;
  timestamp: string;
}
