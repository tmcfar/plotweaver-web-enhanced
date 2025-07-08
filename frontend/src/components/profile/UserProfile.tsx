// Updated Frontend User Profile Implementation without API Keys Tab
// This implementation provides user profile management with GitHub integration

// 1. Types Definition (src/types/user.ts)
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  timezone?: string;
  language?: string;
  country?: string;
  selectedModeSet: 'professional-writer' | 'ai-first' | 'editor' | 'hobbyist';
  modeSetPreferences: {
    [key: string]: any;
  };
  githubConnected: boolean;
  githubUsername?: string;
  repositories?: UserRepository[];
  projectsSecretsStatus?: ProjectSecretsStatus[];
  createdAt: string;
  updatedAt: string;
}

export interface UserRepository {
  id: string;
  name: string;
  url: string;
  private: boolean;
  isPlotWeaverProject: boolean;
  lastSync?: string;
}

export interface ProjectSecretsStatus {
  projectId: number;
  projectName: string;
  hasOpenai: boolean;
  hasAnthropic: boolean;
  fullyConfigured: boolean;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  country?: string;
  selectedModeSet?: string;
  modeSetPreferences?: any;
}

// 2. API Service (src/services/userProfile.ts)
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export class UserProfileService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
  });

  constructor() {
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getProfile(): Promise<UserProfile> {
    const response = await this.apiClient.get('/api/v1/users/profile');
    return response.data;
  }

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await this.apiClient.patch('/api/v1/users/profile', data);
    return response.data;
  }

  async connectGitHub(code: string): Promise<void> {
    await this.apiClient.post('/api/v1/users/github/connect', { code });
  }

  async disconnectGitHub(): Promise<void> {
    await this.apiClient.post('/api/v1/users/github/disconnect');
  }

  async listRepositories(): Promise<UserRepository[]> {
    const response = await this.apiClient.get('/api/v1/users/repositories');
    return response.data.repositories;
  }

  async createRepository(name: string, description: string, isPrivate: boolean = true): Promise<UserRepository> {
    const response = await this.apiClient.post('/api/v1/users/repositories', {
      name,
      description,
      private: isPrivate,
    });
    return response.data;
  }

  async getProjectsSecretsStatus(): Promise<ProjectSecretsStatus[]> {
    const response = await this.apiClient.get('/api/v1/users/projects-secrets-summary');
    return response.data.projects;
  }
}

// 3. React Components (src/components/profile/UserProfile.tsx)
import React, { useState, useEffect } from 'react';
import { UserProfile, UpdateProfileRequest } from '@/types/user';
import { UserProfileService } from '@/services/userProfile';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const profileService = new UserProfileService();

export const UserProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'github'>('general');

  useEffect(() => {
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
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">User Profile</h1>
      
      <div className="mb-6">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded ${activeTab === 'general' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`px-4 py-2 rounded ${activeTab === 'github' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            GitHub Integration
          </button>
        </nav>
      </div>

      {activeTab === 'general' && <GeneralProfileTab profile={profile} onUpdate={loadProfile} />}
      {activeTab === 'github' && <GitHubTab profile={profile} onUpdate={loadProfile} />}

      {/* Projects Secrets Status Summary */}
      {profile.projectsSecretsStatus && profile.projectsSecretsStatus.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">API Keys Configuration Status</h3>
          <p className="text-sm text-gray-600 mb-4">
            API keys are stored securely in each project's GitHub repository secrets.
          </p>
          <div className="space-y-2">
            {profile.projectsSecretsStatus.map((project) => (
              <div key={project.projectId} className="flex items-center justify-between p-2 bg-white rounded">
                <span className="font-medium">{project.projectName}</span>
                <div className="flex items-center space-x-4">
                  <span className={`text-sm ${project.hasOpenai ? 'text-green-600' : 'text-gray-400'}`}>
                    OpenAI: {project.hasOpenai ? '✓' : '✗'}
                  </span>
                  <span className={`text-sm ${project.hasAnthropic ? 'text-green-600' : 'text-gray-400'}`}>
                    Anthropic: {project.hasAnthropic ? '✓' : '✗'}
                  </span>
                  <Link
                    to={`/projects/${project.projectId}/settings`}
                    className="text-blue-500 hover:underline text-sm"
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

// 4. General Profile Tab Component
const GeneralProfileTab: React.FC<{ profile: UserProfile; onUpdate: () => void }> = ({ profile, onUpdate }) => {
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    displayName: profile.displayName || '',
    bio: profile.bio || '',
    timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: profile.language || 'en',
    selectedModeSet: profile.selectedModeSet,
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
        <label className="block text-sm font-medium mb-2">Display Name</label>
        <input
          type="text"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Bio</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Default Mode Set</label>
        <select
          value={formData.selectedModeSet}
          onChange={(e) => setFormData({ ...formData, selectedModeSet: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="professional-writer">Professional Writer</option>
          <option value="ai-first">AI-First Creator</option>
          <option value="editor">Editor</option>
          <option value="hobbyist">Hobbyist</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Timezone</label>
        <select
          value={formData.timezone}
          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
        >
          {Intl.supportedValuesOf('timeZone').map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
};

// 5. GitHub Integration Tab Component
const GitHubTab: React.FC<{ profile: UserProfile; onUpdate: () => void }> = ({ profile, onUpdate }) => {
  const [repositories, setRepositories] = useState<UserRepository[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile.githubConnected) {
      loadRepositories();
    }
  }, [profile.githubConnected]);

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

  const handleGitHubConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const scope = 'repo,admin:repo_hook,read:user';
    
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
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

  if (!profile.githubConnected) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium mb-4">Connect your GitHub account</h3>
        <p className="text-gray-600 mb-6">
          Connect GitHub to automatically create and manage repositories for your manuscripts.
        </p>
        <button
          onClick={handleGitHubConnect}
          className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
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
          <h3 className="text-lg font-medium">GitHub Connected</h3>
          <p className="text-gray-600">@{profile.githubUsername}</p>
        </div>
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Disconnect
        </button>
      </div>

      <div>
        <h4 className="font-medium mb-4">PlotWeaver Repositories</h4>
        {loading ? (
          <div className="text-center py-4">Loading repositories...</div>
        ) : repositories.length > 0 ? (
          <div className="space-y-2">
            {repositories.map((repo) => (
              <div key={repo.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">{repo.name}</h5>
                    <p className="text-sm text-gray-600">
                      {repo.private ? 'Private' : 'Public'} • Last synced: {repo.lastSync || 'Never'}
                    </p>
                  </div>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View on GitHub
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No PlotWeaver repositories found.</p>
        )}
      </div>
    </div>
  );
};

// 6. GitHub OAuth Callback Handler (src/pages/auth/github/callback.tsx)
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { UserProfileService } from '@/services/userProfile';

export default function GitHubCallback() {
  const router = useRouter();
  const { code } = router.query;

  useEffect(() => {
    if (code && typeof code === 'string') {
      handleCallback(code);
    }
  }, [code]);

  const handleCallback = async (code: string) => {
    try {
      const service = new UserProfileService();
      await service.connectGitHub(code);
      router.push('/profile?tab=github');
    } catch (error) {
      console.error('GitHub connection failed:', error);
      router.push('/profile?tab=github&error=connection_failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Connecting to GitHub...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
}