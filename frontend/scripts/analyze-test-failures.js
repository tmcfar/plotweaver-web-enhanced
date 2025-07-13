#!/usr/bin/env node

/**
 * Test Failure Analysis Script
 * 
 * Analyzes Jest test output to categorize failures and provide actionable insights
 */

const fs = require('fs');
const path = require('path');

const KNOWN_FAILURE_PATTERNS = {
  'fake-timers': {
    pattern: /fake timers|advance.*timers|waitFor.*timers/i,
    category: 'Timer Issues',
    description: 'Tests failing due to fake timer configuration conflicts',
    solution: 'Configure Jest fakeTimers globally or use jest.useFakeTimers() in tests'
  },
  'async-timeout': {
    pattern: /timeout|exceeded.*timeout|async.*timeout/i,
    category: 'Async Timeouts',
    description: 'Tests timing out on async operations',
    solution: 'Increase timeout or improve async test patterns'
  },
  'environment-setup': {
    pattern: /not defined|is not a function|Cannot read.*undefined/i,
    category: 'Environment Setup',
    description: 'Missing mocks or environment configuration',
    solution: 'Review jest.setup.js and component mocks'
  },
  'integration-deps': {
    pattern: /network|fetch|websocket|connection/i,
    category: 'Integration Dependencies',
    description: 'Tests requiring external connections or services',
    solution: 'Mock external dependencies or move to integration test suite'
  }
};

function analyzeTestOutput(outputText) {
  const lines = outputText.split('\n');
  const failures = [];
  let currentTest = null;
  let currentError = [];
  let inErrorSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect test failure start
    if (line.includes('FAIL ') && line.includes('.test.')) {
      currentTest = line.replace('FAIL ', '').trim();
      currentError = [];
      inErrorSection = false;
    }
    
    // Detect error section
    if (line.includes('● ') || line.includes('Error:') || line.includes('expect(')) {
      inErrorSection = true;
    }
    
    if (inErrorSection && currentTest) {
      currentError.push(line);
    }
    
    // End of error section
    if (line.trim() === '' && inErrorSection && currentTest) {
      failures.push({
        testFile: currentTest,
        error: currentError.join('\n')
      });
      currentTest = null;
      currentError = [];
      inErrorSection = false;
    }
  }

  return failures;
}

function categorizeFailures(failures) {
  const categorized = {
    'Timer Issues': [],
    'Async Timeouts': [],
    'Environment Setup': [],
    'Integration Dependencies': [],
    'Other': []
  };

  failures.forEach(failure => {
    let category = 'Other';
    
    for (const [key, pattern] of Object.entries(KNOWN_FAILURE_PATTERNS)) {
      if (pattern.pattern.test(failure.error)) {
        category = pattern.category;
        break;
      }
    }
    
    categorized[category].push(failure);
  });

  return categorized;
}

function generateReport(categorizedFailures) {
  console.log('\n' + '='.repeat(60));
  console.log('         TEST FAILURE ANALYSIS REPORT');
  console.log('='.repeat(60));

  let totalFailures = 0;
  
  for (const [category, failures] of Object.entries(categorizedFailures)) {
    if (failures.length === 0) continue;
    
    totalFailures += failures.length;
    console.log(`\n📊 ${category}: ${failures.length} failure(s)`);
    console.log('-'.repeat(40));
    
    const pattern = Object.values(KNOWN_FAILURE_PATTERNS).find(p => p.category === category);
    if (pattern) {
      console.log(`💡 Solution: ${pattern.solution}\n`);
    }
    
    failures.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.testFile}`);
      // Show first few lines of error for context
      const errorLines = failure.error.split('\n').slice(0, 3);
      errorLines.forEach(line => {
        if (line.trim()) {
          console.log(`   ${line.trim()}`);
        }
      });
      console.log('');
    });
  }

  console.log(`\n📈 SUMMARY:`);
  console.log(`Total Failures Analyzed: ${totalFailures}`);
  console.log(`Categories Found: ${Object.keys(categorizedFailures).filter(k => categorizedFailures[k].length > 0).length}`);
  
  console.log(`\n🎯 RECOMMENDED ACTIONS:`);
  console.log(`1. Focus on Timer Issues first (usually easiest to fix)`);
  console.log(`2. Review Environment Setup for missing mocks`);
  console.log(`3. Consider moving Integration Dependencies to separate test suite`);
  console.log(`4. Set longer timeouts for Async operations in CI`);
  
  console.log(`\n📝 For detailed solutions, see: frontend/TESTING_STRATEGY.md`);
  console.log('='.repeat(60));
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node analyze-test-failures.js <test-output-file>');
    console.log('   or: npm test 2>&1 | node analyze-test-failures.js --stdin');
    process.exit(1);
  }

  let outputText = '';
  
  if (args[0] === '--stdin') {
    // Read from stdin
    process.stdin.setEncoding('utf8');
    process.stdin.on('readable', () => {
      let chunk;
      while (null !== (chunk = process.stdin.read())) {
        outputText += chunk;
      }
    });
    
    process.stdin.on('end', () => {
      const failures = analyzeTestOutput(outputText);
      const categorized = categorizeFailures(failures);
      generateReport(categorized);
    });
  } else {
    // Read from file
    const filename = args[0];
    if (!fs.existsSync(filename)) {
      console.error(`Error: File ${filename} not found`);
      process.exit(1);
    }
    
    outputText = fs.readFileSync(filename, 'utf8');
    const failures = analyzeTestOutput(outputText);
    const categorized = categorizeFailures(failures);
    generateReport(categorized);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzeTestOutput,
  categorizeFailures,
  generateReport
};