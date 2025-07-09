'use client';

import React, { useState } from 'react';
import { History, Clock, User, FileText, Loader2 } from 'lucide-react';
import { useFileContent } from '@/hooks/useGitApi';
import { cn } from '@/lib/utils';

interface GitFileViewerProps {
  projectId: string;
  filePath: string;
  readOnly?: boolean;
  showHistory?: boolean;
}

interface CommitInfoProps {
  commit: {
    hash: string;
    author_name: string;
    author_email: string;
    date: string;
    message: string;
  };
}

function CommitInfo({ commit }: CommitInfoProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
      <User className="w-3 h-3" />
      <span>{commit.author_name}</span>
      <Clock className="w-3 h-3" />
      <span>{formatDate(commit.date)}</span>
      <span className="font-mono bg-gray-200 px-1 rounded">{commit.hash.slice(0, 7)}</span>
      <span className="flex-1 truncate">{commit.message}</span>
    </div>
  );
}

function CodeEditor({ value, language, readOnly }: { value: string; language: string; readOnly: boolean }) {
  const getLanguageFromExtension = (filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'py':
        return 'python';
      case 'md':
        return 'markdown';
      case 'json':
        return 'json';
      case 'yml':
      case 'yaml':
        return 'yaml';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      default:
        return 'text';
    }
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <pre className="bg-gray-50 p-4 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
        <code>{value}</code>
      </pre>
    </div>
  );
}

function HistoryPanel({ projectId, filePath, onClose }: { projectId: string; filePath: string; onClose: () => void }) {
  return (
    <div className="border-l bg-gray-50 p-4 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sm">File History</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ×
        </button>
      </div>
      <div className="text-xs text-gray-500">
        History implementation coming soon...
      </div>
    </div>
  );
}

export function GitFileViewer({ 
  projectId, 
  filePath, 
  readOnly = false, 
  showHistory = true 
}: GitFileViewerProps) {
  const { content, loading, error } = useFileContent(projectId, filePath);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm text-gray-600">Loading file...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600 text-sm mb-2">Failed to load file</div>
        <p className="text-xs text-gray-500">{error}</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <div>No file selected</div>
      </div>
    );
  }

  return (
    <div className="git-file-viewer h-full flex flex-col">
      <div className="file-header border-b p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-600" />
            <h3 className="font-medium text-sm">{filePath}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {content.lines} lines • {formatFileSize(content.size)}
            </span>
            {showHistory && (
              <button 
                onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 px-2 py-1 rounded border"
              >
                <History className="w-3 h-3" />
                History
              </button>
            )}
          </div>
        </div>
        
        {content.last_commit && (
          <div className="mt-2">
            <CommitInfo commit={content.last_commit} />
          </div>
        )}
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 overflow-y-auto">
          <CodeEditor 
            value={content.content}
            language={getLanguageFromExtension(filePath)}
            readOnly={readOnly}
          />
        </div>

        {showHistoryPanel && (
          <HistoryPanel 
            projectId={projectId}
            filePath={filePath}
            onClose={() => setShowHistoryPanel(false)}
          />
        )}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getLanguageFromExtension(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'md':
      return 'markdown';
    case 'json':
      return 'json';
    case 'yml':
    case 'yaml':
      return 'yaml';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    default:
      return 'text';
  }
}