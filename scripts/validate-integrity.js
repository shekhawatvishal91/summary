#!/usr/bin/env node

/**
 * scripts/validate-integrity.js
 * Validates documentation completeness, relative markdown link resolution,
 * and scans for secrets/tokens across the repository.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(REPO_ROOT, 'docs');

const REQUIRED_DOCS = [
  '00_MASTER_DIRECTIVE.md',
  '01_SYSTEM_VISION.md',
  '02_AGENT_CONSTITUTION.md',
  '03_REPOSITORY_AUDIT.md',
  '04_TARGET_ARCHITECTURE.md',
  '05_SOURCE_INGESTION.md',
  '06_BOOK_DECODING.md',
  '07_YOUTUBE_DECODING.md',
  '08_KNOWLEDGE_MODEL.md',
  '09_PROVENANCE_AND_CITATIONS.md',
  '10_KNOWLEDGE_TREE_GOVERNANCE.md',
  '11_SYNTHESIS_AND_RETRIEVAL.md',
  '12_GITHUB_PUBLISHING.md',
  '13_TESTING_AND_QUALITY_ASSURANCE.md',
  '14_SKILLS_AND_TOOLING.md',
  '15_FAILURE_RECOVERY_AND_MAINTENANCE.md',
  '16_IMPLEMENTATION_ROADMAP.md',
  '17_CHANGELOG.md'
];

const SECRET_PATTERNS = [
  /github_pat_[a-zA-Z0-9_]{82}/i,
  /ghp_[a-zA-Z0-9]{36}/i,
  /AKIA[0-9A-Z]{16}/,
  /AIza[0-9A-Za-z\-_]{35}/
];

let errors = [];
let warnings = [];
let checkedLinks = 0;

console.log('====================================================');
console.log('AI KNOWLEDGE BRAIN OS: INTEGRITY & FIDELITY VALIDATOR');
console.log('====================================================\n');

// 1. Verify existence of all required documentation files
console.log('[1/4] Auditing Documentation System Completeness...');
REQUIRED_DOCS.forEach(doc => {
  const fullPath = path.join(DOCS_DIR, doc);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing required documentation file: docs/${doc}`);
  } else {
    const stats = fs.statSync(fullPath);
    if (stats.size < 500) {
      warnings.push(`File docs/${doc} is unexpectedly small (${stats.size} bytes)`);
    }
  }
});
console.log(` -> Verified ${REQUIRED_DOCS.length} authoritative documentation volumes.`);

// 2. Validate Relative Markdown Links
console.log('\n[2/4] Auditing Markdown Relative Links...');

function getMarkdownFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== '.git' && file !== 'node_modules') {
        results = results.concat(getMarkdownFiles(filePath));
      }
    } else if (file.endsWith('.md')) {
      results.push(filePath);
    }
  });
  return results;
}

const mdFiles = getMarkdownFiles(REPO_ROOT);
const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;

mdFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  // Strip fenced code blocks and backtick-wrapped markdown link syntax examples
  content = content.replace(/```[\s\S]*?```/g, '');
  content = content.replace(/`\[[^\]]+\]\([^)]+\)`/g, '');

  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const linkTarget = match[2].trim();
    // Ignore external URLs, mailto, and internal document hashes
    if (linkTarget.startsWith('http://') || 
        linkTarget.startsWith('https://') || 
        linkTarget.startsWith('mailto:') ||
        linkTarget.startsWith('#')) {
      continue;
    }

    checkedLinks++;
    // Strip query string and internal hash from target path
    const cleanTarget = linkTarget.split('#')[0].split('?')[0];
    if (!cleanTarget) continue; // Pure anchor in page

    const resolvedPath = path.resolve(path.dirname(file), cleanTarget);
    if (!fs.existsSync(resolvedPath)) {
      errors.push(`Broken Link in ${path.relative(REPO_ROOT, file)}: target "${linkTarget}" does not exist at ${resolvedPath}`);
    }
  }
});
console.log(` -> Audited ${checkedLinks} relative links across ${mdFiles.length} Markdown documents.`);

// 3. Scan for Secret and Token Leaks
console.log('\n[3/4] Scanning for Credential & Token Leaks...');
let scannedFiles = 0;

function scanDirectoryForSecrets(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === '.git' || file === 'node_modules') return;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      scanDirectoryForSecrets(filePath);
    } else {
      scannedFiles++;
      const content = fs.readFileSync(filePath, 'utf-8');
      SECRET_PATTERNS.forEach(pat => {
        if (pat.test(content)) {
          errors.push(`SECURITY VIOLATION: Credential pattern matched in ${path.relative(REPO_ROOT, filePath)}`);
        }
      });
    }
  });
}

scanDirectoryForSecrets(REPO_ROOT);
console.log(` -> Scanned ${scannedFiles} repository files for high-entropy tokens and secrets.`);

// 4. Constitution & Instruction Invariant Checks
console.log('\n[4/4] Verifying Constitutional Invariants...');
const constitutionPath = path.join(DOCS_DIR, '02_AGENT_CONSTITUTION.md');
if (fs.existsSync(constitutionPath)) {
  const constContent = fs.readFileSync(constitutionPath, 'utf-8');
  const requiredArticles = [
    'Article I: Source Fidelity',
    'Article II: Comprehensive Reconstruction',
    'Article III: Provenance & Traceability',
    'Article IV: Knowledge Integration',
    'Article V: Reliability',
    'Article VI: Security'
  ];
  requiredArticles.forEach(article => {
    if (!constContent.includes(article)) {
      errors.push(`Constitutional incompleteness: ${article} is missing from docs/02_AGENT_CONSTITUTION.md`);
    }
  });
  console.log(' -> Verified all 6 Constitutional Articles.');
}

// Summary Report
console.log('\n====================================================');
console.log('AUDIT SUMMARY');
console.log('====================================================');

if (warnings.length > 0) {
  console.log('\nWarnings:');
  warnings.forEach(w => console.log(` [WARN] ${w}`));
}

if (errors.length > 0) {
  console.error('\nVerification Errors:');
  errors.forEach(e => console.error(` [FAIL] ${e}`));
  console.error(`\nTOTAL ERRORS: ${errors.length}. Status: FAILED.`);
  process.exit(1);
} else {
  console.log('\nALL VERIFICATIONS PASSED.');
  console.log(`- Documentation Volumes: 18 / 18 Verified`);
  console.log(`- Relative Links: ${checkedLinks} / ${checkedLinks} Verified`);
  console.log(`- Credential Leaks: 0 Detected`);
  console.log(`- Final Status: VERIFIED (Exit Code 0)\n`);
  process.exit(0);
}
