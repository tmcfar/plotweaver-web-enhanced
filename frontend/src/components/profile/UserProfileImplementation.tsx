'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

// Types
interface UserProfile {
  user_id: number;
  display_name?: string;
  bio?: string;
  avatar?: string;
  timezone?: string;
  language?: string;
  country?: string;
  selected_mode_set: string;
  mode_set_preferences: Record<string, any>;
  github_connected: boolean;
  github_username?: string;
  repositories?: UserRepository[];
  projects_secrets_status?: ProjectSecretsStatus[];
  updated_at: string;
}

interface UserRepository {
  id: string;
  name: string;
  url: string;
  private: boolean;
  isPlotWeaverProject: boolean;
  lastSync?: string;
}

interface ProjectSecretsStatus {
  projectId: number;
  projectName: string;
  hasOpenai: boolean;
  hasAnthropic: boolean;
  fullyConfigured: boolean;
}

interface UpdateProfileRequest {
  display_name?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  country?: string;
  selected_mode_set?: string;
  mode_set_preferences?: any;
}

// API Service
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class UserProfileService {
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/profile`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    } catch (error) {
      // Development fallback
      if (process.env.NODE_ENV === 'development') {
        return {
          user_id: 1,
          display_name: 'Demo User',
          bio: 'PlotWeaver developer',
          selected_mode_set: 'professional-writer',
          mode_set_preferences: {},
          github_connected: false,
          updated_at: new Date().toISOString()
        };
      }
      throw error;
    }
  }

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/profile`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  }

  async connectGitHub(code: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/github/connect`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!response.ok) throw new Error('Failed to connect GitHub');
  }

  async disconnectGitHub(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/github/disconnect`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to disconnect GitHub');
  }

  async listRepositories(): Promise<UserRepository[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/repositories`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch repositories');
    const data = await response.json();
    return data.repositories;
  }

  async getProjectsSecretsStatus(): Promise<ProjectSecretsStatus[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/projects-secrets-summary`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch projects status');
    const data = await response.json();
    return data.projects;
  }
}

const profileService = new UserProfileService();

// General Profile Tab Component
const GeneralProfileTab: React.FC<{ profile: UserProfile; onUpdate: () => void }> = ({ profile, onUpdate }) => {
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    display_name: profile.display_name || '',
    bio: profile.bio || '',
    timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: profile.language || 'en',
    selected_mode_set: profile.selected_mode_set,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profileService.updateProfile(formData);
      toast.success('Profile updated successfully');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Display Name</label>
        <input
          type="text"
          value={formData.display_name}
          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
          className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Default Mode Set</label>
        <select
          value={formData.selected_mode_set}
          onChange={(e) => setFormData({ ...formData, selected_mode_set: e.target.value })}
          className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg"
        >
          <option value="professional-writer">Professional Writer</option>
          <option value="ai-first">AI-First Creator</option>
          <option value="editor">Editor</option>
          <option value="hobbyist">Hobbyist</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Timezone</label>
        <select
          value={formData.timezone}
          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
          className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg"
        >
          {Intl.supportedValuesOf('timeZone').map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
};

// GitHub Integration Tab Component
const GitHubTab: React.FC<{ profile: UserProfile; onUpdate: () => void }> = ({ profile, onUpdate }) => {
  const [repositories, setRepositories] = useState<UserRepository[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile.github_connected) {
      loadRepositories();
    }
  }, [profile.github_connected]);

  const loadRepositories = async () => {
    setLoading(true);
    try {
      const repos = await profileService.listRepositories();
      setRepositories(repos);
    } catch (error) {
      toast.error('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubConnect = async () => {
    try {
      // Use environment variable if available, otherwise use the correct default
      const redirectUri = process.env.NEXT_PUBLIC_GITHUB_OAUTH_REDIRECT || `${window.location.origin}/(auth)/github/callback`;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      
      // DEBUG: Log what we're about to send
      console.log('=== OAuth Debug Info ===');
      console.log('Redirect URI:', redirectUri);
      console.log('Backend URL:', backendUrl);
      console.log('Full request URL:', `${backendUrl}/api/v1/auth/oauth/github/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`);
      console.log('Env var NEXT_PUBLIC_GITHUB_OAUTH_REDIRECT:', process.env.NEXT_PUBLIC_GITHUB_OAUTH_REDIRECT);
      console.log('Window origin:', window.location.origin);
      console.log('=======================');
      
      const response = await fetch(`${backendUrl}/api/v1/auth/oauth/github/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to get authorization URL');
      }

      const data = await response.json();
      window.location.href = data.authorization_url;
    } catch (error) {
      console.error('GitHub connect failed:', error);
      toast.error('Failed to start GitHub connection');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect GitHub? This will not delete your repositories.')) return;
    
    try {
      await profileService.disconnectGitHub();
      toast.success('GitHub disconnected');
      onUpdate();
    } catch (error) {
      toast.error('Failed to disconnect GitHub');
    }
  };

  if (!profile.github_connected) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-foreground mb-4">Connect your GitHub account</h3>
        <p className="text-muted-foreground mb-6">
          Connect GitHub to automatically create and manage repositories for your manuscripts.
        </p>
        <button
          onClick={handleGitHubConnect}
          className="px-6 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90"
        >
          Connect GitHub
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">GitHub Connected</h3>
          <p className="text-muted-foreground">@{profile.github_username}</p>
        </div>
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90"
        >
          Disconnect
        </button>
      </div>

      <div>
        <h4 className="font-medium text-foreground mb-4">PlotWeaver Repositories</h4>
        {loading ? (
          <div className="text-center text-muted-foreground py-4">Loading repositories...</div>
        ) : repositories.length > 0 ? (
          <div className="space-y-2">
            {repositories.map((repo) => (
              <div key={repo.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-foreground">{repo.name}</h5>
                    <p className="text-sm text-muted-foreground">
                      {repo.private ? 'Private' : 'Public'} • Last synced: {repo.lastSync || 'Never'}
                    </p>
                  </div>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View on GitHub
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No PlotWeaver repositories found.</p>
        )}
      </div>
    </div>
  );
};

// Main Component
export const UserProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'github'>('general');

  useEffect(() => {
    // Debug: Validate environment variables on mount
    console.log('=== Environment Variables Check ===');
    console.log('NEXT_PUBLIC_GITHUB_OAUTH_REDIRECT:', process.env.NEXT_PUBLIC_GITHUB_OAUTH_REDIRECT);
    console.log('NEXT_PUBLIC_BACKEND_URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
    console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    console.log('==================================');
    
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile) {
    return <div className="flex justify-center text-muted-foreground p-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-foreground mb-8">User Profile</h1>
      
      <div className="mb-6">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded ${activeTab === 'general' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`px-4 py-2 rounded ${activeTab === 'github' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
          >
            GitHub Integration
          </button>
        </nav>
      </div>

      {activeTab === 'general' && <GeneralProfileTab profile={profile} onUpdate={loadProfile} />}
      {activeTab === 'github' && <GitHubTab profile={profile} onUpdate={loadProfile} />}

      {/* Projects Secrets Status Summary */}
      {profile.projects_secrets_status && profile.projects_secrets_status.length > 0 && (
        <div className="mt-8 p-4 bg-secondary rounded-lg">
          <h3 className="text-lg font-medium text-foreground mb-4">API Keys Configuration Status</h3>
          <p className="text-sm text-muted-foreground mb-4">
            API keys are stored securely in each project&apos;s GitHub repository secrets.
          </p>
          <div className="space-y-2">
            {profile.projects_secrets_status.map((project) => (
              <div key={project.projectId} className="flex items-center justify-between p-2 bg-background rounded">
                <span className="font-medium text-foreground">{project.projectName}</span>
                <div className="flex items-center space-x-4">
                  <span className={`text-sm ${project.hasOpenai ? 'text-green-500' : 'text-muted-foreground'}`}>
                    OpenAI: {project.hasOpenai ? '✓' : '✗'}
                  </span>
                  <span className={`text-sm ${project.hasAnthropic ? 'text-green-500' : 'text-muted-foreground'}`}>
                    Anthropic: {project.hasAnthropic ? '✓' : '✗'}
                  </span>
                  <Link
                    href={`/projects/${project.projectId}/settings`}
                    className="text-primary hover:underline text-sm"
                  >
                    Configure
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};