#!/bin/bash

# Frontend Quality Improvement Script
# Automatically fixes common ESLint issues

echo "🔧 Starting Frontend Quality Improvements..."

cd /home/tmcfar/dev/pw-web/frontend

echo "📦 Installing missing dependencies..."
npm install --save-dev @types/jest jest-environment-jsdom

echo "🧹 Running ESLint auto-fix for simple issues..."
npx eslint . --fix --ext .ts,.tsx --ignore-pattern node_modules --ignore-pattern dist --ignore-pattern build || true

echo "📝 Fixing package.json module type..."
# Add "type": "module" to package.json to fix ES module warnings
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.type = 'module';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

echo "🎯 Creating Jest configuration..."
cat > jest.config.js << 'EOF'
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
  ],
};
EOF

echo "🔧 Creating Jest setup file..."
cat > jest.setup.js << 'EOF'
import '@testing-library/jest-dom';
EOF

echo "✅ Frontend quality improvements complete!"
echo "📊 Re-run 'npm run lint' to see remaining issues"
