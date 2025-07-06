import { test, expect } from '@playwright/test';

test.describe('Complete Writing Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('complete scene generation and editing workflow', async ({ page }) => {
    // Start with AI-First mode for generation workflow
    await page.click('text=AI-First');
    
    // Create new project
    await page.click('text=New Project');
    await page.fill('input[placeholder="Project name"]', 'Mystery Novel');
    await page.fill('textarea[placeholder="Project description"]', 'A detective mystery set in 1920s Chicago');
    await page.click('text=Create Project');
    
    // Set up initial story structure
    await page.click('text=Add Chapter');
    await page.fill('input[placeholder="Chapter name"]', 'Chapter 1: The Discovery');
    await page.click('text=Add Scene');
    await page.fill('input[placeholder="Scene name"]', 'Scene 1: The Jazz Club');
    
    // Generate first scene
    await page.click('text=Generate Scene');
    
    // Wait for generation options
    await page.waitForSelector('.generation-options');
    
    // Fill in generation prompts
    await page.fill('textarea[placeholder="Scene description"]', 'Elena discovers a mysterious letter hidden in the jazz club. The atmosphere is tense and smoky.');
    await page.fill('input[placeholder="Key characters"]', 'Elena Martinez, Tommy the bartender');
    await page.fill('input[placeholder="Mood/tone"]', 'Mysterious, atmospheric');
    
    // Start generation
    await page.click('text=Generate');
    
    // Wait for agent progress
    await page.waitForSelector('.agent-progress-item');
    await expect(page.locator('text=Scene Generator')).toBeVisible();
    
    // Monitor progress
    await page.waitForSelector('text=Analyzing context', { timeout: 10000 });
    await page.waitForSelector('text=Generating content', { timeout: 15000 });
    await page.waitForSelector('text=Refining output', { timeout: 20000 });
    
    // Wait for completion
    await page.waitForSelector('text=Generation complete', { timeout: 30000 });
    
    // Verify scene content is generated
    await expect(page.locator('.editor-content')).toContainText('Elena');
    await expect(page.locator('.editor-content')).toContainText('jazz club');
    
    // Check that scene appears in project structure
    await expect(page.locator('.file-tree')).toContainText('Scene 1: The Jazz Club');
    
    // Test editing the generated content
    await page.click('.editor-content');
    await page.keyboard.press('End');
    await page.keyboard.type(' Elena\'s heart raced as she unfolded the mysterious letter.');
    
    // Auto-save should trigger
    await page.waitForSelector('text=Auto-saved', { timeout: 5000 });
    
    // Generate next scene
    await page.click('text=Add Scene');
    await page.fill('input[placeholder="Scene name"]', 'Scene 2: The Letter');
    await page.click('text=Generate Scene');
    
    // Use pre-generation feature
    await page.click('text=Use Pre-generated Scene');
    await page.click('.pre-generated-scene:first-child');
    
    // Verify pre-generated content is used
    await expect(page.locator('.editor-content')).toContainText('letter');
    
    // Test continuity between scenes
    await page.click('text=Scene 1: The Jazz Club');
    await page.fill('.editor-content', 'Elena wore a blue coat as she entered the jazz club.');
    
    // Switch to Scene 2 and create inconsistency
    await page.click('text=Scene 2: The Letter');
    await page.fill('.editor-content', 'Elena\'s red coat was damp from the rain as she read the letter.');
    
    // Wait for continuity check
    await page.waitForSelector('text=Continuity Issue Detected', { timeout: 10000 });
    
    // Check continuity details
    await expect(page.locator('text=Clothing inconsistency detected')).toBeVisible();
    await expect(page.locator('text=blue coat')).toBeVisible();
    await expect(page.locator('text=red coat')).toBeVisible();
    
    // Fix continuity
    await page.click('text=Fix Continuity');
    await page.click('text=Use red coat throughout');
    await page.click('text=Apply Fix');
    
    // Verify fix is applied
    await page.click('text=Scene 1: The Jazz Club');
    await expect(page.locator('.editor-content')).toContainText('red coat');
    
    // Test AI suggestions
    await page.click('text=Get AI Suggestion');
    await page.waitForSelector('.ai-suggestion-dialog');
    await page.click('text=Apply Suggestion');
    
    // Verify content is enhanced
    await expect(page.locator('.editor-content')).toContainText('enhanced');
  });

  test('collaborative writing workflow', async ({ page }) => {
    // Set up collaborative context
    await page.click('text=Professional Writer');
    
    // Open existing project
    await page.click('text=Open Project');
    await page.click('text=Collaborative Novel');
    
    // Should show collaboration status
    await expect(page.locator('text=2 collaborators online')).toBeVisible();
    
    // Navigate to shared scene
    await page.click('text=Shared Chapter');
    await page.click('text=Collaborative Scene');
    
    // Should show who's working on what
    await expect(page.locator('text=Sarah is editing')).toBeVisible();
    
    // Try to edit content that's being worked on
    await page.click('.editor-content');
    await page.keyboard.type('My addition to the scene');
    
    // Should show collaboration warning
    await expect(page.locator('text=Sarah is also editing this content')).toBeVisible();
    
    // Handle merge conflict
    await page.click('text=Resolve Conflict');
    await page.click('text=Merge Changes');
    
    // Should show merged content
    await expect(page.locator('.editor-content')).toContainText('My addition');
    await expect(page.locator('.editor-content')).toContainText('Sarah\'s changes');
    
    // Test real-time sync
    await page.keyboard.type(' Additional collaborative text');
    
    // Should show sync status
    await page.waitForSelector('text=Syncing', { timeout: 2000 });
    await page.waitForSelector('text=Synced', { timeout: 5000 });
    
    // Test commenting system
    await page.click('text=Add Comment');
    await page.fill('textarea[placeholder="Add your comment"]', 'This section needs more detail');
    await page.click('text=Post Comment');
    
    // Should show comment
    await expect(page.locator('.comment-thread')).toContainText('This section needs more detail');
    
    // Test lock coordination
    await page.click('button[aria-label="Lock menu"]');
    await page.click('text=Request Lock');
    await page.fill('textarea[placeholder="Why do you need to lock this?"]', 'Major revision needed');
    await page.click('text=Send Request');
    
    // Should show lock request status
    await expect(page.locator('text=Lock requested')).toBeVisible();
    
    // Simulate approval (would come from other user)
    await page.click('text=Lock approved');
    
    // Should now be able to lock
    await expect(page.locator('.lock-indicator')).toContainText('🔒');
  });

  test('version control integration workflow', async ({ page }) => {
    // Professional Writer mode for Git integration
    await page.click('text=Professional Writer');
    
    // Open project with Git
    await page.click('text=Open Project');
    await page.click('text=Git-tracked Project');
    
    // Should show Git status
    await expect(page.locator('[data-testid="git-panel"]')).toBeVisible();
    await expect(page.locator('text=Clean working directory')).toBeVisible();
    
    // Make changes
    await page.click('text=Chapter 1');
    await page.click('text=Opening Scene');
    await page.fill('.editor-content', 'This is new content that will be committed to Git.');
    
    // Should show Git status changes
    await expect(page.locator('text=1 file modified')).toBeVisible();
    
    // View diff
    await page.click('text=View Changes');
    await expect(page.locator('.git-diff')).toBeVisible();
    await expect(page.locator('text=+ This is new content')).toBeVisible();
    
    // Stage changes
    await page.click('text=Stage Changes');
    await expect(page.locator('text=1 file staged')).toBeVisible();
    
    // Commit changes
    await page.click('text=Commit');
    await page.fill('textarea[placeholder="Commit message"]', 'Add new opening scene content');
    await page.click('text=Commit Changes');
    
    // Should show commit success
    await expect(page.locator('text=Committed successfully')).toBeVisible();
    
    // Test branching workflow
    await page.click('text=Create Branch');
    await page.fill('input[placeholder="Branch name"]', 'feature/new-character');
    await page.click('text=Create');
    
    // Should switch to new branch
    await expect(page.locator('text=feature/new-character')).toBeVisible();
    
    // Make changes on branch
    await page.click('text=Add Character');
    await page.fill('input[placeholder="Character name"]', 'Detective Morgan');
    await page.click('text=Create Character');
    
    // Commit branch changes
    await page.click('[data-testid="git-panel"] .git-commit-button');
    await page.fill('textarea[placeholder="Commit message"]', 'Add Detective Morgan character');
    await page.click('text=Commit Changes');
    
    // Test merge workflow
    await page.click('text=Switch Branch');
    await page.click('text=main');
    
    // Should switch back to main
    await expect(page.locator('text=main')).toBeVisible();
    
    // Merge feature branch
    await page.click('text=Merge Branch');
    await page.click('text=feature/new-character');
    await page.click('text=Merge');
    
    // Should show merge success
    await expect(page.locator('text=Merged successfully')).toBeVisible();
    
    // Character should now be available on main
    await expect(page.locator('text=Detective Morgan')).toBeVisible();
  });

  test('export and publishing workflow', async ({ page }) => {
    // Professional Writer mode
    await page.click('text=Professional Writer');
    
    // Open completed project
    await page.click('text=Open Project');
    await page.click('text=Finished Novel');
    
    // Test export functionality
    await page.click('text=Export');
    
    // Should show export options
    await expect(page.locator('text=Export to PDF')).toBeVisible();
    await expect(page.locator('text=Export to EPUB')).toBeVisible();
    await expect(page.locator('text=Export to Word')).toBeVisible();
    
    // Test PDF export
    await page.click('text=Export to PDF');
    
    // Configure export options
    await page.click('text=Include Cover Page');
    await page.click('text=Include Table of Contents');
    await page.fill('input[placeholder="Title"]', 'The Chicago Mystery');
    await page.fill('input[placeholder="Author"]', 'Test Author');
    
    // Start export
    await page.click('text=Export');
    
    // Should show export progress
    await expect(page.locator('text=Preparing export')).toBeVisible();
    await page.waitForSelector('text=Export completed', { timeout: 15000 });
    
    // Should offer download
    await expect(page.locator('text=Download PDF')).toBeVisible();
    
    // Test publishing checklist
    await page.click('text=Publishing');
    await page.click('text=Pre-publication Checklist');
    
    // Should show checklist items
    await expect(page.locator('text=Spell check complete')).toBeVisible();
    await expect(page.locator('text=Grammar check complete')).toBeVisible();
    await expect(page.locator('text=Continuity verified')).toBeVisible();
    await expect(page.locator('text=Beta reader feedback')).toBeVisible();
    
    // Complete checklist items
    await page.click('input[type="checkbox"][data-check="spell-check"]');
    await page.click('input[type="checkbox"][data-check="grammar-check"]');
    await page.click('input[type="checkbox"][data-check="continuity-check"]');
    
    // Should show completion status
    await expect(page.locator('text=75% complete')).toBeVisible();
    
    // Test metadata preparation
    await page.click('text=Prepare Metadata');
    await page.fill('input[placeholder="ISBN"]', '978-1234567890');
    await page.fill('textarea[placeholder="Description"]', 'A thrilling mystery set in 1920s Chicago...');
    await page.fill('input[placeholder="Keywords"]', 'mystery, detective, 1920s, Chicago');
    
    // Save metadata
    await page.click('text=Save Metadata');
    
    // Should show metadata saved
    await expect(page.locator('text=Metadata saved')).toBeVisible();
  });

  test('advanced editing features workflow', async ({ page }) => {
    // Professional Writer mode
    await page.click('text=Professional Writer');
    
    // Open project
    await page.click('text=Open Project');
    await page.click('text=Draft Novel');
    
    // Test find and replace
    await page.click('text=Chapter 1');
    await page.click('text=Opening Scene');
    
    // Open find and replace
    await page.keyboard.press('Control+H');
    
    // Should show find and replace dialog
    await expect(page.locator('text=Find and Replace')).toBeVisible();
    
    // Test find and replace operation
    await page.fill('input[placeholder="Find"]', 'detective');
    await page.fill('input[placeholder="Replace"]', 'investigator');
    await page.click('text=Replace All');
    
    // Should show replacement count
    await expect(page.locator('text=5 replacements made')).toBeVisible();
    
    // Test word count and statistics
    await page.click('text=Statistics');
    
    // Should show detailed statistics
    await expect(page.locator('text=Word Count')).toBeVisible();
    await expect(page.locator('text=Character Count')).toBeVisible();
    await expect(page.locator('text=Reading Time')).toBeVisible();
    await expect(page.locator('text=Readability Score')).toBeVisible();
    
    // Test outline view
    await page.click('text=Outline View');
    
    // Should show structured outline
    await expect(page.locator('.outline-view')).toBeVisible();
    await expect(page.locator('text=Chapter 1')).toBeVisible();
    await expect(page.locator('text=Scene 1')).toBeVisible();
    
    // Test drag and drop reordering
    await page.dragAndDrop('text=Scene 2', 'text=Scene 1');
    
    // Should reorder scenes
    await expect(page.locator('.outline-view .scene-item:first-child')).toContainText('Scene 2');
    
    // Test style and formatting
    await page.click('text=Format');
    await page.click('text=Styles');
    
    // Should show style options
    await expect(page.locator('text=Heading 1')).toBeVisible();
    await expect(page.locator('text=Heading 2')).toBeVisible();
    await expect(page.locator('text=Normal')).toBeVisible();
    await expect(page.locator('text=Quote')).toBeVisible();
    
    // Apply style
    await page.click('.editor-content');
    await page.keyboard.press('Control+A');
    await page.click('text=Heading 1');
    
    // Should apply heading style
    await expect(page.locator('.editor-content h1')).toBeVisible();
    
    // Test distraction-free mode
    await page.click('text=View');
    await page.click('text=Distraction-Free Mode');
    
    // Should hide panels
    await expect(page.locator('.file-tree')).not.toBeVisible();
    await expect(page.locator('.right-panel')).not.toBeVisible();
    
    // Should show only editor
    await expect(page.locator('.editor-content')).toBeVisible();
    
    // Exit distraction-free mode
    await page.keyboard.press('Escape');
    
    // Should restore panels
    await expect(page.locator('.file-tree')).toBeVisible();
  });

  test('error handling and recovery workflow', async ({ page }) => {
    // AI-First mode for testing generation errors
    await page.click('text=AI-First');
    
    // Create project
    await page.click('text=New Project');
    await page.fill('input[placeholder="Project name"]', 'Error Test Project');
    await page.click('text=Create Project');
    
    // Add scene and try to generate
    await page.click('text=Add Scene');
    await page.fill('input[placeholder="Scene name"]', 'Test Scene');
    await page.click('text=Generate Scene');
    
    // Simulate API error
    await page.route('**/api/generate-scene', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service temporarily unavailable' })
      });
    });
    
    // Try generation
    await page.click('text=Generate');
    
    // Should show error message
    await expect(page.locator('text=Generation failed')).toBeVisible();
    await expect(page.locator('text=Service temporarily unavailable')).toBeVisible();
    
    // Should offer retry
    await expect(page.locator('text=Retry Generation')).toBeVisible();
    
    // Test retry mechanism
    await page.click('text=Retry Generation');
    
    // Should show retry attempt
    await expect(page.locator('text=Retrying generation')).toBeVisible();
    
    // Test offline handling
    await page.context().setOffline(true);
    
    // Try to perform action that requires network
    await page.click('text=Save to Cloud');
    
    // Should show offline message
    await expect(page.locator('text=Working offline')).toBeVisible();
    await expect(page.locator('text=Changes will sync when connection is restored')).toBeVisible();
    
    // Test auto-recovery when back online
    await page.context().setOffline(false);
    
    // Should auto-sync
    await page.waitForSelector('text=Connection restored', { timeout: 5000 });
    await page.waitForSelector('text=Syncing changes', { timeout: 5000 });
    await page.waitForSelector('text=Sync complete', { timeout: 10000 });
    
    // Test unsaved changes warning
    await page.click('text=Opening Scene');
    await page.fill('.editor-content', 'Unsaved changes that should trigger warning');
    
    // Try to navigate away
    await page.click('text=Chapter 2');
    
    // Should show unsaved changes warning
    await expect(page.locator('text=Unsaved changes')).toBeVisible();
    await expect(page.locator('text=Do you want to save before leaving?')).toBeVisible();
    
    // Save changes
    await page.click('text=Save and Continue');
    
    // Should navigate to new location
    await expect(page.locator('text=Chapter 2')).toBeVisible();
    
    // Test auto-save recovery
    await page.reload();
    
    // Should restore unsaved changes
    await expect(page.locator('text=Recovered unsaved changes')).toBeVisible();
    await expect(page.locator('.editor-content')).toContainText('Unsaved changes');
  });
});