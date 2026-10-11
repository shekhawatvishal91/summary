#!/usr/bin/env node

/**
 * scripts/publish-check.js
 * Pre-commit / pre-push security and cleanliness guardrail.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');

const FORBIDDEN_PATTERNS = [
  { name: 'GitHub Fine-Grained PAT', regex: /github_pat_[a-zA-Z0-9_]{82}/ },
  { name: 'GitHub Classic Token', regex: /ghp_[a-zA-Z0-9]{36}/ },
  { name: 'Generic Secret Assignment', regex: /(secret|token|api_key|password)\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"]/i }
];

console.log('[Security Gate] Checking staged files for secrets and unvetted content...');

try {
  const stagedFiles = execSync('git diff --cached --name-only', { cwd: REPO_ROOT, encoding: 'utf-8' })
    .split('\n')
    .map(f => f.trim())
    .filter(Boolean);

  let violationFound = false;

  stagedFiles.forEach(relPath => {
    const fullPath = path.join(REPO_ROOT, relPath);
    if (!fs.existsSync(fullPath)) return;

    const content = fs.readFileSync(fullPath, 'utf-8');
    FORBIDDEN_PATTERNS.forEach(rule => {
      if (rule.regex.test(content)) {
        console.error(`[SECURITY ERROR] ${rule.name} matched in staged file: ${relPath}`);
        violationFound = true;
      }
    });
  });

  if (violationFound) {
    console.error('\nPublish Check FAILED: Secrets detected in staged changes.');
    process.exit(1);
  } else {
    console.log(`[Security Gate] Passed: ${stagedFiles.length} staged files checked. Zero credentials detected.`);
    process.exit(0);
  }
} catch (err) {
  console.error('[Security Gate] Error reading git status:', err.message);
  process.exit(1);
}
