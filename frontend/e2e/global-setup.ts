import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');
  
  const { baseURL } = config.projects[0].use;
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the application to be ready
    console.log(`⏳ Waiting for application at ${baseURL} to be ready...`);
    await page.goto(baseURL || 'http://localhost:3000');
    
    // Wait for the main app to load
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 30000 });
    console.log('✅ Application is ready');
    
    // Perform any global setup tasks
    // - Seed test data
    // - Setup authentication state
    // - Initialize test environment
    
    // Example: Create test user session (if needed)
    const storageState = await page.context().storageState();
    
    // Save authentication state for reuse in tests
    await page.context().storageState({ path: 'e2e/auth-state.json' });
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;