import { test, expect } from '@playwright/test';

test.describe('Story Generation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and login
    await page.goto('/');
    
    // Mock authentication for testing
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'test-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
      }));
    });
  });

  test('complete story generation from concept to finished scene', async ({ page }) => {
    // 1. Create new project
    await page.goto('/projects/new');
    
    // Fill in project details
    await page.fill('[data-testid="project-name"]', 'Test Fantasy Novel');
    await page.selectOption('[data-testid="genre-select"]', 'fantasy');
    await page.fill('[data-testid="concept-seed"]', 'A young wizard discovers an ancient prophecy that reveals they must save their kingdom from a dark curse.');
    
    await page.click('[data-testid="create-project"]');
    
    // Wait for project creation
    await expect(page).toHaveURL(/\/project\/[a-z0-9-]+/);
    
    // 2. Foundation setup
    await page.click('[data-testid="foundation-tab"]');
    
    // Verify components are created
    await expect(page.locator('[data-testid="component-concept"]')).toBeVisible();
    await expect(page.locator('[data-testid="component-plot"]')).toBeVisible();
    await expect(page.locator('[data-testid="component-characters"]')).toBeVisible();
    
    // Lock concept
    await page.click('[data-testid="select-concept"]');
    await page.click('[data-testid="lock-selected"]');
    
    // Verify lock applied
    await expect(page.locator('[data-testid="lock-icon-concept"]')).toBeVisible();
    
    // 3. Generate first scene
    await page.click('[data-testid="scenes-tab"]');
    await page.click('[data-testid="generate-scene"]');
    
    // Configure scene generation
    await page.fill('[data-testid="scene-title"]', 'The Prophecy Revealed');
    await page.selectOption('[data-testid="scene-type"]', 'opening');
    await page.click('[data-testid="start-generation"]');
    
    // Monitor generation progress
    await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible();
    
    // Wait for generation to complete (mock faster for tests)
    await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 30000 });
    
    // 4. Review generated content
    const sceneContent = await page.textContent('[data-testid="scene-content"]');
    expect(sceneContent).toContain('wizard');
    expect(sceneContent).toContain('prophecy');
    
    // Check quality metrics
    await expect(page.locator('[data-testid="quality-score"]')).toHaveText(/[8-9]\d%/);
    
    // 5. Lock the scene
    await page.click('[data-testid="lock-scene"]');
    await page.fill('[data-testid="lock-reason"]', 'Perfect opening scene');
    await page.click('[data-testid="confirm-lock"]');
    
    // Verify scene is locked
    await expect(page.locator('[data-testid="scene-locked-indicator"]')).toBeVisible();
  });

  test('handles offline mode during generation', async ({ page, context }) => {
    await page.goto('/project/test-project');
    
    // Start scene generation
    await page.click('[data-testid="generate-scene"]');
    await page.fill('[data-testid="scene-title"]', 'Offline Test Scene');
    
    // Go offline
    await context.setOffline(true);
    
    await page.click('[data-testid="start-generation"]');
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-message"]')).toContainText('Working offline');
    
    // Make changes while offline
    await page.click('[data-testid="plot-tab"]');
    await page.fill('[data-testid="plot-notes"]', 'Updated plot while offline');
    
    // Go back online
    await context.setOffline(false);
    
    // Should sync automatically
    await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible({ timeout: 10000 });
    
    // Verify changes persisted
    await page.reload();
    const plotNotes = await page.inputValue('[data-testid="plot-notes"]');
    expect(plotNotes).toBe('Updated plot while offline');
  });

  test('resolves lock conflicts between users', async ({ page, browser }) => {
    // First user locks a component
    await page.goto('/project/test-project');
    await page.click('[data-testid="select-plot"]');
    await page.click('[data-testid="lock-selected"]');
    
    // Second user in different browser context
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    
    await page2.goto('/project/test-project');
    await page2.evaluate(() => {
      localStorage.setItem('auth-token', 'test-token-2');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-2',
        email: 'test2@example.com',
        name: 'Test User 2',
      }));
    });
    
    // Try to lock the same component
    await page2.click('[data-testid="select-plot"]');
    await page2.click('[data-testid="lock-selected"]');
    
    // Should show conflict dialog
    await expect(page2.locator('[data-testid="lock-conflict-dialog"]')).toBeVisible();
    await expect(page2.locator('[data-testid="conflict-message"]')).toContainText('already locked by Test User');
    
    // Can view lock details
    await page2.click('[data-testid="view-lock-details"]');
    await expect(page2.locator('[data-testid="lock-owner"]')).toContainText('Test User');
    
    await context2.close();
  });

  test('manages pre-generation queue', async ({ page }) => {
    await page.goto('/project/test-project');
    await page.click('[data-testid="queue-tab"]');
    
    // Add multiple scenes to queue
    for (let i = 1; i <= 3; i++) {
      await page.click('[data-testid="add-to-queue"]');
      await page.fill('[data-testid="queue-scene-title"]', `Chapter ${i} Opening`);
      await page.selectOption('[data-testid="queue-priority"]', i === 1 ? 'high' : 'normal');
      await page.click('[data-testid="confirm-queue"]');
    }
    
    // Verify queue display
    await expect(page.locator('[data-testid="queue-item"]')).toHaveCount(3);
    
    // Check cost estimation
    await expect(page.locator('[data-testid="total-cost"]')).toContainText('$');
    await expect(page.locator('[data-testid="total-time"]')).toContainText('min');
    
    // Reorder queue
    await page.dragAndDrop(
      '[data-testid="queue-item-3"]',
      '[data-testid="queue-item-1"]'
    );
    
    // Start batch generation
    await page.click('[data-testid="start-batch-generation"]');
    
    // Monitor progress
    await expect(page.locator('[data-testid="batch-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-generating"]')).toContainText('Chapter 3 Opening');
  });

  test('exports story in multiple formats', async ({ page }) => {
    await page.goto('/project/test-project');
    
    // Navigate to export
    await page.click('[data-testid="export-button"]');
    
    // Select export format
    await page.selectOption('[data-testid="export-format"]', 'scrivener');
    
    // Configure export options
    await page.check('[data-testid="include-metadata"]');
    await page.check('[data-testid="include-character-sheets"]');
    
    // Start export
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-now"]'),
    ]);
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/test-project.*\.scriv/);
  });

  test('uses AI context builder effectively', async ({ page }) => {
    await page.goto('/project/test-project/scene/test-scene');
    await page.click('[data-testid="context-builder"]');
    
    // Available components should be listed
    await expect(page.locator('[data-testid="available-components"]')).toBeVisible();
    
    // Drag components to context
    await page.dragAndDrop(
      '[data-testid="component-main-character"]',
      '[data-testid="context-drop-zone"]'
    );
    
    await page.dragAndDrop(
      '[data-testid="component-prophecy-plot"]',
      '[data-testid="context-drop-zone"]'
    );
    
    // Check relevance scores
    await expect(page.locator('[data-testid="relevance-main-character"]')).toContainText(/9\d%/);
    
    // Get AI suggestions
    await page.click('[data-testid="get-ai-suggestions"]');
    await expect(page.locator('[data-testid="ai-suggestion"]').first()).toBeVisible();
    
    // Build context
    await page.click('[data-testid="build-context"]');
    
    // Verify token count
    await expect(page.locator('[data-testid="token-count"]')).toContainText(/\d+ tokens/);
  });

  test('tracks performance metrics', async ({ page }) => {
    await page.goto('/project/test-project/analytics');
    
    // Check generation metrics
    await expect(page.locator('[data-testid="avg-generation-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-cost"]')).toBeVisible();
    await expect(page.locator('[data-testid="quality-trend"]')).toBeVisible();
    
    // View cost breakdown
    await page.click('[data-testid="cost-breakdown-tab"]');
    await expect(page.locator('[data-testid="cost-by-agent"]')).toBeVisible();
    await expect(page.locator('[data-testid="dh-savings"]')).toContainText(/\d+% saved/);
  });
});

test.describe('Accessibility', () => {
  test('supports keyboard navigation', async ({ page }) => {
    await page.goto('/project/test-project');
    
    // Tab through interface
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'project-menu');
    
    // Use arrow keys in file tree
    await page.keyboard.press('ArrowDown');
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'tree-item-plot');
    
    // Lock with keyboard shortcut
    await page.keyboard.press('Control+l');
    await expect(page.locator('[data-testid="lock-dialog"]')).toBeVisible();
    
    // Escape to close
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="lock-dialog"]')).not.toBeVisible();
  });

  test('announces changes to screen readers', async ({ page }) => {
    await page.goto('/project/test-project');
    
    // Enable screen reader testing
    await page.addScriptTag({
      content: `
        window.announcements = [];
        const originalAnnounce = window.announce || (() => {});
        window.announce = (message) => {
          window.announcements.push(message);
          originalAnnounce(message);
        };
      `,
    });
    
    // Perform action
    await page.click('[data-testid="generate-scene"]');
    
    // Check announcements
    const announcements = await page.evaluate(() => window.announcements);
    expect(announcements).toContain('Scene generation started');
  });
});
