import { useEffect } from 'react';
import { ContinuityIssue } from '../types/continuity';
import { continuityAPI } from '../lib/api/continuity';

// Simple toast system - in a real app, you'd use a library like react-hot-toast
class SimpleToastManager {
  private toasts: Map<string, HTMLElement> = new Map();
  private container: HTMLElement | null = null;

  private getContainer(): HTMLElement {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container fixed top-4 right-4 z-50 space-y-2';
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  show(id: string, content: HTMLElement) {
    const container = this.getContainer();
    const toastWrapper = document.createElement('div');
    toastWrapper.className = 'toast-wrapper';
    toastWrapper.appendChild(content);

    container.appendChild(toastWrapper);
    this.toasts.set(id, toastWrapper);

    // Auto-dismiss after 10 seconds
    setTimeout(() => this.dismiss(id), 10000);
  }

  dismiss(id: string) {
    const toast = this.toasts.get(id);
    if (toast) {
      toast.remove();
      this.toasts.delete(id);
    }
  }
}

const toastManager = new SimpleToastManager();

// Track which alerts we've shown to avoid spam
const shownAlerts = new Set<string>();

const hasShownAlert = (issueId: string): boolean => {
  return shownAlerts.has(issueId);
};

const markAlertShown = (issueId: string): void => {
  shownAlerts.add(issueId);
  // Clear after 5 minutes to allow re-showing if issue persists
  setTimeout(() => shownAlerts.delete(issueId), 5 * 60 * 1000);
};

const showToast = (issue: ContinuityIssue): void => {
  const toastElement = document.createElement('div');

  // Create React element manually (in a real app, you'd use React.render)
  toastElement.innerHTML = `
    <div class="continuity-alert-toast bg-white border border-yellow-200 rounded-lg shadow-lg p-4 max-w-md">
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <div class="h-5 w-5 text-yellow-500 mt-0.5">⚠️</div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900">Continuity Issue Detected</p>
          <p class="text-sm text-gray-600 mt-1">${issue.description}</p>
          <div class="flex gap-2 mt-3">
            <button class="view-details inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors">
              View Details
            </button>
            ${issue.quickFix ? `
              <button class="quick-fix inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors">
                Quick Fix
              </button>
            ` : ''}
          </div>
        </div>
        <button class="dismiss flex-shrink-0 text-gray-400 hover:text-gray-600">×</button>
      </div>
    </div>
  `;

  // Add event listeners
  const viewButton = toastElement.querySelector('.view-details');
  const quickFixButton = toastElement.querySelector('.quick-fix');
  const dismissButton = toastElement.querySelector('.dismiss');

  viewButton?.addEventListener('click', () => {
    console.log('Showing continuity panel for issue:', issue.id);
  });

  quickFixButton?.addEventListener('click', async () => {
    if (issue.quickFix) {
      try {
        await continuityAPI.applyFix(issue.quickFix.id);
        console.log('Quick fix applied:', issue.quickFix.label);
        toastManager.dismiss(issue.id);
      } catch (error) {
        console.error('Failed to apply quick fix:', error);
      }
    }
  });

  dismissButton?.addEventListener('click', () => {
    toastManager.dismiss(issue.id);
  });

  toastManager.show(issue.id, toastElement);
};

export function useContinuityAlerts() {
  useEffect(() => {
    // For now, we'll use a mock current scene. In a real app, this would come from editor state
    const currentScene = { id: 'mock-scene-1' };

    if (!currentScene) return;

    const checkInterval = setInterval(async () => {
      try {
        const issues = await continuityAPI.quickCheck(currentScene.id);

        issues.forEach(issue => {
          if (!hasShownAlert(issue.id)) {
            showToast(issue);
            markAlertShown(issue.id);
          }
        });
      } catch (error) {
        console.error('Failed to check continuity:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkInterval);
  }, []);
}