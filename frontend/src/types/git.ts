// Git integration types for PlotWeaver

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

export interface GitDiff {
  file_path: string;
  from_sha: string;
  to_sha: string;
  diff: string;
  stats: {
    additions: number;
    deletions: number;
  };
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
