import { test, expect } from '@playwright/test';

test.describe('Lock Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to application with existing project
    await page.goto('/project/test-project');
    await page.waitForLoadState('networkidle');
  });

  test('complete lock workflow prevents unwanted changes', async ({ page }) => {
    // Navigate to a specific character/scene
    await page.click('text=Elena Martinez');
    
    // Verify content is loaded
    await expect(page.locator('.editor-content')).toContainText('Elena Martinez');
    
    // Open lock menu
    await page.click('button[aria-label="Lock menu"]');
    
    // Verify lock options are available
    await expect(page.locator('text=Soft Lock')).toBeVisible();
    await expect(page.locator('text=Hard Lock')).toBeVisible();
    await expect(page.locator('text=Freeze')).toBeVisible();
    
    // Apply hard lock
    await page.click('text=Hard Lock');
    
    // Fill in lock reason
    await page.fill('input[placeholder="Lock reason"]', 'Character finalized for publication');
    await page.click('text=Confirm Lock');
    
    // Verify lock indicator appears
    await expect(page.locator('.lock-indicator')).toContainText('🔒');
    await expect(page.locator('text=Hard Lock')).toBeVisible();
    
    // Try to edit locked content
    await page.click('.editor-content');
    await page.keyboard.type('This should trigger a confirmation dialog');
    
    // Should see confirmation dialog
    await expect(page.locator('text=Confirm Edit to Locked Content')).toBeVisible();
    await expect(page.locator('text=Character finalized for publication')).toBeVisible();
    
    // Test canceling edit
    await page.click('text=Cancel');
    
    // Content should not change
    await expect(page.locator('.editor-content')).not.toContainText('This should trigger');
    
    // Test confirming edit
    await page.click('.editor-content');
    await page.keyboard.type('Confirmed edit to locked content');
    
    // Confirm the edit
    await page.click('text=Edit Anyway');
    
    // Content should now be updated
    await expect(page.locator('.editor-content')).toContainText('Confirmed edit to locked content');
  });

  test('soft lock allows AI suggestions only', async ({ page }) => {
    // Navigate to content
    await page.click('text=Chapter 1');
    await page.click('text=Scene 1');
    
    // Apply soft lock
    await page.click('button[aria-label="Lock menu"]');
    await page.click('text=Soft Lock');
    await page.fill('input[placeholder="Lock reason"]', 'Pending review from editor');
    await page.click('text=Confirm Lock');
    
    // Verify soft lock indicator
    await expect(page.locator('.lock-indicator')).toContainText('🔒 Soft');
    
    // Should show AI suggestions only message
    await expect(page.locator('text=AI suggestions only')).toBeVisible();
    
    // Manual editing should be disabled
    const editor = page.locator('.editor-content');
    await expect(editor).toHaveAttribute('contenteditable', 'false');
    
    // AI suggestion button should be available
    await expect(page.locator('text=Get AI Suggestion')).toBeVisible();
    
    // Test AI suggestion workflow
    await page.click('text=Get AI Suggestion');
    
    // Wait for AI suggestion dialog
    await page.waitForSelector('.ai-suggestion-dialog');
    await expect(page.locator('text=AI Suggestion')).toBeVisible();
    
    // Should show suggestion content
    await expect(page.locator('.suggestion-content')).toContainText('improved');
    
    // Test applying suggestion
    await page.click('text=Apply Suggestion');
    
    // Content should be updated with AI suggestion
    await expect(page.locator('.editor-content')).toContainText('improved');
    
    // Test dismissing suggestion
    await page.click('text=Get AI Suggestion');
    await page.click('text=Dismiss');
    
    // Dialog should close
    await expect(page.locator('.ai-suggestion-dialog')).not.toBeVisible();
  });

  test('frozen content is completely uneditable', async ({ page }) => {
    // Navigate to content
    await page.click('text=Final Chapter');
    
    // Apply freeze lock
    await page.click('button[aria-label="Lock menu"]');
    await page.click('text=Freeze');
    await page.fill('input[placeholder="Lock reason"]', 'Final version - do not edit');
    await page.click('text=Confirm Lock');
    
    // Verify freeze indicator
    await expect(page.locator('.lock-indicator')).toContainText('❄️');
    await expect(page.locator('text=Frozen')).toBeVisible();
    
    // Editor should be completely disabled
    const editor = page.locator('.editor-content');
    await expect(editor).toHaveAttribute('contenteditable', 'false');
    
    // Clicking should show frozen message
    await page.click('.editor-content');
    await expect(page.locator('text=This content is frozen')).toBeVisible();
    await expect(page.locator('text=Final version - do not edit')).toBeVisible();
    
    // No edit options should be available
    await expect(page.locator('text=Edit Anyway')).not.toBeVisible();
    await expect(page.locator('text=Get AI Suggestion')).not.toBeVisible();
    
    // Lock menu should show unlock option only
    await page.click('button[aria-label="Lock menu"]');
    await expect(page.locator('text=Unlock')).toBeVisible();
    await expect(page.locator('text=Soft Lock')).not.toBeVisible();
    await expect(page.locator('text=Hard Lock')).not.toBeVisible();
  });

  test('collaborative lock conflicts are handled properly', async ({ page }) => {
    // Simulate multiple users
    const user1Context = await page.context().newPage();
    const user2Context = await page.context().newPage();
    
    // User 1 locks content
    await user1Context.goto('/project/test-project');
    await user1Context.click('text=Shared Scene');
    await user1Context.click('button[aria-label="Lock menu"]');
    await user1Context.click('text=Hard Lock');
    await user1Context.fill('input[placeholder="Lock reason"]', 'User 1 editing');
    await user1Context.click('text=Confirm Lock');
    
    // User 2 tries to edit the same content
    await user2Context.goto('/project/test-project');
    await user2Context.click('text=Shared Scene');
    
    // Should show lock conflict
    await expect(user2Context.locator('text=Content locked by User 1')).toBeVisible();
    await expect(user2Context.locator('text=User 1 editing')).toBeVisible();
    
    // User 2 should see options to request unlock or wait
    await expect(user2Context.locator('text=Request Unlock')).toBeVisible();
    await expect(user2Context.locator('text=Wait for Unlock')).toBeVisible();
    
    // Test request unlock
    await user2Context.click('text=Request Unlock');
    await user2Context.fill('textarea[placeholder="Why do you need to edit this?"]', 'Urgent fix needed');
    await user2Context.click('text=Send Request');
    
    // User 1 should see unlock request
    await expect(user1Context.locator('text=Unlock request from User 2')).toBeVisible();
    await expect(user1Context.locator('text=Urgent fix needed')).toBeVisible();
    
    // User 1 can approve or deny
    await user1Context.click('text=Approve Request');
    
    // Lock should be released
    await expect(user1Context.locator('text=Lock released')).toBeVisible();
    
    // User 2 should now be able to edit
    await expect(user2Context.locator('.editor-content')).toHaveAttribute('contenteditable', 'true');
  });

  test('lock expiration works correctly', async ({ page }) => {
    // Navigate to content
    await page.click('text=Time-sensitive Scene');
    
    // Apply lock with expiration
    await page.click('button[aria-label="Lock menu"]');
    await page.click('text=Hard Lock');
    await page.fill('input[placeholder="Lock reason"]', 'Temporary edit session');
    
    // Set expiration time (1 minute)
    await page.click('text=Set Expiration');
    await page.fill('input[type="datetime-local"]', '2024-01-01T12:01:00');
    
    await page.click('text=Confirm Lock');
    
    // Verify lock with expiration
    await expect(page.locator('.lock-indicator')).toContainText('🔒');
    await expect(page.locator('text=Expires at')).toBeVisible();
    
    // Fast-forward time (mock system time)
    await page.evaluate(() => {
      // Mock Date.now to return time after expiration
      const originalNow = Date.now;
      Date.now = () => originalNow() + 2 * 60 * 1000; // 2 minutes later
    });
    
    // Refresh page to trigger expiration check
    await page.reload();
    
    // Lock should be expired
    await expect(page.locator('text=Lock expired')).toBeVisible();
    await expect(page.locator('.lock-indicator')).toContainText('⏰');
    
    // Content should be editable again
    await expect(page.locator('.editor-content')).toHaveAttribute('contenteditable', 'true');
  });

  test('lock inheritance in hierarchical content', async ({ page }) => {
    // Navigate to chapter
    await page.click('text=Chapter 2');
    
    // Apply lock to entire chapter
    await page.click('button[aria-label="Lock menu"]');
    await page.click('text=Hard Lock');
    await page.fill('input[placeholder="Lock reason"]', 'Chapter under review');
    await page.click('text=Confirm Lock');
    
    // All scenes in chapter should inherit lock
    await page.click('text=Scene 1');
    await expect(page.locator('.lock-indicator')).toContainText('🔒');
    await expect(page.locator('text=Inherited from Chapter 2')).toBeVisible();
    
    await page.click('text=Scene 2');
    await expect(page.locator('.lock-indicator')).toContainText('🔒');
    await expect(page.locator('text=Inherited from Chapter 2')).toBeVisible();
    
    // Try to edit scene with inherited lock
    await page.click('.editor-content');
    await page.keyboard.type('Should show chapter lock confirmation');
    
    // Should show confirmation with chapter context
    await expect(page.locator('text=Chapter 2 is locked')).toBeVisible();
    await expect(page.locator('text=Chapter under review')).toBeVisible();
    
    // Override lock at scene level
    await page.click('text=Override Chapter Lock');
    await page.fill('input[placeholder="Override reason"]', 'Critical scene fix');
    await page.click('text=Confirm Override');
    
    // Scene should now be editable
    await expect(page.locator('.editor-content')).toHaveAttribute('contenteditable', 'true');
    
    // Lock indicator should show override
    await expect(page.locator('text=Override Active')).toBeVisible();
  });

  test('lock audit trail and history', async ({ page }) => {
    // Navigate to content
    await page.click('text=Tracked Scene');
    
    // Apply initial lock
    await page.click('button[aria-label="Lock menu"]');
    await page.click('text=Soft Lock');
    await page.fill('input[placeholder="Lock reason"]', 'Initial lock');
    await page.click('text=Confirm Lock');
    
    // Upgrade to hard lock
    await page.click('button[aria-label="Lock menu"]');
    await page.click('text=Hard Lock');
    await page.fill('input[placeholder="Lock reason"]', 'Upgraded to hard lock');
    await page.click('text=Confirm Lock');
    
    // Unlock and relock
    await page.click('button[aria-label="Lock menu"]');
    await page.click('text=Unlock');
    await page.fill('input[placeholder="Unlock reason"]', 'Temporary unlock for edits');
    await page.click('text=Confirm Unlock');
    
    // Relock with freeze
    await page.click('button[aria-label="Lock menu"]');
    await page.click('text=Freeze');
    await page.fill('input[placeholder="Lock reason"]', 'Final freeze');
    await page.click('text=Confirm Lock');
    
    // View lock history
    await page.click('button[aria-label="Lock menu"]');
    await page.click('text=View History');
    
    // Should show complete audit trail
    await expect(page.locator('.lock-history')).toBeVisible();
    await expect(page.locator('text=Initial lock')).toBeVisible();
    await expect(page.locator('text=Upgraded to hard lock')).toBeVisible();
    await expect(page.locator('text=Temporary unlock for edits')).toBeVisible();
    await expect(page.locator('text=Final freeze')).toBeVisible();
    
    // Should show timestamps and user info
    await expect(page.locator('.lock-history-item')).toContainText('ago');
    await expect(page.locator('.lock-history-item')).toContainText('User');
    
    // Should show lock level progression
    await expect(page.locator('text=Soft → Hard → Unlocked → Frozen')).toBeVisible();
  });

  test('lock integration with Git workflow', async ({ page }) => {
    // Switch to Professional Writer mode for Git features
    await page.click('[data-testid="mode-selector"]');
    await page.click('text=Professional Writer');
    
    // Navigate to content
    await page.click('text=Git-tracked Scene');
    
    // Make some changes
    await page.fill('.editor-content', 'This content will be locked and committed');
    
    // Apply lock
    await page.click('button[aria-label="Lock menu"]');
    await page.click('text=Hard Lock');
    await page.fill('input[placeholder="Lock reason"]', 'Finalized for commit');
    await page.click('text=Confirm Lock');
    
    // Commit changes with lock
    await page.click('[data-testid="git-panel"] .git-commit-button');
    await page.fill('textarea[placeholder="Commit message"]', 'Lock finalized scene');
    await page.click('text=Commit');
    
    // Lock should be persisted in Git metadata
    await expect(page.locator('text=Lock recorded in Git')).toBeVisible();
    
    // Verify lock survives checkout
    await page.click('text=View Git History');
    await page.click('text=Previous Commit');
    await page.click('text=Checkout');
    
    // Navigate back to scene
    await page.click('text=Git-tracked Scene');
    
    // Lock should still be active
    await expect(page.locator('.lock-indicator')).toContainText('🔒');
    await expect(page.locator('text=Finalized for commit')).toBeVisible();
    
    // Return to latest commit
    await page.click('text=Checkout main');
    
    // Lock should still be preserved
    await expect(page.locator('.lock-indicator')).toContainText('🔒');
  });

  test('bulk lock operations', async ({ page }) => {
    // Navigate to file tree
    await page.click('[data-testid="file-tree"]');
    
    // Select multiple files
    await page.click('input[type="checkbox"][data-file-id="scene-1"]');
    await page.click('input[type="checkbox"][data-file-id="scene-2"]');
    await page.click('input[type="checkbox"][data-file-id="scene-3"]');
    
    // Should show bulk actions
    await expect(page.locator('text=3 items selected')).toBeVisible();
    await expect(page.locator('text=Bulk Lock')).toBeVisible();
    
    // Apply bulk lock
    await page.click('text=Bulk Lock');
    await page.click('text=Soft Lock');
    await page.fill('input[placeholder="Lock reason"]', 'Batch processing');
    await page.click('text=Apply to All');
    
    // All selected files should be locked
    await expect(page.locator('[data-file-id="scene-1"] .lock-indicator')).toBeVisible();
    await expect(page.locator('[data-file-id="scene-2"] .lock-indicator')).toBeVisible();
    await expect(page.locator('[data-file-id="scene-3"] .lock-indicator')).toBeVisible();
    
    // Test bulk unlock
    await page.click('text=Bulk Unlock');
    await page.fill('input[placeholder="Unlock reason"]', 'Batch unlock');
    await page.click('text=Unlock All');
    
    // All locks should be removed
    await expect(page.locator('[data-file-id="scene-1"] .lock-indicator')).not.toBeVisible();
    await expect(page.locator('[data-file-id="scene-2"] .lock-indicator')).not.toBeVisible();
    await expect(page.locator('[data-file-id="scene-3"] .lock-indicator')).not.toBeVisible();
  });
});