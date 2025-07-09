'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface GitErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface GitErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export class GitErrorBoundary extends React.Component<
  GitErrorBoundaryProps,
  GitErrorBoundaryState
> {
  constructor(props: GitErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<GitErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Git component error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error!} 
            retry={this.handleRetry}
          />
        );
      }

      return (
        <DefaultErrorFallback 
          error={this.state.error!} 
          retry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error;
  retry: () => void;
}

function DefaultErrorFallback({ error, retry }: DefaultErrorFallbackProps) {
  return (
    <div className="git-error-boundary border border-red-200 bg-red-50 rounded-lg p-4 m-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <h2 className="text-red-800 font-medium">Git Operation Failed</h2>
      </div>
      
      <div className="mb-4">
        <p className="text-red-700 text-sm mb-2">
          {error.message || 'Something went wrong with the git operation'}
        </p>
        
        <details className="text-xs text-red-600">
          <summary className="cursor-pointer hover:text-red-800">
            Show error details
          </summary>
          <pre className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs overflow-x-auto">
            {error.stack || error.toString()}
          </pre>
        </details>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={retry}
          className="flex items-center gap-1 px-3 py-1 text-sm text-red-700 hover:text-red-800 border border-red-300 hover:border-red-400 rounded"
        >
          <RefreshCw className="w-3 h-3" />
          Try Again
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

export function handleGitError(error: unknown): string {
  if (error instanceof Error) {
    // Handle specific git API errors
    if (error.message.includes('404')) {
      return 'File or project not found';
    }
    if (error.message.includes('403')) {
      return 'Permission denied - check your access rights';
    }
    if (error.message.includes('500')) {
      return 'Server error - please try again later';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out - please try again';
    }
    if (error.message.includes('Network Error')) {
      return 'Network connection failed - check your internet connection';
    }
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}

export default GitErrorBoundary;