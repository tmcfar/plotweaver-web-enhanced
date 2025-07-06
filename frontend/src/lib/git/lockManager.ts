import yaml from 'js-yaml';
import { ComponentLock } from '../api/locks';

export interface LockState {
  version: string;
  locks: Record<string, Record<string, {
    level: ComponentLock['level'];
    locked_at: ComponentLock['lockedAt'];
    locked_by: ComponentLock['lockedBy'];
    reason: ComponentLock['reason'];
  }>>;
}

export class GitLockManager {
  private readonly lockFilePath = '.plotweaver/locks.yaml';

  async loadLocks(repoPath: string): Promise<LockState> {
    try {
      const response = await fetch(`${repoPath}/${this.lockFilePath}`);
      if (!response.ok) {
        throw new Error('Failed to load locks');
      }
      const content = await response.text();
      return yaml.load(content) as LockState;
    } catch {
      // File doesn't exist yet
      return { version: '1.0', locks: {} };
    }
  }

  async saveLocks(
    repoPath: string,
    locks: Record<string, ComponentLock>
  ): Promise<void> {
    const lockState: LockState = {
      version: '1.0',
      locks: this.organizeLocksByType(locks)
    };

    const content = yaml.dump(lockState);
    await this.writeFile(repoPath, this.lockFilePath, content);
  }

  async commitLockFile(locks: Record<string, ComponentLock>): Promise<void> {
    try {
      const response = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: [this.lockFilePath],
          message: 'Update component locks',
          content: yaml.dump({
            version: '1.0',
            locks: this.organizeLocksByType(locks)
          })
        })
      });

      if (!response.ok) {
        throw new Error('Failed to commit lock file');
      }
    } catch (error) {
      console.error('Error committing lock file:', error);
      throw error;
    }
  }

  private organizeLocksByType(locks: Record<string, ComponentLock>) {
    const organized: Record<string, Record<string, {
      level: ComponentLock['level'];
      locked_at: ComponentLock['lockedAt'];
      locked_by: ComponentLock['lockedBy'];
      reason: ComponentLock['reason'];
    }>> = {};

    Object.entries(locks).forEach(([id, lock]) => {
      const type = lock.componentType;
      if (!organized[type]) {
        organized[type] = {};
      }

      organized[type][id] = {
        level: lock.level,
        locked_at: lock.lockedAt,
        locked_by: lock.lockedBy,
        reason: lock.reason
      };
    });

    return organized;
  }

  private async writeFile(
    repoPath: string,
    filePath: string,
    content: string
  ): Promise<void> {
    const response = await fetch(`${repoPath}/${filePath}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/x-yaml' },
      body: content
    });

    if (!response.ok) {
      throw new Error('Failed to write lock file');
    }
  }
}

// Export singleton instance
export const gitManager = new GitLockManager();
