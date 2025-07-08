#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 PlotWeaver Frontend Auto-Fix Tool\n');

let fixCount = 0;

// Fix functions
const fixes = {
  addUseClient: (filePath, content) => {
    if (!content.startsWith("'use client'") && 
        (content.includes('useState') || 
         content.includes('useEffect') || 
         content.includes('useContext'))) {
      return "'use client';\n\n" + content;
    }
    return null;
  },
  
  fixClerkImports: (filePath, content) => {
    if (content.includes('@clerk/nextjs') && !content.includes('try {')) {
      return content.replace(
        /import\s+{\s*([^}]+)\s*}\s+from\s+['"]@clerk\/nextjs['"]/g,
        (match, imports) => {
          return `// ${match}\nconst { ${imports} } = (() => {\n  try {\n    return require('@clerk/nextjs');\n  } catch {\n    return { ${imports.split(',').map(i => `${i.trim()}: () => null`).join(', ')} };\n  }\n})()`;
        }
      );
    }
    return null;
  },
  
  fixSentryImports: (filePath, content) => {
    if (content.includes('import * as Sentry')) {
      return content.replace(
        /import \* as Sentry from ['"]@sentry\/nextjs['"]/g,
        "// Sentry import removed - use dynamic import if needed"
      ).replace(
        /Sentry\./g,
        "// Sentry."
      );
    }
    return null;
  }
};

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const [fixName, fixFn] of Object.entries(fixes)) {
      const fixed = fixFn(filePath, content);
      if (fixed !== null) {
        content = fixed;
        modified = true;
        console.log(`✅ Fixed ${fixName} in ${path.relative('.', filePath)}`);
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      fixCount++;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}: ${error.message}`);
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
      fixFile(fullPath);
    }
  });
}

// Run fixes
['src', 'app'].forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir);
  }
});

console.log(`\n✨ Fixed ${fixCount} files\n`);

// Additional recommendations
console.log('📋 Next steps:\n');
console.log('1. Clear Next.js cache: rm -rf .next');
console.log('2. Run: npm run dev');
console.log('3. If errors persist, try the minimal layout:');
console.log('   mv app/layout.tsx app/layout.backup.tsx');
console.log('   mv app/layout.simple.tsx app/layout.tsx');
