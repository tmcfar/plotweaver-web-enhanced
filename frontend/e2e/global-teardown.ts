import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...');
  
  try {
    // Clean up test data
    console.log('🗑️ Cleaning up test data...');
    
    // Remove authentication state file
    const authStatePath = 'e2e/auth-state.json';
    if (fs.existsSync(authStatePath)) {
      fs.unlinkSync(authStatePath);
      console.log('✅ Removed authentication state file');
    }
    
    // Clean up any temporary test files
    const tempDir = 'e2e/temp';
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('✅ Removed temporary test files');
    }
    
    // Generate test summary report
    console.log('📊 Generating test summary...');
    const testResultsDir = 'test-results';
    if (fs.existsSync(testResultsDir)) {
      const files = fs.readdirSync(testResultsDir);
      const reportFiles = files.filter(file => file.endsWith('.json') || file.endsWith('.xml'));
      
      console.log(`📄 Test result files generated: ${reportFiles.length}`);
      reportFiles.forEach(file => {
        console.log(`   - ${file}`);
      });
    }
    
    // Performance metrics summary
    const perfResultsPath = path.join(testResultsDir, 'performance-results.json');
    if (fs.existsSync(perfResultsPath)) {
      try {
        const perfResults = JSON.parse(fs.readFileSync(perfResultsPath, 'utf8'));
        console.log('⚡ Performance summary:');
        console.log(`   - Total tests: ${perfResults.total || 0}`);
        console.log(`   - Passed: ${perfResults.passed || 0}`);
        console.log(`   - Failed: ${perfResults.failed || 0}`);
      } catch (error) {
        console.warn('⚠️ Could not parse performance results');
      }
    }
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown;