import { FC, ReactNode, useEffect } from 'react';
import { setupStoreSubscriptions } from '../../lib/store/utils/subscriptions';

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: FC<StoreProviderProps> = ({ children }) => {
  useEffect(() => {
    // Initialize store subscriptions
    const cleanup = setupStoreSubscriptions();

    // Load initial data
    loadInitialData();

    return () => {
      // Cleanup subscriptions
      cleanup();
    };
  }, []);

  return <>{children}</>;
};

async function loadInitialData() {
  try {
    // Load user preferences from localStorage or API
    await loadUserPreferences();

    // Load project data if available
    await loadProjectData();

    // Initialize any other required data
    await initializeWorkspace();

    console.log('Store initialized with initial data');
  } catch (error) {
    console.error('Failed to load initial data:', error);
  }
}

async function loadUserPreferences() {
  try {
    // Try to load from localStorage first
    const storedPreferences = localStorage.getItem('plotweaver-user-preferences');
    if (storedPreferences) {
      const preferences = JSON.parse(storedPreferences);
      // Apply preferences to store if needed
      console.log('Loaded user preferences from localStorage', preferences);
    }

    // If user is logged in, load from API
    // const userPrefs = await userAPI.getPreferences();
    // useStore.getState().setUserPreferences(userPrefs);
  } catch (error) {
    console.warn('Failed to load user preferences:', error);
  }
}

async function loadProjectData() {
  try {
    // Load recent project or auto-open last project
    const lastProjectId = localStorage.getItem('plotweaver-last-project');
    if (lastProjectId) {
      // const project = await projectAPI.getProject(lastProjectId);
      // useStore.getState().setCurrentProject(project);
      console.log('Would load last project:', lastProjectId);
    }
  } catch (error) {
    console.warn('Failed to load project data:', error);
  }
}

async function initializeWorkspace() {
  try {
    // Initialize any workspace-specific settings
    // Load panel sizes from preferences
    const panelSizes = localStorage.getItem('plotweaver-panel-sizes');
    if (panelSizes) {
      const sizes = JSON.parse(panelSizes);
      Object.entries(sizes).forEach(([panel, size]) => {
        // useStore.getState().setPanelSize(panel, size as number);
        console.log('Would set panel size:', panel, size);
      });
    }

    // Apply any saved UI state
    console.log('Workspace initialized');
  } catch (error) {
    console.warn('Failed to initialize workspace:', error);
  }
}