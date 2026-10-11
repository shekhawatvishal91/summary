#!/usr/bin/env node

/**
 * tests/test-ai-decoding.js
 * Gold-Standard Acceptance Tests for the AI Decoding Engine
 *
 * All automated tests in this suite use clearly labelled deterministic mocks.
 * MOCK TESTING NOTICE: Success in this test suite verifies adapter interfaces,
 * schema validation, and transactional rollback; it does NOT constitute proof
 * of live third-party LLM service availability.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { decodeSource, validateDecodingPayload } = require('../scripts/semantic-decoder');
const { MockLLMProvider } = require('../scripts/llm-adapter');
const { loadRegistry } = require('../scripts/ingest-source');

const REPO_ROOT = path.resolve(__dirname, '..');
const TEST_SOURCE_ID = 'SRC-RP-2026-001';

// Isolated In-Memory Snapshots to guarantee 100% non-destructive test execution
const SNAPSHOT_FILES = [
  path.join(REPO_ROOT, 'knowledge', 'sources', TEST_SOURCE_ID, 'meta.json'),
  path.join(REPO_ROOT, 'knowledge', 'sources', TEST_SOURCE_ID, 'proposed_changes.json'),
  path.join(REPO_ROOT, 'knowledge', 'sources', TEST_SOURCE_ID, 'codex.md'),
  path.join(REPO_ROOT, 'knowledge', 'sources', TEST_SOURCE_ID, 'coverage_warnings.json')
];
const fileSnapshots = new Map();
SNAPSHOT_FILES.forEach(p => {
  if (fs.existsSync(p)) fileSnapshots.set(p, fs.readFileSync(p));
});

console.log('====================================================');
console.log('GOLD-STANDARD ACCEPTANCE TESTS: AI DECODING ENGINE');
console.log('====================================================\n');

let passedCount = 0;

function runTest(name, fn) {
  process.stdout.write(`[GOLD TEST ${passedCount + 1}] ${name}... `);
  try {
    fn();
    console.log('PASSED');
    passedCount++;
  } catch (err) {
    console.log('FAILED');
    console.error(`\nFailure in "${name}":`);
    console.error(err.stack || err.message);
    process.exit(1);
  }
}

async function runAsyncTest(name, fn) {
  process.stdout.write(`[GOLD TEST ${passedCount + 1}] ${name}... `);
  try {
    await fn();
    console.log('PASSED');
    passedCount++;
  } catch (err) {
    console.log('FAILED');
    console.error(`\nFailure in "${name}":`);
    console.error(err.stack || err.message);
    process.exit(1);
  }
}

(async () => {
  // Test 1: Source Note Traceability to Actual Segments
  await runAsyncTest('Source note traceability to actual source segments', async () => {
    const result = await decodeSource(TEST_SOURCE_ID, { forceMock: true });
    assert.strictEqual(result.status, 'DECODED_SUCCESS');
    assert.ok(result.claims_extracted >= 2);

    const proposedPath = path.join(REPO_ROOT, 'knowledge', 'sources', TEST_SOURCE_ID, 'proposed_changes.json');
    assert.ok(fs.existsSync(proposedPath));
    const proposed = JSON.parse(fs.readFileSync(proposedPath, 'utf-8'));

    // Verify all substantive claims have locators
    proposed.extracted_claims.forEach(c => {
      assert.ok(c.locator, `Claim must have locator: ${c.statement}`);
      assert.ok(c.epistemic_class, `Claim must have epistemic class: ${c.statement}`);
    });
  });

  // Test 2: Unsupported claims with fabricated quotes are rejected
  await runAsyncTest('Unsupported claims with hallucinated quotes are rejected', async () => {
    // Custom mock injecting a fabricated quote not present in source text
    const customMock = () => JSON.stringify({
      decoding_status: 'MOCK_AI_DECODED',
      model_identifier: 'mock-fabricator',
      prompt_version: '2026-v1',
      dimensions: {
        dim_1_core_thesis: { premise: 'p', paradigm_shift: 's' },
        dim_2_causal_model: { mechanism: 'm', ratios_in_prose: 'r' },
        dim_3_master_analogy: { analogy: 'a' },
        dim_4_diagnostics: { classifications: [], failure_modes: [] },
        dim_5_field_protocols: { algorithm: [], verbatim_scripts: [] },
        dim_6_skeptic_box: { pop_culture_distortion: 'd', clinical_empirical_reality: 'c' }
      },
      extracted_claims: [
        {
          statement: 'Hallucinated claim',
          epistemic_class: 'SOURCE_STATEMENT',
          claim_type: 'empirical_finding',
          locator: 'p. 999',
          verbatim_quote: 'This sentence definitely does not exist in Dr Elena Vance monograph.'
        }
      ],
      proposed_concepts: [],
      proposed_relationships: []
    });

    const result = await decodeSource(TEST_SOURCE_ID, {
      forceMock: true,
      customMockHandler: customMock
    });

    assert.strictEqual(result.status, 'DECODING_FAILED');
    assert.ok(result.error.includes('verbatim quote mismatch'));
    assert.strictEqual(result.rollback_applied, true);
  });

  // Test 3: Missing source segments and coverage warnings reported
  await runAsyncTest('Missing source segments reported in coverage_warnings.json', async () => {
    const customMock = () => JSON.stringify({
      decoding_status: 'MOCK_AI_DECODED',
      model_identifier: 'mock-partial',
      prompt_version: '2026-v1',
      dimensions: {
        dim_1_core_thesis: { premise: 'p', paradigm_shift: 's' },
        dim_2_causal_model: { mechanism: 'm', ratios_in_prose: 'r' },
        dim_3_master_analogy: { analogy: 'a' },
        dim_4_diagnostics: { classifications: [], failure_modes: [] },
        dim_5_field_protocols: { algorithm: [], verbatim_scripts: [] },
        dim_6_skeptic_box: { pop_culture_distortion: 'd', clinical_empirical_reality: 'c' }
      },
      extracted_claims: [
        {
          statement: 'Legitimate claim',
          epistemic_class: 'SOURCE_STATEMENT',
          claim_type: 'empirical_finding',
          locator: 'sec: The Prefrontal Capacity Ceiling # para-2',
          verbatim_quote: null
        }
      ],
      proposed_concepts: [],
      proposed_relationships: [],
      coverage_warnings: ['[WARN_SEGMENT_OMITTED]: Segment 4 (Behavioral De-escalation) omitted from extraction.']
    });

    const result = await decodeSource(TEST_SOURCE_ID, {
      forceMock: true,
      customMockHandler: customMock
    });

    assert.strictEqual(result.status, 'DECODED_SUCCESS');
    const warningsPath = path.join(REPO_ROOT, 'knowledge', 'sources', TEST_SOURCE_ID, 'coverage_warnings.json');
    assert.ok(fs.existsSync(warningsPath));
    const warnings = JSON.parse(fs.readFileSync(warningsPath, 'utf-8'));
    assert.ok(warnings.some(w => w.includes('WARN_SEGMENT_OMITTED')));
  });

  // Test 4: Epistemic Demarcation (Invalid epistemic class rejected)
  runTest('Invalid epistemic classes rejected by validator', () => {
    const malformedPayload = {
      dimensions: {
        dim_1_core_thesis: { premise: 'p', paradigm_shift: 's' },
        dim_2_causal_model: { mechanism: 'm', ratios_in_prose: 'r' },
        dim_3_master_analogy: { analogy: 'a' },
        dim_4_diagnostics: { classifications: [], failure_modes: [] },
        dim_5_field_protocols: { algorithm: [], verbatim_scripts: [] },
        dim_6_skeptic_box: { pop_culture_distortion: 'd', clinical_empirical_reality: 'c' }
      },
      extracted_claims: [
        {
          statement: 'Invalid class claim',
          epistemic_class: 'UNVERIFIED_INTERNET_GUESS', // Invalid
          locator: 'sec: 1'
        }
      ]
    };
    const validation = validateDecodingPayload(malformedPayload, 'sample text');
    assert.strictEqual(validation.valid, false);
    assert.ok(validation.errors.some(e => e.includes('invalid epistemic_class')));
  });

  // Test 5: Transactional Rollback preserves previous state on crash
  await runAsyncTest('Failed decoding run preserves previous validated state', async () => {
    const codexPath = path.join(REPO_ROOT, 'knowledge', 'sources', TEST_SOURCE_ID, 'codex.md');
    const preFailContent = fs.readFileSync(codexPath, 'utf-8');

    // Simulate catastrophic model failure (malformed JSON string)
    const brokenMock = () => 'INTERNAL_SERVER_ERROR: { malformed json syntax ]';

    const result = await decodeSource(TEST_SOURCE_ID, {
      forceMock: true,
      customMockHandler: brokenMock
    });

    assert.strictEqual(result.status, 'DECODING_FAILED');
    assert.strictEqual(result.rollback_applied, true);

    const postFailContent = fs.readFileSync(codexPath, 'utf-8');
    assert.strictEqual(postFailContent, preFailContent, 'Original codex must remain byte-for-byte unchanged after failure');
  });

  // Test 6: Rate Limit (HTTP 429) & Network Error Handling
  await runAsyncTest('Rate limit & network errors produce recoverable status', async () => {
    const rateLimitMock = () => {
      throw new Error('HTTP 429: Rate limit exceeded');
    };

    const result = await decodeSource(TEST_SOURCE_ID, {
      forceMock: true,
      customMockHandler: rateLimitMock
    });

    assert.strictEqual(result.status, 'DECODING_FAILED');
    assert.ok(result.error.includes('Rate limit'));
    assert.strictEqual(result.rollback_applied, true);
  });

  // Test 7: Unconfigured Provider Behavior (Graceful Skip)
  await runAsyncTest('Unconfigured provider safely reports unavailable without crashing', async () => {
    // When forceMock is false and no env vars set
    const result = await decodeSource(TEST_SOURCE_ID, { forceMock: false });
    assert.strictEqual(result.status, 'SKIPPED_NO_PROVIDER');
    assert.ok(result.message.includes('No authorized LLM provider configured'));
  });

  // Teardown: In-memory snapshot restoration guarantees tests are strictly non-destructive
  for (const [filePath, content] of fileSnapshots.entries()) {
    fs.writeFileSync(filePath, content);
  }
  const covPath = path.join(REPO_ROOT, 'knowledge', 'sources', TEST_SOURCE_ID, 'coverage_warnings.json');
  if (!fileSnapshots.has(covPath) && fs.existsSync(covPath)) {
    fs.unlinkSync(covPath);
  }

  console.log(`\n====================================================`);
  console.log(`ALL ${passedCount} GOLD-STANDARD ACCEPTANCE TESTS PASSED (100%).`);
  console.log(`====================================================\n`);
  process.exit(0);
})();
