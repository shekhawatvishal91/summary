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

console.log('====================================================');
console.log('AI KNOWLEDGE BRAIN OS: FULL REGRESSION TEST SUITE');
console.log('====================================================\n');

// Test Suite 1: Documentation & Link Integrity Validator
console.log('[SUITE 1/4] Running Documentation & Link Integrity Validator...');
try {
  const output = execSync(`node "${path.join(REPO_ROOT, 'scripts', 'validate-integrity.js')}"`, {
    cwd: REPO_ROOT,
    encoding: 'utf-8'
  });
  console.log(output);
  console.log('Suite 1: PASSED.\n');
} catch (err) {
  console.error('Suite 1 Failed:', err.stdout || err.message);
  process.exit(1);
}

// Test Suite 2: Pipeline & Knowledge Integration Acceptance Suite
console.log('[SUITE 2/4] Running Ingestion & Knowledge Graph Acceptance Suite...');
try {
  const output = execSync(`node "${path.join(REPO_ROOT, 'tests', 'test-pipeline.js')}"`, {
    cwd: REPO_ROOT,
    encoding: 'utf-8'
  });
  console.log(output);
  console.log('Suite 2: PASSED.\n');
} catch (err) {
  console.error('Suite 2 Failed:', err.stdout || err.message);
  process.exit(1);
}

// Test Suite 3: AI Decoding Engine Gold-Standard Acceptance Suite
console.log('[SUITE 3/4] Running AI Decoding Engine Gold-Standard Acceptance Suite...');
try {
  const output = execSync(`node "${path.join(REPO_ROOT, 'tests', 'test-ai-decoding.js')}"`, {
    cwd: REPO_ROOT,
    encoding: 'utf-8'
  });
  console.log(output);
  console.log('Suite 3: PASSED.\n');
} catch (err) {
  console.error('Suite 3 Failed:', err.stdout || err.message);
  process.exit(1);
}

// Test Suite 4: Native Agent Auditable Task Protocol Suite
console.log('[SUITE 4/5] Running Native Agent Task Protocol Acceptance Suite...');
try {
  const output = execSync(`node "${path.join(REPO_ROOT, 'tests', 'test-native-agent-protocol.js')}"`, {
    cwd: REPO_ROOT,
    encoding: 'utf-8'
  });
  console.log(output);
  console.log('Suite 4: PASSED.\n');
} catch (err) {
  console.error('Suite 4 Failed:', err.stdout || err.message);
  process.exit(1);
}

// Test Suite 5: Web UI Remediation & Provenance Integration Suite
console.log('[SUITE 5/6] Running Web UI & Provenance Remediation Suite...');
try {
  const output = execSync(`node "${path.join(REPO_ROOT, 'tests', 'test-web-ui-remediation.js')}"`, {
    cwd: REPO_ROOT,
    encoding: 'utf-8'
  });
  console.log(output);
  console.log('Suite 5: PASSED.\n');
} catch (err) {
  console.error('Suite 5 Failed:', err.stdout || err.message);
  process.exit(1);
}

// Test Suite 6: Repository Layout & Directory Baseline
console.log('[SUITE 6/6] Verifying Target Architecture Directory Baseline...');
const targetDirs = [
  'docs',
  'sources/raw',
  'sources/text',
  'sources/tasks',
  'knowledge/sources',
  'knowledge/tree/nodes',
  'knowledge/tree/edges',
  'knowledge/master',
  'web',
  'scripts',
  'tests/fixtures'
];

targetDirs.forEach(dir => {
  const p = path.join(REPO_ROOT, dir);
  assert.ok(fs.existsSync(p), `Directory ${dir} must exist`);
  assert.ok(fs.statSync(p).isDirectory(), `${dir} must be a directory`);
});
console.log('Suite 6: PASSED (All core directories verified).\n');

console.log('====================================================');
console.log('ALL 6 REGRESSION SUITES PASSED (100% SUCCESS)');
console.log('====================================================');
process.exit(0);
