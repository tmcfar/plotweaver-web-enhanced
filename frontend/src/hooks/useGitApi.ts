import { useState, useEffect } from 'react';
import GitApiClient from '@/lib/api/git';
import { FileContent, DirectoryTree, FileHistory } from '@/types/git';

export function useGitApi() {
  const [gitApi] = useState(() => new GitApiClient());
  return gitApi;
}

export function useFileContent(projectId: string, filePath: string) {
  const [content, setContent] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const gitApi = useGitApi();

  useEffect(() => {
    async function fetchContent() {
      try {
        setLoading(true);
        setError(null);
        const data = await gitApi.getFileContent(projectId, filePath);
        setContent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch content');
      } finally {
        setLoading(false);
      }
    }

    if (projectId && filePath) {
      fetchContent();
    }
  }, [projectId, filePath, gitApi]);

  return { content, loading, error };
}

export function useProjectTree(projectId: string, path: string = '') {
  const [tree, setTree] = useState<DirectoryTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const gitApi = useGitApi();

  const fetchTree = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await gitApi.getProjectTree(projectId, path);
      setTree(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tree');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchTree();
    }
  }, [projectId, path, gitApi]);

  return { tree, loading, error, refetch: fetchTree };
}

export function useFileHistory(projectId: string, filePath: string, options: { limit?: number; skip?: number } = {}) {
  const [history, setHistory] = useState<FileHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const gitApi = useGitApi();

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        setError(null);
        const data = await gitApi.getFileHistory(projectId, filePath, options);
        setHistory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch history');
      } finally {
        setLoading(false);
      }
    }

    if (projectId && filePath) {
      fetchHistory();
    }
  }, [projectId, filePath, options.limit, options.skip, gitApi]);

  return { history, loading, error };
}