#!/usr/bin/env node

/**
 * This script helps verify that tests actually fail when there are issues.
 * It temporarily introduces a breaking change to a test, runs the tests,
 * and verifies that they fail appropriately.
 *
 * This is useful for CI systems where you want to ensure tests will catch real problems.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// File paths
const headerTestPath = path.resolve('./tests/components/Header.test.ts');

// Create backup of the file
const backupContent = fs.readFileSync(headerTestPath, 'utf8');

try {
  console.log('🧪 Verifying test failures...');

  // Introduce a breaking change to the Header test
  console.log('🔄 Temporarily modifying a test to force failure...');
  const modifiedContent = backupContent.replace(
    `expect(wrapper.text()).toContain('Sign Up');`,
    `expect(wrapper.text()).toContain('This Should Fail');`
  );

  fs.writeFileSync(headerTestPath, modifiedContent);

  // Run tests and expect failure
  console.log('🔄 Running tests (expecting failure)...');
  const testResult = spawnSync('npm', ['test'], { encoding: 'utf8' });

  // Check if the tests failed as expected
  if (testResult.status !== 0) {
    console.log('✅ Verification successful: Tests failed when they should fail');
  } else {
    console.error('❌ Verification failed: Tests passed even with breaking changes');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error during verification:', error);
  process.exit(1);
} finally {
  // Restore the original file
  console.log('🔄 Restoring test file...');
  fs.writeFileSync(headerTestPath, backupContent);

  // Verify that tests pass again
  console.log('🔄 Running tests again (expecting success)...');
  const finalTestResult = spawnSync('npm', ['test'], { encoding: 'utf8' });

  if (finalTestResult.status === 0) {
    console.log('✅ All tests pass after restoration');
  } else {
    console.error('❌ Tests failed after restoration');
    process.exit(1);
  }
}

console.log('✅ Verification complete');
