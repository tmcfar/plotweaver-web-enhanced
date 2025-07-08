#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('📊 TypeScript Error Analysis\n');

try {
  // Run type check and capture output
  const output = execSync('npm run type-check', { encoding: 'utf8' });
} catch (error) {
  const output = error.stdout || error.output?.toString() || '';
  
  // Parse errors by type
  const errorTypes = {};
  const errorsByFile = {};
  
  const lines = output.split('\n');
  lines.forEach(line => {
    // Match TypeScript error codes
    const errorMatch = line.match(/error TS(\d+):/);
    if (errorMatch) {
      const errorCode = errorMatch[1];
      errorTypes[errorCode] = (errorTypes[errorCode] || 0) + 1;
    }
    
    // Match file paths
    const fileMatch = line.match(/^(src\/.*?\.tsx?):/);
    if (fileMatch) {
      const file = fileMatch[1];
      errorsByFile[file] = (errorsByFile[file] || 0) + 1;
    }
  });
  
  // Sort and display results
  console.log('Top Error Types:');
  console.log('================');
  const sortedErrors = Object.entries(errorTypes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
    
  const errorDescriptions = {
    '2307': 'Cannot find module',
    '2339': 'Property does not exist',
    '2345': 'Argument type mismatch',
    '2322': 'Type not assignable',
    '7006': 'Parameter implicitly has any type',
    '2305': 'Module has no exported member',
    '7031': 'Binding element implicitly has any type',
    '2741': 'Property missing in type',
    '2304': 'Cannot find name',
    '7053': 'Element implicitly has any type'
  };
  
  sortedErrors.forEach(([code, count]) => {
    const desc = errorDescriptions[code] || 'Unknown error';
    console.log(`  TS${code}: ${count} errors - ${desc}`);
  });
  
  console.log('\n\nFiles with Most Errors:');
  console.log('======================');
  const sortedFiles = Object.entries(errorsByFile)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
    
  sortedFiles.forEach(([file, count]) => {
    console.log(`  ${count} errors: ${file}`);
  });
  
  // Suggest fixes
  console.log('\n\n🔧 Quick Fix Suggestions:');
  console.log('========================');
  
  if (errorTypes['7006'] > 10) {
    console.log('\n1. Fix implicit any parameters:');
    console.log('   Add types to function parameters or use:');
    console.log('   // @ts-ignore above the function');
  }
  
  if (errorTypes['2307'] > 5) {
    console.log('\n2. Fix missing modules:');
    console.log('   npm install --save-dev @types/[module-name]');
    console.log('   Or add to tsconfig.json: "moduleResolution": "node"');
  }
  
  if (errorTypes['2339'] > 10) {
    console.log('\n3. Fix missing properties:');
    console.log('   - Add optional chaining: object?.property');
    console.log('   - Add type assertions: (object as Type).property');
    console.log('   - Define proper interfaces');
  }
}
