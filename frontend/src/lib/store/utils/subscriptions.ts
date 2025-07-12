import { StoreState, useStore } from '../createStore';
import { gitManager } from '../../git/lockManager';
import { MODE_SET_CONFIGS } from '../../../config/modeSetConfigs';

// Type for subscription cleanup functions
type SubscriptionCleanup = () => void;

let subscriptionCleanups: SubscriptionCleanup[] = [];

export function setupStoreSubscriptions(): SubscriptionCleanup {
  // Clean up any existing subscriptions
  cleanupSubscriptions();

  // Subscribe to mode-set changes
  const modeSetCleanup = useStore.subscribe(
    (state) => state.modeSet,
    (modeSet, previousModeSet) => {
      if (modeSet !== previousModeSet) {
        applyModeSetConfig(modeSet);
        trackModeSetChange(modeSet, previousModeSet);
      }
    }
  );

  // Subscribe to lock changes for Git persistence
  const lockCleanup = useStore.subscribe(
    (state) => state.locks,
    (locks) => {
      // Persist locks to Git (debounced)
      debouncedSaveLocks(locks);
    }
  );

  // Subscribe to unsaved changes for UI updates
  const unsavedCleanup = useStore.subscribe(
    (state) => state.unsavedChanges,
    (unsavedChanges) => {
      updateUnsavedIndicator(unsavedChanges);
    }
  );

  // Subscribe to panel size changes for persistence
  const panelSizeCleanup = useStore.subscribe(
    (state) => state.panelSizes,
    (panelSizes) => {
      // Save panel sizes to user preferences
      savePanelSizesToPreferences(panelSizes);
    }
  );

  // Subscribe to continuity issues for notifications
  const continuityCleanup = useStore.subscribe(
    (state) => state.continuityIssues ? Object.values(state.continuityIssues).flat().length : 0,
    (issueCount, previousCount) => {
      if (issueCount > (previousCount || 0)) {
        // New issues detected
        notifyNewContinuityIssues(issueCount - (previousCount || 0));
      }
    }
  );

  // Subscribe to active jobs for progress tracking
  const jobCleanup = useStore.subscribe(
    (state) => state.activeJobs ? state.activeJobs.size : 0,
    (activeJobCount) => {
      updateJobIndicator(activeJobCount);
    }
  );

  // Store cleanup functions
  subscriptionCleanups = [
    modeSetCleanup,
    lockCleanup,
    unsavedCleanup,
    panelSizeCleanup,
    continuityCleanup,
    jobCleanup
  ];

  // Return cleanup function for all subscriptions
  return cleanupSubscriptions;
}

export function cleanupSubscriptions() {
  subscriptionCleanups.forEach(cleanup => cleanup());
  subscriptionCleanups = [];
}

// Helper functions for subscription handlers

function applyModeSetConfig(modeSet: StoreState['modeSet']) {
  const config = MODE_SET_CONFIGS[modeSet];

  // Apply CSS classes to body
  document.body.className = document.body.className
    .replace(/mode-\w+/g, '')
    .trim() + ` mode-${modeSet}`;

  // Apply theme-specific styles
  const root = document.documentElement;

  if (config.features.simplifiedUI) {
    root.style.setProperty('--ui-density', 'compact');
  } else {
    root.style.setProperty('--ui-density', 'comfortable');
  }

  // Update window title to reflect mode
  const baseTitle = document.title.replace(/ - \w+.*$/, '');
  document.title = `${baseTitle} - ${modeSet.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Mode`;

  console.log(`Applied ${modeSet} mode configuration`);
}

function trackModeSetChange(newMode: StoreState['modeSet'], previousMode?: StoreState['modeSet']) {
  // Analytics tracking
  if (typeof window !== 'undefined' && (window as { analytics?: { track: (event: string, data: Record<string, unknown>) => void } }).analytics) {
    (window as unknown as { analytics?: { track: (event: string, data: Record<string, unknown>) => void } }).analytics?.track('Mode Set Changed', {
      newMode,
      previousMode,
      timestamp: new Date().toISOString()
    });
  }

  // Console logging for development
  // Development logging
  if (typeof window !== 'undefined' && (window as { __DEV__?: boolean }).__DEV__) {
    console.log(`Mode changed: ${previousMode || 'none'} → ${newMode}`);
  }
}

// Debounced lock saving to prevent excessive Git operations
let saveLockTimer: NodeJS.Timeout;
function debouncedSaveLocks(locks: StoreState['locks']) {
  clearTimeout(saveLockTimer);
  saveLockTimer = setTimeout(() => {
    try {
      // TODO: Get actual repo path from project state
      const repoPath = '.'; // Default to current directory
      // Convert to API format for saving
      const apiLocks: Record<string, import('../../api/locks').ComponentLock> = {};
      Object.entries(locks).forEach(([key, lock]) => {
        apiLocks[key] = {
          id: lock.componentId,
          componentId: lock.componentId,
          componentType: 'component',
          type: 'personal',
          level: lock.level,
          reason: lock.reason || '',
          lockedBy: lock.lockedBy,
          lockedAt: lock.lockedAt,
          canOverride: false
        };
      });
      gitManager.saveLocks(repoPath, apiLocks);
    } catch (error) {
      console.error('Failed to save locks to Git:', error);
    }
  }, 1000); // 1 second debounce
}

function updateUnsavedIndicator(unsavedChanges: StoreState['unsavedChanges']) {
  const hasUnsaved = Object.values(unsavedChanges).some(Boolean);
  const count = Object.values(unsavedChanges).filter(Boolean).length;

  // Update window title with unsaved indicator
  const title = document.title;
  if (hasUnsaved && !title.startsWith('●')) {
    document.title = `● ${title}`;
  } else if (!hasUnsaved && title.startsWith('●')) {
    document.title = title.substring(2);
  }

  // Update favicon or other visual indicators
  updateFaviconForUnsavedChanges(hasUnsaved);

  // Dispatch custom event for other components to listen
  window.dispatchEvent(new CustomEvent('unsavedChanges', {
    detail: { hasUnsaved, count }
  }));
}

function savePanelSizesToPreferences(panelSizes: StoreState['panelSizes']) {
  // Save to localStorage as backup
  try {
    localStorage.setItem('plotweaver-panel-sizes', JSON.stringify(panelSizes));
  } catch (error) {
    console.warn('Failed to save panel sizes to localStorage:', error);
  }
}

function notifyNewContinuityIssues(newIssueCount: number) {
  // Show toast notification for new issues
  console.log(`${newIssueCount} new continuity issue(s) detected`);

  // Could integrate with a toast notification system here
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification('PlotWeaver', {
        body: `${newIssueCount} new continuity issue(s) detected`,
        icon: '/favicon.ico'
      });
    }
  }
}

function updateJobIndicator(activeJobCount: number) {
  // Update progress indicator in UI
  const indicator = document.querySelector('[data-job-indicator]');
  if (indicator) {
    indicator.textContent = activeJobCount > 0 ? `${activeJobCount}` : '';
    indicator.className = activeJobCount > 0 ? 'visible' : 'hidden';
  }
}

function updateFaviconForUnsavedChanges(hasUnsaved: boolean) {
  const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (favicon) {
    // Switch to different favicon when there are unsaved changes
    const baseFavicon = '/favicon.ico';
    const unsavedFavicon = '/favicon-unsaved.ico';

    favicon.href = hasUnsaved ? unsavedFavicon : baseFavicon;
  }
}