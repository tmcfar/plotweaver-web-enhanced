#!/bin/bash

# PlotWeaver Web Pre-commit Test Script
# Run this before committing to ensure code quality

set -e

echo "🧪 Running pre-commit checks for PlotWeaver Web..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Track overall status
OVERALL_STATUS=0

# Function to run a check and track status
run_check() {
    local check_name="$1"
    local check_command="$2"
    
    print_status "Running $check_name..."
    
    if eval "$check_command"; then
        print_success "$check_name passed"
        return 0
    else
        print_error "$check_name failed"
        OVERALL_STATUS=1
        return 1
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "bff" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

echo "🔍 Pre-commit Quality Checks"
echo "=============================="

# Frontend checks
echo
print_status "Frontend Checks"
print_status "==============="

# TypeScript compilation check
run_check "TypeScript compilation" "cd frontend && npm run type-check"

# ESLint check
run_check "ESLint" "cd frontend && npm run lint"

# Frontend tests
run_check "Frontend unit tests" "cd frontend && npm run test -- --watchAll=false"

# Frontend build check
run_check "Frontend build" "cd frontend && npm run build"

# Backend checks
echo
print_status "Backend Checks"
print_status "=============="

# Check if backend virtual environment exists
if [ ! -d "bff/venv" ]; then
    print_warning "Backend virtual environment not found. Creating it..."
    cd bff
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    deactivate
    cd ..
fi

# Backend import check
run_check "Backend imports" "cd bff && source venv/bin/activate && python -c 'import server.main; print(\"Backend imports successful\")' && deactivate"

# Backend syntax check (if we have any Python files to check)
if find bff -name "*.py" -type f | head -1 | grep -q ".py"; then
    run_check "Python syntax check" "cd bff && source venv/bin/activate && python -m py_compile \$(find . -name '*.py' -not -path './venv/*') && deactivate"
fi

# Git checks
echo
print_status "Git Checks"
print_status "=========="

# Check for uncommitted changes in critical files
if git diff --name-only | grep -E "(package\.json|requirements\.txt|\.env)" > /dev/null 2>&1; then
    print_warning "Uncommitted changes detected in configuration files"
fi

# Check for large files
LARGE_FILES=$(git diff --cached --name-only | xargs -I {} sh -c 'if [ -f "{}" ]; then echo "{}:$(wc -c < "{}")"; fi' | awk -F: '$2 > 1048576 {print $1}')
if [ -n "$LARGE_FILES" ]; then
    print_warning "Large files detected (>1MB):"
    echo "$LARGE_FILES"
fi

# Check for potential secrets
SECRET_PATTERNS="(password|secret|key|token|api_key)"
if git diff --cached | grep -i "$SECRET_PATTERNS" > /dev/null 2>&1; then
    print_warning "Potential secrets detected in staged changes. Please review."
fi

# Security checks
echo
print_status "Security Checks"
print_status "==============="

# Check for sensitive files
SENSITIVE_FILES=".env .env.local .env.production bff/.env"
for file in $SENSITIVE_FILES; do
    if git diff --cached --name-only | grep -q "$file"; then
        print_error "Sensitive file '$file' is staged for commit"
        OVERALL_STATUS=1
    fi
done

# Check for TODO/FIXME comments in staged files
if git diff --cached | grep -E "TODO|FIXME|XXX|HACK" > /dev/null 2>&1; then
    print_warning "TODO/FIXME comments found in staged changes"
fi

# Performance checks
echo
print_status "Performance Checks"
print_status "=================="

# Check bundle size (if build succeeded)
if [ -d "frontend/.next" ]; then
    BUNDLE_SIZE=$(du -sh frontend/.next 2>/dev/null | cut -f1)
    print_status "Frontend bundle size: $BUNDLE_SIZE"
fi

# Final summary
echo
echo "=============================="
if [ $OVERALL_STATUS -eq 0 ]; then
    print_success "🎉 All pre-commit checks passed!"
    echo
    echo "✅ Your code is ready to commit."
    echo "Run 'git commit' to proceed with your commit."
else
    print_error "❌ Some checks failed!"
    echo
    echo "Please fix the issues above before committing."
    echo "You can run individual checks with:"
    echo "  make lint      - Run linters"
    echo "  make test      - Run tests"
    echo "  make build     - Build the application"
fi

echo
echo "Pre-commit check summary:"
echo "  - TypeScript compilation"
echo "  - ESLint"
echo "  - Unit tests"
echo "  - Build verification"
echo "  - Backend imports"
echo "  - Security checks"
echo "  - Git hygiene"

exit $OVERALL_STATUS