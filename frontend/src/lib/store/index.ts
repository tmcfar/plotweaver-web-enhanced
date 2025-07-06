import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ModeSetId = 'professional-writer' | 'ai-first' | 'editor' | 'hobbyist';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'collaborator';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  owner: string;
  collaborators: string[];
}

export interface ModeSetPreferences {
  [key: string]: any;
}

export interface GlobalStore {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;

  // Mode set state
  modeSet: ModeSetId | null;
  setModeSet: (modeSet: ModeSetId) => void;
  modeSetPreferences: Record<ModeSetId, ModeSetPreferences>;
  setModeSetPreferences: (modeSet: ModeSetId, preferences: ModeSetPreferences) => void;

  // Project state
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;

  // UI state
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  bottomPanelOpen: boolean;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  toggleBottomPanel: () => void;

  // Panel sizes
  panelSizes: Record<string, number>;
  setPanelSize: (panel: string, size: number) => void;

  // Loading states
  loading: Record<string, boolean>;
  setLoading: (key: string, loading: boolean) => void;

  // Error handling
  errors: Array<{ id: string; message: string; timestamp: Date }>;
  addError: (message: string) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;

  // Notifications
  notifications: Array<{ id: string; type: 'info' | 'success' | 'warning' | 'error'; message: string; timestamp: Date }>;
  addNotification: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useGlobalStore = create<GlobalStore>()(
  devtools(
    (set, get) => ({
      // User state
      user: null,
      setUser: (user) => set({ user }, false, 'setUser'),

      // Mode set state
      modeSet: null,
      setModeSet: (modeSet) => set({ modeSet }, false, 'setModeSet'),
      modeSetPreferences: {
        'professional-writer': {},
        'ai-first': {},
        'editor': {},
        'hobbyist': {}
      },
      setModeSetPreferences: (modeSet, preferences) =>
        set(
          (state) => ({
            modeSetPreferences: {
              ...state.modeSetPreferences,
              [modeSet]: preferences
            }
          }),
          false,
          'setModeSetPreferences'
        ),

      // Project state
      currentProject: null,
      setCurrentProject: (project) => set({ currentProject: project }, false, 'setCurrentProject'),
      projects: [],
      setProjects: (projects) => set({ projects }, false, 'setProjects'),

      // UI state
      sidebarOpen: true,
      rightPanelOpen: false,
      bottomPanelOpen: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen }), false, 'toggleSidebar'),
      toggleRightPanel: () =>
        set((state) => ({ rightPanelOpen: !state.rightPanelOpen }), false, 'toggleRightPanel'),
      toggleBottomPanel: () =>
        set((state) => ({ bottomPanelOpen: !state.bottomPanelOpen }), false, 'toggleBottomPanel'),

      // Panel sizes
      panelSizes: {
        sidebar: 250,
        rightPanel: 300,
        bottomPanel: 200
      },
      setPanelSize: (panel, size) =>
        set(
          (state) => ({
            panelSizes: { ...state.panelSizes, [panel]: size }
          }),
          false,
          'setPanelSize'
        ),

      // Loading states
      loading: {},
      setLoading: (key, loading) =>
        set(
          (state) => ({
            loading: { ...state.loading, [key]: loading }
          }),
          false,
          'setLoading'
        ),

      // Error handling
      errors: [],
      addError: (message) =>
        set(
          (state) => ({
            errors: [
              ...state.errors,
              {
                id: Date.now().toString(),
                message,
                timestamp: new Date()
              }
            ]
          }),
          false,
          'addError'
        ),
      removeError: (id) =>
        set(
          (state) => ({
            errors: state.errors.filter((error) => error.id !== id)
          }),
          false,
          'removeError'
        ),
      clearErrors: () => set({ errors: [] }, false, 'clearErrors'),

      // Notifications
      notifications: [],
      addNotification: (type, message) =>
        set(
          (state) => ({
            notifications: [
              ...state.notifications,
              {
                id: Date.now().toString(),
                type,
                message,
                timestamp: new Date()
              }
            ]
          }),
          false,
          'addNotification'
        ),
      removeNotification: (id) =>
        set(
          (state) => ({
            notifications: state.notifications.filter((notif) => notif.id !== id)
          }),
          false,
          'removeNotification'
        ),
      clearNotifications: () => set({ notifications: [] }, false, 'clearNotifications')
    }),
    {
      name: 'plotweaver-global-store'
    }
  )
);