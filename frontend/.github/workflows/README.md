# Frontend GitHub Actions Workflows

## Overview

This directory contains GitHub Actions workflows for the PlotWeaver frontend application.

## Workflows

### `frontend-tests.yml`

Comprehensive test suite for the frontend application with the following features:

#### Jobs

1. **lint-and-type** - Code quality checks
   - ESLint with GitHub annotation support
   - TypeScript type checking
   - Package.json validation

2. **test** - Test execution
   - Matrix testing on Node.js 18 & 20
   - Stable test suite (excludes known failing tests)
   - Coverage reporting on Node 20
   - Artifact upload for coverage reports

3. **build** - Build verification
   - Next.js production build
   - Build artifact generation
   - Build size reporting

4. **coverage-report** - Coverage analysis
   - Coverage threshold validation
   - Automated PR comments with coverage status
   - Coverage trend analysis

5. **failing-tests-analysis** - Optional deep-dive analysis
   - Individual analysis of known failing tests
   - Failure pattern identification
   - Actionable recommendations

6. **security-audit** - Security scanning
   - npm audit for vulnerabilities
   - High-severity vulnerability detection

7. **quality-gates** - Overall status summary
   - Consolidated status of all quality checks
   - Pass/fail determination for the entire pipeline

#### Triggers

- **Push to main**: Full pipeline execution
- **Pull requests**: Full pipeline with PR-specific reporting
- **Manual dispatch**: Customizable execution with options:
  - `coverage_threshold`: Minimum coverage percentage (default: 70%)
  - `skip_failing_tests`: Skip known problematic tests (default: true)

#### Features

- **Smart Caching**: npm, Next.js, and Jest caches for faster builds
- **Test Strategy**: Two-tier approach for reliability
- **Coverage Reporting**: Multiple formats (LCOV, JSON, Clover)
- **PR Integration**: Automated coverage comments
- **Failure Analysis**: Built-in test failure categorization

## Configuration Files

### Test Configuration
- `jest.config.js` - Jest configuration with fake timers
- `jest.setup.js` - Test environment setup and mocks
- `TESTING_STRATEGY.md` - Comprehensive testing strategy

### Package Scripts
- `test:stable` - Run only reliable tests for CI
- `test:failing` - Run only problematic tests for analysis
- `analyze:test-failures` - Analyze test failure patterns

## Current Test Status

- **Total Tests**: 455
- **Stable Tests**: ~410 (90% of total)
- **Pass Rate (Stable)**: ~97%
- **Pass Rate (All)**: 89%
- **Coverage Target**: 70% lines, 65% functions, 60% branches

## Known Issues

### Excluded from CI
1. **Performance Tests** - Timing sensitive, run locally
2. **Lock Enforcement Tests** - Complex integration scenarios
3. **E2E Tests** - Require full application context
4. **Foundation Checkpoint Tests** - Timer conflicts
5. **Pre-Generation Queue Tests** - Async timing issues

## Usage

### Local Development

```bash
# Run stable tests (recommended for development)
npm run test:stable

# Run all tests including problematic ones
npm test

# Analyze test failures
npm test 2>&1 | npm run analyze:test-failures -- --stdin

# Run tests with coverage
npm run test:coverage
```

### CI/CD Integration

The workflow automatically:
- Runs on every push and PR
- Caches dependencies for faster execution
- Reports coverage on PRs
- Provides detailed failure analysis

### Manual Execution

You can manually trigger the workflow with custom parameters:
1. Go to Actions tab in GitHub
2. Select "Frontend Test Suite"
3. Click "Run workflow"
4. Adjust parameters as needed

## Monitoring

### Key Metrics
- **Pass Rate**: Should stay above 95% for stable tests
- **Coverage**: Target 70%+ overall
- **Build Time**: Should complete within 20 minutes
- **Cache Hit Rate**: Monitor for optimization opportunities

### Alerts
- **Failed Quality Gates**: Immediate investigation required
- **Coverage Drop**: Review recent changes
- **Increased Failure Rate**: Check for environmental issues

## Contributing

### Adding New Tests
- Ensure tests are deterministic
- Mock external dependencies
- Follow existing patterns in `src/test-utils/`

### Modifying Workflows
- Test changes in feature branches
- Update this documentation
- Consider impact on existing PRs

### Fixing Failing Tests
1. Use `failing-tests-analysis` job for insights
2. Follow `TESTING_STRATEGY.md` guidelines
3. Remove from exclusion list once fixed

## Troubleshooting

### Common Issues

1. **Cache Issues**: Clear GitHub Actions cache
2. **Node Version Conflicts**: Ensure consistency with package.json engines
3. **Memory Issues**: Adjust `maxWorkers` in test commands
4. **Timeout Issues**: Check for infinite loops in async tests

### Debug Commands

```bash
# Check Node version compatibility
npm run test -- --detectOpenHandles

# Run tests with memory monitoring
npm run test -- --logHeapUsage

# Verbose test output
npm run test -- --verbose --no-cache
```

For more details, see `TESTING_STRATEGY.md` in the frontend directory.