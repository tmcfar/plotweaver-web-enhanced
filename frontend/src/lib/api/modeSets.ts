// Mode Set API - handles user mode-set preferences
export type ModeSetId = 'professional-writer' | 'ai-first' | 'editor' | 'hobbyist';

export interface ModeSetPreferences {
  [key: string]: any;
}

export interface UserModeSetData {
  currentModeSet: ModeSetId;
  preferences: Record<ModeSetId, ModeSetPreferences>;
  lastChanged: Date;
}

class ModeSetAPIService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async getUserModeSet(): Promise<UserModeSetData> {
    try {
      const response = await fetch(`${this.baseUrl}/user/mode-set`);
      if (!response.ok) {
        throw new Error('Failed to fetch mode set');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching user mode set:', error);
      // Return default for now
      return {
        currentModeSet: 'professional-writer',
        preferences: {
          'professional-writer': {},
          'ai-first': {},
          'editor': {},
          'hobbyist': {}
        },
        lastChanged: new Date()
      };
    }
  }

  async setUserModeSet(modeSetId: ModeSetId): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/user/mode-set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modeSetId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update mode set');
      }
    } catch (error) {
      console.error('Error setting user mode set:', error);
      // For now, just log the error - in a real app this would show user feedback
    }
  }

  async updateModeSetPreferences(
    modeSetId: ModeSetId, 
    preferences: ModeSetPreferences
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/user/mode-set/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modeSetId, preferences }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating mode set preferences:', error);
    }
  }

  async getModeSetConfig(modeSetId: ModeSetId): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/mode-sets/${modeSetId}/config`);
      if (!response.ok) {
        throw new Error('Failed to fetch mode set config');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching mode set config:', error);
      return {};
    }
  }
}

export const modeSetAPI = new ModeSetAPIService();