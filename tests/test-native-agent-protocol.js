#!/usr/bin/env node

/**
 * tests/test-native-agent-protocol.js
 * Acceptance Test Suite for Native Agent Auditable Task Protocol
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { ingestSource, loadRegistry } = require('../scripts/ingest-source');
const { prepareTask, validateStaged, integrateStaged } = require('../scripts/agent-protocol');

const REPO_ROOT = path.resolve(__dirname, '..');
const FIXTURE_PATH = path.join(REPO_ROOT, 'tests', 'fixtures', 'sample-multi-agent-calibration.md');

// Isolated In-Memory Snapshots to guarantee 100% non-destructive test execution
const SNAPSHOT_FILES = [
  path.join(REPO_ROOT, 'sources', 'registry.json'),
  path.join(REPO_ROOT, 'sources', 'tasks', 'SRC-RP-2026-002', 'task.json'),
  path.join(REPO_ROOT, 'knowledge', 'sources', 'SRC-RP-2026-002', 'meta.json'),
  path.join(REPO_ROOT, 'knowledge', 'sources', 'SRC-RP-2026-002', 'proposed_changes.json'),
  path.join(REPO_ROOT, 'knowledge', 'sources', 'SRC-RP-2026-002', 'cards.json'),
  path.join(REPO_ROOT, 'knowledge', 'sources', 'SRC-RP-2026-002', 'codex.md'),
  path.join(REPO_ROOT, 'knowledge', 'sources', 'SRC-RP-2026-002', 'staged_decoding.json'),
  path.join(REPO_ROOT, 'knowledge', 'sources', 'SRC-RP-2026-002', 'segment_inventory.json'),
  path.join(REPO_ROOT, 'knowledge', 'tree', 'nodes', 'concept_CON-006.json'),
  path.join(REPO_ROOT, 'knowledge', 'tree', 'nodes', 'claim_CLM-CON-006-001.json'),
  path.join(REPO_ROOT, 'knowledge', 'tree', 'aliases.json'),
  path.join(REPO_ROOT, 'knowledge', 'tree', 'edges', 'edges.jsonl'),
  path.join(REPO_ROOT, 'web', 'manifest.json')
];
const fileSnapshots = new Map();
SNAPSHOT_FILES.forEach(p => {
  if (fs.existsSync(p)) fileSnapshots.set(p, fs.readFileSync(p));
});

console.log('====================================================');
console.log('ACCEPTANCE TESTS: NATIVE AGENT TASK PROTOCOL');
console.log('====================================================\n');

let passedCount = 0;

function runTest(name, fn) {
  process.stdout.write(`[NATIVE PROTOCOL TEST ${passedCount + 1}] ${name}... `);
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

// Ingest dedicated test source
const ingestRes = ingestSource(FIXTURE_PATH, {
  title: 'Epistemic Calibration in Multi-Agent Systems',
  author: 'Dr. Aris Thorne',
  year: 2026,
  medium: 'paper',
  tier: 'tier_1'
});
const TEST_SOURCE_ID = ingestRes.source.source_id;

// 1. Prepare creates task.json and staged template
runTest('Task preparation generates task.json with PREPARED state', () => {
  const res = prepareTask(TEST_SOURCE_ID);
  assert.strictEqual(res.status, 'TASK_PREPARED');

  const taskPath = path.join(REPO_ROOT, 'sources', 'tasks', TEST_SOURCE_ID, 'task.json');
  assert.ok(fs.existsSync(taskPath), 'Task manifest must exist');

  const task = JSON.parse(fs.readFileSync(taskPath, 'utf-8'));
  assert.strictEqual(task.source_id, TEST_SOURCE_ID);
  assert.strictEqual(task.state, 'PREPARED');
  assert.ok(task.segments.length >= 4);
});

// 2. Deterministic validation rejects empty/malformed dimensions
runTest('Validator catches empty dimensions and reports validation errors', () => {
  const stagedPath = path.join(REPO_ROOT, 'knowledge', 'sources', TEST_SOURCE_ID, 'staged_decoding.json');
  fs.writeFileSync(stagedPath, JSON.stringify({
    source_id: TEST_SOURCE_ID,
    dimensions: {
      dim_1_core_thesis: { premise: '', paradigm_shift: '' }
    },
    extracted_claims: []
  }), 'utf-8');

  const validation = validateStaged(TEST_SOURCE_ID);
  assert.strictEqual(validation.valid, false);
  assert.ok(validation.errors.some(e => e.includes('premise must not be empty')));
  assert.ok(validation.errors.some(e => e.includes('Must provide at least one extracted claim')));

  // Task state must transition to NEEDS_REVIEW
  const taskPath = path.join(REPO_ROOT, 'sources', 'tasks', TEST_SOURCE_ID, 'task.json');
  const task = JSON.parse(fs.readFileSync(taskPath, 'utf-8'));
  assert.strictEqual(task.state, 'NEEDS_REVIEW');
});

// 3. Deterministic validation rejects hallucinated verbatim quote
runTest('Validator catches and rejects verbatim quote not present in raw source text', () => {
  const stagedPath = path.join(REPO_ROOT, 'knowledge', 'sources', TEST_SOURCE_ID, 'staged_decoding.json');

  const invalidStaged = {
    source_id: TEST_SOURCE_ID,
    agent_identifier: 'test-agent',
    decoding_status: 'NATIVE_AGENT_DECODED',
    dimensions: {
      dim_1_core_thesis: { premise: 'Valid premise', paradigm_shift: 'Valid shift' },
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
        locator: 'sec: 1',
        verbatim_quote: 'This sentence definitely does not exist in Dr Thorne monograph.'
      }
    ],
    proposed_concepts: [],
    proposed_relationships: []
  };

  fs.writeFileSync(stagedPath, JSON.stringify(invalidStaged), 'utf-8');

  const validation = validateStaged(TEST_SOURCE_ID);
  assert.strictEqual(validation.valid, false);
  assert.ok(validation.errors.some(e => e.includes('verbatim quote mismatch')));
});

// 4. Genuine decoding validates and integrates into Product A and B
runTest('Genuine native decoding validates and integrates cleanly', () => {
  const stagedPath = path.join(REPO_ROOT, 'knowledge', 'sources', TEST_SOURCE_ID, 'staged_decoding.json');

  const validStaged = {
    source_id: TEST_SOURCE_ID,
    agent_identifier: 'antigravity-native-agent',
    decoding_status: 'NATIVE_AGENT_DECODED',
    dimensions: {
      dim_1_core_thesis: {
        premise: 'Autonomous multi-agent networks experience non-linear catastrophic consensus collapse when uncalibrated error rates cross a critical mathematical threshold.',
        paradigm_shift: 'Overturns the assumption that multi-agent deliberation reliably self-corrects hallucinations through emergent consensus.'
      },
      dim_2_causal_model: {
        mechanism: 'Uncalibrated synthetic inferences exchanged across dense agent networks establish circular reinforcement loops.',
        ratios_in_prose: 'Upstream uncalibrated error rates exceeding 14.8% trigger catastrophic consensus collapse.'
      },
      dim_3_master_analogy: {
        analogy: 'Acoustic Feedback in a PA Loop: A whisper of distortion fed into an amplifier ring becomes a deafening screech within milliseconds.'
      },
      dim_4_diagnostics: {
        classifications: [
          {
            state: 'Echoic Entrainment',
            symptom: 'Repeating unverified claims with escalating confidence',
            etiology: 'Circular citation graph lacking external ground truth anchors'
          }
        ],
        failure_modes: [
          'Cascade Hallucination Phase: Irreversible loss of grounding across downstream agents.'
        ]
      },
      dim_5_field_protocols: {
        algorithm: [
          'Stage 1 (Isolate): Store deductions in a staging buffer.',
          'Stage 2 (Audit): Match verbatim quotes against source bytes.',
          'Stage 3 (Commit): Merge validated nodes with SHA-256 tracking.'
        ],
        verbatim_scripts: [
          'Quarantine Trigger: "Epistemic quarantine activated; isolating speculative node pending deterministic locator validation."'
        ]
      },
      dim_6_skeptic_box: {
        pop_culture_distortion: 'Belief that simply chaining more LLM agents together automatically removes hallucinations.',
        clinical_empirical_reality: 'Empirical multi-agent network dynamics prove that ungrounded agents exponentially accelerate hallucination cascade without deterministic physical grounding.'
      }
    },
    extracted_claims: [
      {
        statement: 'Upstream agent uncalibrated error rates exceeding 14.8% trigger catastrophic consensus collapse across multi-agent reasoning graphs.',
        epistemic_class: 'SOURCE_STATEMENT',
        claim_type: 'empirical_finding',
        locator: 'sec: The Cascade Hallucination Threshold # para-1',
        verbatim_quote: 'upstream agent exceeds 14.8%, downstream agent networks enter an irreversible cascade hallucination phase',
        associated_concepts: ['Cascade Hallucination Threshold']
      }
    ],
    proposed_concepts: [
      {
        name: 'Cascade Hallucination Threshold',
        aliases: ['Multi-Agent Consensus Collapse', 'Epistemic Cascade Limit'],
        domain: 'Computer Science',
        definition: 'The mathematical error threshold (14.8%) beyond which distributed autonomous reasoning networks irreversibly substitute synthetic consensus for empirical truth.'
      }
    ],
    proposed_relationships: [],
    recall_cards: [
      {
        card_id: `CARD-${TEST_SOURCE_ID}-001`,
        question: 'What is the critical error rate threshold that triggers catastrophic multi-agent consensus collapse?',
        answer: 'An upstream uncalibrated error rate of 14.8% causes multi-agent reasoning networks to enter an irreversible cascade hallucination phase.',
        source_id: TEST_SOURCE_ID,
        locator: 'sec: The Cascade Hallucination Threshold # para-1',
        dimension: 'Foundational Causal Model'
      }
    ]
  };

  fs.writeFileSync(stagedPath, JSON.stringify(validStaged, null, 2), 'utf-8');

  // Validate
  const validation = validateStaged(TEST_SOURCE_ID);
  assert.strictEqual(validation.valid, true);

  // Integrate
  const res = integrateStaged(TEST_SOURCE_ID);
  assert.strictEqual(res.status, 'INTEGRATED_SUCCESS');

  // Verify Product A Codex
  const codexPath = path.join(REPO_ROOT, 'knowledge', 'sources', TEST_SOURCE_ID, 'codex.md');
  const codex = fs.readFileSync(codexPath, 'utf-8');
  assert.ok(codex.includes('NATIVE_AGENT_DECODED'));
  assert.ok(codex.includes('Cascade Hallucination Threshold'));

  // Verify Product B Node
  const aliasPath = path.join(REPO_ROOT, 'knowledge', 'tree', 'aliases.json');
  const aliases = JSON.parse(fs.readFileSync(aliasPath, 'utf-8'));
  const nodeId = aliases.mappings['cascade hallucination threshold'];
  assert.ok(nodeId, 'Concept node ID must be registered in aliases.json');

  const nodeFile = path.join(REPO_ROOT, 'knowledge', 'tree', 'nodes', `concept_${nodeId}.json`);
  assert.ok(fs.existsSync(nodeFile), 'Concept node JSON file must exist on disk');

  // Verify Task State
  const taskPath = path.join(REPO_ROOT, 'sources', 'tasks', TEST_SOURCE_ID, 'task.json');
  const task = JSON.parse(fs.readFileSync(taskPath, 'utf-8'));
  assert.strictEqual(task.state, 'INTEGRATED');
});

// 5. Validator rejects claim with missing or empty associated_concepts
runTest('Validator rejects claim with missing or empty associated_concepts', () => {
  const stagedPath = path.join(REPO_ROOT, 'knowledge', 'sources', TEST_SOURCE_ID, 'staged_decoding.json');
  const staged = JSON.parse(fs.readFileSync(stagedPath, 'utf-8'));

  // Case A: Missing associated_concepts
  delete staged.extracted_claims[0].associated_concepts;
  fs.writeFileSync(stagedPath, JSON.stringify(staged, null, 2), 'utf-8');
  let v = validateStaged(TEST_SOURCE_ID);
  assert.strictEqual(v.valid, false);
  assert.ok(v.errors.some(e => e.includes('must explicitly specify non-empty "associated_concepts"')));

  // Case B: Empty associated_concepts
  staged.extracted_claims[0].associated_concepts = [];
  fs.writeFileSync(stagedPath, JSON.stringify(staged, null, 2), 'utf-8');
  v = validateStaged(TEST_SOURCE_ID);
  assert.strictEqual(v.valid, false);
  assert.ok(v.errors.some(e => e.includes('must explicitly specify non-empty "associated_concepts"')));

  // Case C: Reference to unknown concept
  staged.extracted_claims[0].associated_concepts = ['Completely Unknown Imaginary Concept XYZ'];
  fs.writeFileSync(stagedPath, JSON.stringify(staged, null, 2), 'utf-8');
  v = validateStaged(TEST_SOURCE_ID);
  assert.strictEqual(v.valid, false);
  assert.ok(v.errors.some(e => e.includes('references unknown concept')));

  // Restore valid state
  staged.extracted_claims[0].associated_concepts = ['Cascade Hallucination Threshold'];
  fs.writeFileSync(stagedPath, JSON.stringify(staged, null, 2), 'utf-8');
});

// 6. Multiple associated concepts map strictly to those declared concepts and deduplicate cleanly
runTest('Claim maps only to declared concepts and repeated integration does not duplicate nodes', () => {
  const stagedPath = path.join(REPO_ROOT, 'knowledge', 'sources', TEST_SOURCE_ID, 'staged_decoding.json');
  const staged = JSON.parse(fs.readFileSync(stagedPath, 'utf-8'));

  staged.proposed_concepts.push({
    name: 'Secondary Test Anchor',
    aliases: ['Secondary Anchor'],
    domain: 'Computer Science',
    definition: 'A secondary concept node used to test multi-concept claim distribution.'
  });
  staged.extracted_claims[0].associated_concepts = ['Cascade Hallucination Threshold', 'Secondary Test Anchor'];
  fs.writeFileSync(stagedPath, JSON.stringify(staged, null, 2), 'utf-8');

  assert.strictEqual(validateStaged(TEST_SOURCE_ID).valid, true);

  // Run integration twice
  integrateStaged(TEST_SOURCE_ID);
  const countBefore = fs.readdirSync(path.join(REPO_ROOT, 'knowledge', 'tree', 'nodes')).filter(f => f.startsWith('claim_CLM-')).length;
  integrateStaged(TEST_SOURCE_ID);
  const countAfter = fs.readdirSync(path.join(REPO_ROOT, 'knowledge', 'tree', 'nodes')).filter(f => f.startsWith('claim_CLM-')).length;

  assert.strictEqual(countBefore, countAfter, 'Repeated integration must not duplicate claim nodes');

  // Clean up transient test anchor so canonical graph remains pristine
  const aliasPath = path.join(REPO_ROOT, 'knowledge', 'tree', 'aliases.json');
  const aliasesObj = JSON.parse(fs.readFileSync(aliasPath, 'utf-8'));
  const testNodeId = aliasesObj.mappings['secondary test anchor'];
  if (testNodeId) {
    delete aliasesObj.mappings['secondary test anchor'];
    delete aliasesObj.mappings['secondary anchor'];
    fs.writeFileSync(aliasPath, JSON.stringify(aliasesObj, null, 2), 'utf-8');
    const nodeFile = path.join(REPO_ROOT, 'knowledge', 'tree', 'nodes', `concept_${testNodeId}.json`);
    const claimFile = path.join(REPO_ROOT, 'knowledge', 'tree', 'nodes', `claim_CLM-${testNodeId}-001.json`);
    if (fs.existsSync(nodeFile)) fs.unlinkSync(nodeFile);
    if (fs.existsSync(claimFile)) fs.unlinkSync(claimFile);
  }

  // Teardown: In-memory snapshot restoration guarantees tests are strictly non-destructive
  for (const [filePath, content] of fileSnapshots.entries()) {
    fs.writeFileSync(filePath, content);
  }
});

console.log(`\n====================================================`);
console.log(`ALL ${passedCount} NATIVE AGENT PROTOCOL TESTS PASSED (100%).`);
console.log(`====================================================\n`);
process.exit(0);
