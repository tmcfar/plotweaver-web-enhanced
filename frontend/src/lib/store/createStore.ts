import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { createGlobalSlice, GlobalSlice } from './slices/globalSlice';
import { createEditorSlice, EditorSlice } from './slices/editorSlice';
import { createAgentSlice, AgentSlice } from './slices/agentSlice';
import { createLockSlice, LockSlice } from './slices/lockSlice';
import { createContinuitySlice, ContinuitySlice } from './slices/continuitySlice';

// Combined store state type
export type StoreState = 
  GlobalSlice & 
  EditorSlice & 
  AgentSlice & 
  LockSlice & 
  ContinuitySlice;

// Create the unified store
export const useStore = create<StoreState>()(
  devtools(
    persist(
      subscribeWithSelector((...a) => ({
        ...createGlobalSlice(...a),
        ...createEditorSlice(...a),
        ...createAgentSlice(...a),
        ...createLockSlice(...a),
        ...createContinuitySlice(...a)
      })),
      {
        name: 'plotweaver-store',
        version: 1,
        partialize: (state) => ({
          // Only persist certain parts of the state
          user: state.user,
          modeSet: state.modeSet,
          modeSetPreferences: state.modeSetPreferences,
          writingMode: state.writingMode,
          panelSizes: state.panelSizes,
          sidebarCollapsed: state.sidebarCollapsed,
          rightPanelCollapsed: state.rightPanelCollapsed,
          bottomPanelCollapsed: state.bottomPanelCollapsed,
          editorSettings: state.editorSettings
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Re-apply mode configuration after rehydration
            const config = state.getCurrentModeConfig();
            if (config) {
              // Apply any necessary post-hydration setup
              console.log('Store rehydrated with mode:', state.modeSet);
            }
          }
        }
      }
    ),
    {
      name: 'PlotWeaver Store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);

// Export the store instance
export { useStore as useGlobalStore };