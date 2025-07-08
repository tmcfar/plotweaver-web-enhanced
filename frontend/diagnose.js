#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 PlotWeaver Frontend Diagnostic Tool\n');

// Check for common issues
const checks = [
  {
    name: 'TypeScript Configuration',
    file: 'tsconfig.json',
    test: (content) => {
      const config = JSON.parse(content);
      return config.compilerOptions?.strict !== false;
    }
  },
  {
    name: 'Package Dependencies',
    file: 'package.json',
    test: (content) => {
      const pkg = JSON.parse(content);
      const required = ['react', 'react-dom', 'next', '@radix-ui/react-dialog'];
      return required.every(dep => 
        pkg.dependencies[dep] || pkg.devDependencies[dep]
      );
    }
  },
  {
    name: 'Environment Variables',
    file: '.env.local',
    test: (content) => {
      return content.includes('NEXT_PUBLIC_API_URL');
    }
  }
];

// Run checks
checks.forEach(check => {
  try {
    const content = fs.readFileSync(check.file, 'utf8');
    const passed = check.test(content);
    console.log(`${passed ? '✅' : '❌'} ${check.name}`);
  } catch (error) {
    console.log(`❌ ${check.name} - File not found or error`);
  }
});

// Check for problematic imports
console.log('\n🔍 Checking for problematic patterns...\n');

const problematicPatterns = [
  {
    pattern: /from ['"]@clerk\/nextjs['"]/,
    message: 'Clerk imports without conditional checks',
    fix: 'Use dynamic imports or conditional requires'
  },
  {
    pattern: /import \* as Sentry/,
    message: 'Sentry imports that might not be installed',
    fix: 'Use dynamic imports with try-catch'
  },
  {
    pattern: /useUser\(\)/,
    message: 'Direct useUser() calls without checks',
    fix: 'Add conditional checks for Clerk availability'
  }
];

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    problematicPatterns.forEach(({ pattern, message, fix }) => {
      if (pattern.test(content)) {
        issues.push({ message, fix });
      }
    });
    
    if (issues.length > 0) {
      console.log(`\n❌ ${path.relative('.', filePath)}`);
      issues.forEach(issue => {
        console.log(`   - ${issue.message}`);
        console.log(`     Fix: ${issue.fix}`);
      });
    }
  } catch (error) {
    // Ignore read errors
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      checkFile(fullPath);
    }
  });
}

// Check src and app directories
['src', 'app'].forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir);
  }
});

console.log('\n\n📋 Recommendations:\n');
console.log('1. Run: npm run type-check to find TypeScript errors');
console.log('2. Run: npm ls to check for missing dependencies');
console.log('3. Clear Next.js cache: rm -rf .next');
console.log('4. Reinstall dependencies: rm -rf node_modules && npm install');
console.log('5. Use the simplified layout to test: mv app/layout.tsx app/layout.backup.tsx && mv app/layout.simple.tsx app/layout.tsx');
