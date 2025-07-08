// Authentication types for PlotWeaver

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  preferences?: UserPreferences;
  stats?: UserStats;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
}

export interface UserStats {
  projects_created: number;
  stories_generated: number;
  total_words: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
}

export interface ApiKey {
  id: string;
  name: string;
  key_preview: string;
  created_at: string;
  last_used?: string;
  expires_at?: string;
}

export interface TwoFactorSetup {
  secret: string;
  qr_code: string;
  backup_codes: string[];
}

export interface OAuthProvider {
  id: string;
  name: string;
  icon_url: string;
  auth_url: string;
}
