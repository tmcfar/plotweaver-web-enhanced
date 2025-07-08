// Project Secrets Manager Component
// Manages API keys at the project level using GitHub repository secrets

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface ProjectSecretsProps {
  projectId: number;
  projectName?: string;
}

interface SecretsStatus {
  openai: boolean;
  anthropic: boolean;
  model_preference: boolean;
  mode_set: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const ProjectSecretsManager: React.FC<ProjectSecretsProps> = ({ projectId, projectName }) => {
  const [secrets, setSecrets] = useState<SecretsStatus>({
    openai: false,
    anthropic: false,
    model_preference: false,
    mode_set: false,
  });
  const [loading, setLoading] = useState(true);
  const [openAIKey, setOpenAIKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [savingProvider, setSavingProvider] = useState<string | null>(null);

  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
  });

  useEffect(() => {
    loadSecretsStatus();
  }, [projectId]);

  const loadSecretsStatus = async () => {
    try {
      const response = await apiClient.get(`/api/v1/projects/${projectId}/secrets`);
      setSecrets(response.data.secrets);
    } catch (error) {
      console.error('Failed to load secrets status:', error);
      toast.error('Failed to load secrets status');
    } finally {
      setLoading(false);
    }
  };

  const handleSetSecret = async (provider: 'openai' | 'anthropic', key: string) => {
    if (!key) {
      toast.error('Please enter an API key');
      return;
    }

    // Validate key format
    if (provider === 'openai' && !key.startsWith('sk-')) {
      toast.error('Invalid OpenAI API key format. Keys should start with "sk-"');
      return;
    }
    if (provider === 'anthropic' && !key.startsWith('sk-ant-')) {
      toast.error('Invalid Anthropic API key format. Keys should start with "sk-ant-"');
      return;
    }

    setSavingProvider(provider);
    try {
      await apiClient.put(`/api/v1/projects/${projectId}/secrets/${provider}`, { key });
      await loadSecretsStatus();
      toast.success(`${provider === 'openai' ? 'OpenAI' : 'Anthropic'} key saved to repository`);
      
      // Clear the input
      if (provider === 'openai') {
        setOpenAIKey('');
      } else {
        setAnthropicKey('');
      }
    } catch (error: any) {
      console.error(`Failed to save ${provider} key:`, error);
      toast.error(error.response?.data?.error || `Failed to save ${provider} key`);
    } finally {
      setSavingProvider(null);
    }
  };

  const handleDeleteSecret = async (provider: 'openai' | 'anthropic') => {
    if (!confirm(`Remove ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key from this project?`)) {
      return;
    }

    try {
      await apiClient.delete(`/api/v1/projects/${projectId}/secrets/${provider}`);
      await loadSecretsStatus();
      toast.success(`${provider === 'openai' ? 'OpenAI' : 'Anthropic'} key removed`);
    } catch (error: any) {
      console.error(`Failed to remove ${provider} key:`, error);
      toast.error(error.response?.data?.error || `Failed to remove ${provider} key`);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading secrets configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Project API Keys</h3>
        <p className="text-sm text-gray-600 mb-4">
          API keys are stored securely as encrypted secrets in your GitHub repository. 
          PlotWeaver never stores or has access to your actual keys.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-800 mb-1">Security Note</h4>
        <p className="text-sm text-yellow-700">
          These keys are encrypted and stored in your GitHub repository's secrets. 
          Only GitHub Actions and authorized applications can access them.
        </p>
      </div>

      <div className="space-y-4">
        {/* OpenAI API Key */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">OpenAI API Key</label>
            <span className={`text-sm ${secrets.openai ? 'text-green-600' : 'text-gray-400'}`}>
              {secrets.openai ? '✓ Configured' : '✗ Not configured'}
            </span>
          </div>
          
          {secrets.openai ? (
            <div className="flex items-center justify-between">
              <input
                type="password"
                value="••••••••••••••••"
                disabled
                className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
              />
              <button
                onClick={() => handleDeleteSecret('openai')}
                className="ml-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <input
                type="password"
                value={openAIKey}
                onChange={(e) => setOpenAIKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <button
                onClick={() => handleSetSecret('openai', openAIKey)}
                disabled={!openAIKey || savingProvider === 'openai'}
                className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {savingProvider === 'openai' ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {/* Anthropic API Key */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Anthropic API Key (Optional)</label>
            <span className={`text-sm ${secrets.anthropic ? 'text-green-600' : 'text-gray-400'}`}>
              {secrets.anthropic ? '✓ Configured' : '✗ Not configured'}
            </span>
          </div>
          
          {secrets.anthropic ? (
            <div className="flex items-center justify-between">
              <input
                type="password"
                value="••••••••••••••••"
                disabled
                className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
              />
              <button
                onClick={() => handleDeleteSecret('anthropic')}
                className="ml-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <button
                onClick={() => handleSetSecret('anthropic', anthropicKey)}
                disabled={!anthropicKey || savingProvider === 'anthropic'}
                className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {savingProvider === 'anthropic' ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium mb-2">How it works</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• API keys are encrypted and stored in your GitHub repository</li>
          <li>• PlotWeaver uses these keys to generate content for your manuscript</li>
          <li>• You can use different API keys for different projects</li>
          <li>• Keys are never visible to PlotWeaver or stored on our servers</li>
        </ul>
      </div>

      {!secrets.openai && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Getting Started:</strong> You'll need at least an OpenAI API key to generate content. 
            Get one from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI's platform</a>.
          </p>
        </div>
      )}
    </div>
  );
};

// Project Settings Page Component (src/components/project/ProjectSettings.tsx)
import { ProjectSecretsManager } from './ProjectSecretsManager';

interface ProjectSettingsProps {
  project: {
    id: number;
    name: string;
    // ... other project fields
  };
}

export const ProjectSettings: React.FC<ProjectSettingsProps> = ({ project }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'secrets' | 'collaborators'>('general');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{project.name} Settings</h1>
      
      <div className="mb-6">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded ${activeTab === 'general' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('secrets')}
            className={`px-4 py-2 rounded ${activeTab === 'secrets' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            API Keys
          </button>
          <button
            onClick={() => setActiveTab('collaborators')}
            className={`px-4 py-2 rounded ${activeTab === 'collaborators' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Collaborators
          </button>
        </nav>
      </div>

      {activeTab === 'general' && (
        <div>
          {/* General project settings */}
          <p>General settings coming soon...</p>
        </div>
      )}
      
      {activeTab === 'secrets' && (
        <ProjectSecretsManager projectId={project.id} projectName={project.name} />
      )}
      
      {activeTab === 'collaborators' && (
        <div>
          {/* Collaborator management */}
          <p>Collaborator management coming soon...</p>
        </div>
      )}
    </div>
  );
};