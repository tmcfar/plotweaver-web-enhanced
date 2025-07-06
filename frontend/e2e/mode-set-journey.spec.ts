import { test, expect } from '@playwright/test';

test.describe('Mode-Set User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test('complete AI-First mode user journey', async ({ page }) => {
    // Initial mode selection
    await page.click('text=AI-First');
    
    // Verify mode selection
    await expect(page.locator('[data-testid="mode-indicator"]')).toContainText('AI-First');
    
    // Should show AI-First specific UI elements
    await expect(page.locator('[data-testid="ai-assistant"]')).toBeVisible();
    await expect(page.locator('[data-testid="pre-generation-panel"]')).toBeVisible();
    
    // Should hide elements not relevant to AI-First mode
    await expect(page.locator('[data-testid="git-panel"]')).not.toBeVisible();
    
    // Create project with AI assistance
    await page.click('text=Create with AI');
    
    // Fill in project details
    await page.fill('textarea[placeholder="Describe your story..."]', 'A mystery novel about a detective in 1920s Chicago investigating a series of murders in jazz clubs');
    await page.click('text=Generate Story');
    
    // Wait for AI to generate initial story structure
    await page.waitForSelector('text=Story generated successfully', { timeout: 30000 });
    
    // Verify AI-First features are visible
    await expect(page.locator('.pre-generated-scenes')).toBeVisible();
    await expect(page.locator('.ai-suggestions')).toBeVisible();
    
    // Check that pre-generated scenes are available
    await expect(page.locator('text=Upcoming Scenes')).toBeVisible();
    await expect(page.locator('.scene-preview')).toHaveCount(3); // Should have 3 pre-generated scenes
    
    // Use a pre-generated scene
    await page.click('.scene-preview:first-child .use-scene-button');
    
    // Verify scene is added to the project
    await expect(page.locator('.editor-content')).toContainText('The jazz club');
    
    // Test AI suggestions
    await page.click('text=Get AI Suggestion');
    await page.waitForSelector('.ai-suggestion-dialog');
    
    // Apply AI suggestion
    await page.click('text=Apply Suggestion');
    
    // Verify content was updated
    await expect(page.locator('.editor-content')).toContainText('improved');
    
    // Test auto-save functionality (AI-First mode feature)
    await page.fill('.editor-content', 'Modified content that should auto-save');
    
    // Wait for auto-save indicator
    await page.waitForSelector('text=Auto-saved', { timeout: 5000 });
    
    // Lock foundation when ready
    await page.click('text=Lock Foundation');
    await page.click('text=Lock Characters');
    
    // Verify lock indicators appear
    await expect(page.locator('.lock-indicator')).toContainText('🔒');
    await expect(page.locator('[data-testid="character-lock"]')).toBeVisible();
    
    // Test continuity checking
    await page.fill('.editor-content', 'Elena wore a blue coat instead of her usual red one');
    
    // Wait for continuity check
    await page.waitForSelector('text=Continuity Issue Detected', { timeout: 10000 });
    
    // Fix continuity issue
    await page.click('text=Fix Continuity');
    await page.click('text=Change to red coat');
    
    // Verify fix was applied
    await expect(page.locator('.editor-content')).toContainText('red coat');
  });

  test('professional writer mode workflow', async ({ page }) => {
    // Select Professional Writer mode
    await page.click('text=Professional Writer');
    
    // Verify mode-specific UI
    await expect(page.locator('[data-testid="mode-indicator"]')).toContainText('Professional Writer');
    await expect(page.locator('[data-testid="git-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="manual-save-button"]')).toBeVisible();
    
    // Create new project
    await page.click('text=New Project');
    await page.fill('input[placeholder="Project name"]', 'Professional Novel');
    await page.click('text=Create Project');
    
    // Navigate to project structure
    await page.click('text=Add Chapter');
    await page.fill('input[placeholder="Chapter name"]', 'Chapter 1');
    await page.click('text=Add Scene');
    await page.fill('input[placeholder="Scene name"]', 'Opening Scene');
    
    // Write content
    await page.fill('.editor-content', 'The detective walked through the foggy streets of Chicago, his coat collar turned up against the cold wind.');
    
    // Test manual save
    await page.click('[data-testid="manual-save-button"]');
    await expect(page.locator('text=Saved successfully')).toBeVisible();
    
    // Test git operations
    await page.click('[data-testid="git-panel"] .git-status-button');
    await expect(page.locator('text=1 file changed')).toBeVisible();
    
    // Commit changes
    await page.click('text=Commit Changes');
    await page.fill('textarea[placeholder="Commit message"]', 'Add opening scene');
    await page.click('text=Commit');
    
    // Verify commit success
    await expect(page.locator('text=Committed successfully')).toBeVisible();
    
    // Test advanced features
    await page.click('text=Track Changes');
    await expect(page.locator('.track-changes-panel')).toBeVisible();
    
    // Test export functionality
    await page.click('text=Export');
    await page.click('text=Export to PDF');
    
    // Wait for export to complete
    await page.waitForSelector('text=Export completed', { timeout: 10000 });
  });

  test('editor mode collaborative workflow', async ({ page }) => {
    // Select Editor mode
    await page.click('text=Editor');
    
    // Verify read-only mode
    await expect(page.locator('[data-testid="mode-indicator"]')).toContainText('Editor');
    await expect(page.locator('[data-testid="read-only-indicator"]')).toBeVisible();
    
    // Open existing project
    await page.click('text=Open Project');
    await page.click('text=Sample Project');
    
    // Verify content is read-only
    const editor = page.locator('.editor-content');
    await expect(editor).toHaveAttribute('contenteditable', 'false');
    
    // Test annotation features
    await page.click('text=Add Annotation');
    await page.fill('textarea[placeholder="Add your comment..."]', 'This character needs more development');
    await page.click('text=Save Annotation');
    
    // Verify annotation appears
    await expect(page.locator('.annotation-marker')).toBeVisible();
    
    // Test commenting
    await page.click('.annotation-marker');
    await page.click('text=Reply');
    await page.fill('textarea[placeholder="Reply to comment..."]', 'I agree, we should expand on their backstory');
    await page.click('text=Post Reply');
    
    // Verify comment thread
    await expect(page.locator('.comment-thread')).toContainText('I agree, we should expand');
    
    // Test suggestion mode
    await page.click('text=Suggest Changes');
    await page.fill('textarea[placeholder="Suggest improvement..."]', 'Consider changing "walked" to "strode" for more impact');
    await page.click('text=Submit Suggestion');
    
    // Verify suggestion is recorded
    await expect(page.locator('.suggestion-indicator')).toBeVisible();
  });

  test('hobbyist mode simplified workflow', async ({ page }) => {
    // Select Hobbyist mode
    await page.click('text=Hobbyist');
    
    // Verify simplified UI
    await expect(page.locator('[data-testid="mode-indicator"]')).toContainText('Hobbyist');
    await expect(page.locator('[data-testid="simplified-toolbar"]')).toBeVisible();
    
    // Should hide advanced features
    await expect(page.locator('[data-testid="git-panel"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="advanced-settings"]')).not.toBeVisible();
    
    // Create project with template
    await page.click('text=Start with Template');
    await page.click('text=Mystery Novel Template');
    
    // Verify template is loaded
    await expect(page.locator('.template-structure')).toBeVisible();
    await expect(page.locator('text=Chapter 1 - The Discovery')).toBeVisible();
    
    // Test auto-save (hobbyist feature)
    await page.fill('.editor-content', 'My first mystery novel begins on a dark and stormy night...');
    
    // Wait for auto-save
    await page.waitForSelector('text=Auto-saved', { timeout: 5000 });
    
    // Test achievement system
    await page.waitForSelector('[data-testid="achievement-notification"]', { timeout: 10000 });
    await expect(page.locator('text=First Words!')).toBeVisible();
    
    // Test goal tracking
    await page.click('text=Set Writing Goal');
    await page.fill('input[placeholder="Words per day"]', '500');
    await page.click('text=Set Goal');
    
    // Verify goal is set
    await expect(page.locator('.goal-progress')).toBeVisible();
    await expect(page.locator('text=500 words')).toBeVisible();
    
    // Test templates and prompts
    await page.click('text=Get Writing Prompt');
    await expect(page.locator('.writing-prompt')).toBeVisible();
    await expect(page.locator('.writing-prompt')).toContainText('character');
    
    // Use writing prompt
    await page.click('text=Use This Prompt');
    
    // Verify prompt is inserted
    await expect(page.locator('.editor-content')).toContainText('character');
  });

  test('mode switching preserves work', async ({ page }) => {
    // Start in Professional Writer mode
    await page.click('text=Professional Writer');
    
    // Create some content
    await page.click('text=New Project');
    await page.fill('input[placeholder="Project name"]', 'Mode Switch Test');
    await page.click('text=Create Project');
    
    const testContent = 'This content should be preserved across mode switches.';
    await page.fill('.editor-content', testContent);
    
    // Switch to AI-First mode
    await page.click('[data-testid="mode-selector"]');
    await page.click('text=AI-First');
    
    // Verify content is preserved
    await expect(page.locator('.editor-content')).toContainText(testContent);
    
    // Switch to Editor mode
    await page.click('[data-testid="mode-selector"]');
    await page.click('text=Editor');
    
    // Content should still be there
    await expect(page.locator('.editor-content')).toContainText(testContent);
    
    // Switch to Hobbyist mode
    await page.click('[data-testid="mode-selector"]');
    await page.click('text=Hobbyist');
    
    // Content should still be preserved
    await expect(page.locator('.editor-content')).toContainText(testContent);
    
    // Switch back to Professional Writer
    await page.click('[data-testid="mode-selector"]');
    await page.click('text=Professional Writer');
    
    // All content should be intact
    await expect(page.locator('.editor-content')).toContainText(testContent);
  });

  test('mode-specific feature availability', async ({ page }) => {
    // Test Professional Writer features
    await page.click('text=Professional Writer');
    
    await expect(page.locator('[data-testid="git-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="manual-save-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="track-changes"]')).toBeVisible();
    
    // Test AI-First features
    await page.click('[data-testid="mode-selector"]');
    await page.click('text=AI-First');
    
    await expect(page.locator('[data-testid="ai-assistant"]')).toBeVisible();
    await expect(page.locator('[data-testid="pre-generation-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="auto-save-indicator"]')).toBeVisible();
    
    // Git panel should be hidden
    await expect(page.locator('[data-testid="git-panel"]')).not.toBeVisible();
    
    // Test Editor features
    await page.click('[data-testid="mode-selector"]');
    await page.click('text=Editor');
    
    await expect(page.locator('[data-testid="annotation-tools"]')).toBeVisible();
    await expect(page.locator('[data-testid="comment-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="read-only-indicator"]')).toBeVisible();
    
    // Test Hobbyist features
    await page.click('[data-testid="mode-selector"]');
    await page.click('text=Hobbyist');
    
    await expect(page.locator('[data-testid="template-library"]')).toBeVisible();
    await expect(page.locator('[data-testid="achievement-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="goal-tracker"]')).toBeVisible();
    
    // Advanced features should be hidden
    await expect(page.locator('[data-testid="advanced-settings"]')).not.toBeVisible();
  });
});