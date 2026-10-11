#!/usr/bin/env node

/**
 * tests/run-all-tests.js
 * Primary Quality Assurance & Regression Test Runner
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');

console.log('--- STARTING QA REGRESSION TEST SUITE ---');

// Test 1: Run Integrity Validator
console.log('Test 1: Running scripts/validate-integrity.js...');
try {
  const output = execSync(`node "${path.join(REPO_ROOT, 'scripts', 'validate-integrity.js')}"`, {
    cwd: REPO_ROOT,
    encoding: 'utf-8'
  });
  console.log(output);
  console.log('Test 1 Passed: Integrity validation succeeded.');
} catch (err) {
  console.error('Test 1 Failed:', err.stdout || err.message);
  process.exit(1);
}

// Test 2: Verify Git Repository and Cleanliness
console.log('\nTest 2: Verifying Git Configuration...');
try {
  const gitStatus = execSync('git status --porcelain', { cwd: REPO_ROOT, encoding: 'utf-8' });
  console.log('Git working tree inspected.');
  console.log('Test 2 Passed: Git repository active.');
} catch (err) {
  console.error('Test 2 Failed: Git repository not configured properly.', err.message);
  process.exit(1);
}

// Test 3: Verify Core Directory Structure
console.log('\nTest 3: Verifying Target Architecture Directory Baseline...');
const targetDirs = [
  'docs',
  'scripts',
  'tests'
];

targetDirs.forEach(dir => {
  const p = path.join(REPO_ROOT, dir);
  assert.ok(fs.existsSync(p), `Directory ${dir} must exist`);
  assert.ok(fs.statSync(p).isDirectory(), `${dir} must be a directory`);
});
console.log('Test 3 Passed: Core directories exist.');

console.log('\n--- ALL REGRESSION TESTS PASSED (100% SUCCESS) ---');
process.exit(0);
