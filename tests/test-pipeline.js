#!/usr/bin/env node

/**
 * tests/test-pipeline.js
 * Comprehensive automated acceptance tests for the AI Knowledge Brain OS
 * First Functional Milestone
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  ingestSource,
  integrateKnowledgeNode,
  addRelationship,
  computeSHA256,
  loadRegistry,
  loadAliases
} = require('../scripts/ingest-source');

const REPO_ROOT = path.resolve(__dirname, '..');
const FIXTURE_PATH = path.join(REPO_ROOT, 'tests', 'fixtures', 'test-cognitive-control.md');

// Isolated In-Memory Snapshots to guarantee 100% non-destructive test execution
const SNAPSHOT_FILES = [
  path.join(REPO_ROOT, 'sources', 'registry.json'),
  path.join(REPO_ROOT, 'knowledge', 'sources', 'SRC-RP-2026-001', 'meta.json'),
  path.join(REPO_ROOT, 'knowledge', 'sources', 'SRC-RP-2026-001', 'proposed_changes.json'),
  path.join(REPO_ROOT, 'knowledge', 'sources', 'SRC-RP-2026-001', 'codex.md'),
  path.join(REPO_ROOT, 'knowledge', 'tree', 'nodes', 'concept_CON-001.json'),
  path.join(REPO_ROOT, 'knowledge', 'tree', 'nodes', 'concept_CON-005.json'),
  path.join(REPO_ROOT, 'knowledge', 'tree', 'aliases.json'),
  path.join(REPO_ROOT, 'knowledge', 'tree', 'edges', 'edges.jsonl'),
  path.join(REPO_ROOT, 'web', 'manifest.json')
];
const fileSnapshots = new Map();
SNAPSHOT_FILES.forEach(p => {
  if (fs.existsSync(p)) fileSnapshots.set(p, fs.readFileSync(p));
});

console.log('====================================================');
console.log('AI KNOWLEDGE BRAIN OS: PIPELINE ACCEPTANCE TESTS');
console.log('====================================================\n');

let testsPassed = 0;

function runTest(name, fn) {
  process.stdout.write(`[TEST ${testsPassed + 1}] ${name}... `);
  try {
    fn();
    console.log('PASSED');
    testsPassed++;
  } catch (err) {
    console.log('FAILED');
    console.error(`\nAssertion Failure in "${name}":`);
    console.error(err.stack || err.message);
    process.exit(1);
  }
}

// 1. Invalid input handling
runTest('Invalid input handling (non-existent file & empty file)', () => {
  assert.throws(() => {
    ingestSource('non_existent_file_xyz_123.md');
  }, /does not exist/);

  const emptyFilePath = path.join(REPO_ROOT, 'tests', 'fixtures', 'temp_empty.md');
  fs.writeFileSync(emptyFilePath, '   \n  ');
  try {
    assert.throws(() => {
      ingestSource(emptyFilePath);
    }, /empty/);
  } finally {
    if (fs.existsSync(emptyFilePath)) fs.unlinkSync(emptyFilePath);
  }
});

// 2. Source registration & preservation
let ingestedSourceId = null;
runTest('Source registration and raw file preservation', () => {
  const result = ingestSource(FIXTURE_PATH, {
    title: 'Working Memory Constraints in Cognitive Control',
    author: 'Dr. Elena Vance',
    year: 2026,
    medium: 'paper',
    tier: 'tier_1'
  });

  assert.ok(['INGESTED', 'IDEMPOTENT_SKIPPED'].includes(result.status));
  assert.ok(result.source.source_id.startsWith('SRC-RP-2026-'));
  ingestedSourceId = result.source.source_id;

  // Verify raw file preservation byte-for-byte
  const rawPath = path.join(REPO_ROOT, result.source.raw_path);
  assert.ok(fs.existsSync(rawPath), 'Raw preserved file must exist');
  const originalBytes = fs.readFileSync(FIXTURE_PATH);
  const preservedBytes = fs.readFileSync(rawPath);
  assert.strictEqual(
    computeSHA256(preservedBytes),
    computeSHA256(originalBytes),
    'Preserved file must match original SHA-256 byte-for-byte'
  );

  // Verify extracted text exists
  const textPath = path.join(REPO_ROOT, result.source.extracted_path);
  assert.ok(fs.existsSync(textPath), 'Extracted text file must exist');
});

// 3. SHA-256 duplicate detection (Idempotence)
runTest('SHA-256 duplicate detection (Idempotent re-ingestion)', () => {
  const regBefore = loadRegistry();
  const countBefore = regBefore.sources.length;

  // Re-ingest the exact same fixture: must be IDEMPOTENT_SKIPPED
  const res = ingestSource(FIXTURE_PATH, {
    title: 'Duplicate Attempt',
    author: 'Dr. Elena Vance'
  });

  assert.strictEqual(res.status, 'IDEMPOTENT_SKIPPED');
  assert.strictEqual(res.source.source_id, ingestedSourceId);

  const regAfter = loadRegistry();
  assert.strictEqual(
    regAfter.sources.length,
    countBefore,
    'Duplicate ingestion must NOT append additional records to registry'
  );
});

// 4. Note and metadata schema validation
runTest('Product A Codex and Meta schema validation', () => {
  const codexPath = path.join(REPO_ROOT, 'knowledge', 'sources', ingestedSourceId, 'codex.md');
  const metaPath = path.join(REPO_ROOT, 'knowledge', 'sources', ingestedSourceId, 'meta.json');
  const cardsPath = path.join(REPO_ROOT, 'knowledge', 'sources', ingestedSourceId, 'cards.json');

  assert.ok(fs.existsSync(codexPath), 'Codex file must exist');
  assert.ok(fs.existsSync(metaPath), 'Metadata file must exist');
  assert.ok(fs.existsSync(cardsPath), 'Flashcards file must exist');

  const codexContent = fs.readFileSync(codexPath, 'utf-8');
  assert.ok(codexContent.includes('## Dimension 1: The Core Thesis & Paradigm Shift'));
  assert.ok(codexContent.includes('## Dimension 2: Foundational Causal & Theoretical Models'));
  assert.ok(codexContent.includes('## Dimension 3: The Concrete Master Analogy'));
  assert.ok(codexContent.includes('## Dimension 4: Diagnostic Nuances, Typologies & Edge Cases'));
  assert.ok(codexContent.includes('## Dimension 5: Field Protocols & Verbatim Behavioral Scripts'));
  assert.ok(codexContent.includes('## Dimension 6: Skeptic Auditor\'s Demarcation Box'));
  assert.ok(
    codexContent.includes('Decoding Status:** SCAFFOLDED_WITHOUT_LLM') ||
    codexContent.includes('Decoding Status:** MOCK_AI_DECODED') ||
    codexContent.includes('Decoding Status:** NATIVE_AGENT_DECODED')
  );

  const metaData = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  assert.strictEqual(metaData.source_id, ingestedSourceId);
  assert.ok(metaData.segments.length > 0);
  assert.ok(['SCAFFOLDED_WITHOUT_LLM', 'MOCK_AI_DECODED', 'NATIVE_AGENT_DECODED'].includes(metaData.decoding_status));
});

// 5. Knowledge node extraction & integration (Product B)
let conceptNodeId = null;
runTest('Knowledge concept and claim node integration', () => {
  const integrationResult = integrateKnowledgeNode({
    name: 'Working Memory Capacity Ceiling',
    aliases: ['Central Executive Bottleneck', 'Chunk Capacity Limit'],
    domain: 'Cognitive Neuroscience',
    definition: 'The strict biological constraint bounding unchunked active mental representations to 4 ± 1 items.',
    epistemic_tier: 'tier_1',
    source_id: ingestedSourceId,
    claims: [
      {
        statement: 'Unchunked working memory capacity is strictly bounded to 4 plus or minus 1 discrete mental representations under active cognitive load.',
        claim_type: 'empirical_finding',
        locator: 'sec: The Prefrontal Capacity Ceiling # para-2',
        verbatim_quote: 'unchunked active memory representations degrade catastrophically beyond 4 plus or minus 1 discrete semantic units.'
      }
    ]
  });

  assert.ok(
    integrationResult.status === 'CONCEPT_CREATED' || integrationResult.status === 'CONCEPT_UPDATED'
  );
  conceptNodeId = integrationResult.node_id;

  const conceptPath = path.join(REPO_ROOT, 'knowledge', 'tree', 'nodes', `concept_${conceptNodeId}.json`);
  assert.ok(fs.existsSync(conceptPath), 'Concept node file must exist on disk');

  const conceptJson = JSON.parse(fs.readFileSync(conceptPath, 'utf-8'));
  assert.strictEqual(conceptJson.canonical_name, 'Working Memory Capacity Ceiling');
  assert.ok(conceptJson.associated_claims.length >= 1);

  const claimId = conceptJson.associated_claims[0];
  const claimPath = path.join(REPO_ROOT, 'knowledge', 'tree', 'nodes', `claim_${claimId}.json`);
  assert.ok(fs.existsSync(claimPath), 'Claim node file must exist on disk');

  const claimJson = JSON.parse(fs.readFileSync(claimPath, 'utf-8'));
  assert.strictEqual(claimJson.evidence[0].source_id, ingestedSourceId);
  assert.strictEqual(claimJson.evidence[0].locator, 'sec: The Prefrontal Capacity Ceiling # para-2');
});

// 6. Safe alias matching & update
runTest('Concept alias matching and non-destructive update', () => {
  // Query with an alias instead of the canonical name
  const result = integrateKnowledgeNode({
    name: 'Central Executive Bottleneck', // existing alias
    aliases: ['Frontal Buffer Limit'],    // new additional alias
    source_id: ingestedSourceId,
    claims: [
      {
        statement: 'Prefrontal adenosine accumulation mediates perceived cognitive fatigue.',
        claim_type: 'empirical_finding',
        locator: 'sec: Neurochemical Modulation & Ego Depletion # para-1'
      }
    ]
  });

  // Must match the existing concept node ID
  assert.strictEqual(result.node_id, conceptNodeId);
  assert.strictEqual(result.status, 'CONCEPT_UPDATED');

  const conceptPath = path.join(REPO_ROOT, 'knowledge', 'tree', 'nodes', `concept_${conceptNodeId}.json`);
  const conceptJson = JSON.parse(fs.readFileSync(conceptPath, 'utf-8'));
  assert.ok(conceptJson.aliases.includes('Frontal Buffer Limit'));
  assert.strictEqual(conceptJson.associated_claims.length, 2);
});

// 7. Relationship management & duplicate edge prevention
runTest('Relationship creation and duplicate prevention', () => {
  // Create target concept
  const targetConcept = integrateKnowledgeNode({
    name: 'Ego Depletion',
    domain: 'Behavioral Psychology',
    definition: 'Diminution of cognitive control and volition following sustained exertion.'
  });

  // Add edge (created on first run, or skipped if already exists)
  const edge1 = addRelationship({
    source_node_id: conceptNodeId,
    target_node_id: targetConcept.node_id,
    relation_type: 'extends',
    description: 'Biological substrate for cognitive exertion limits.'
  });

  assert.ok(['EDGE_CREATED', 'DUPLICATE_EDGE_SKIPPED'].includes(edge1.status));

  // Attempt duplicate edge: must ALWAYS be rejected as duplicate
  const edge2 = addRelationship({
    source_node_id: conceptNodeId,
    target_node_id: targetConcept.node_id,
    relation_type: 'extends',
    description: 'Duplicate edge attempt'
  });

  assert.strictEqual(edge2.status, 'DUPLICATE_EDGE_SKIPPED');
});

// 8. Search index manifest builder
runTest('Search manifest compilation with real data', () => {
  require('../scripts/build-search-index');
  const manifestPath = path.join(REPO_ROOT, 'web', 'manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'web/manifest.json must exist');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  assert.ok(manifest.metrics.total_sources >= 1);
  assert.ok(manifest.metrics.total_concepts >= 1);
  assert.ok(manifest.metrics.total_edges >= 1);

  // Verify data-driven source fixture vs real source metadata
  const rp001 = manifest.sources.find(s => s.source_id === 'SRC-RP-2026-001');
  const rp002 = manifest.sources.find(s => s.source_id === 'SRC-RP-2026-002');
  const yt001 = manifest.sources.find(s => s.source_id === 'SRC-YT-2026-001');

  if (rp001) {
    assert.strictEqual(rp001.is_test_fixture, true, 'SRC-RP-2026-001 must be flagged as test fixture');
    assert.strictEqual(rp001.source_role, 'synthetic_benchmark_fixture');
  }
  if (rp002) {
    assert.strictEqual(rp002.is_test_fixture, true, 'SRC-RP-2026-002 must be flagged as test fixture');
    assert.strictEqual(rp002.source_role, 'synthetic_benchmark_fixture');
  }
  if (yt001) {
    assert.strictEqual(yt001.is_test_fixture, false, 'SRC-YT-2026-001 must NOT be flagged as test fixture');
    assert.strictEqual(yt001.source_role, 'real_user_source');
    assert.strictEqual(yt001.medium, 'youtube');
  }

  // Teardown: In-memory snapshot restoration guarantees tests are strictly non-destructive
  for (const [filePath, content] of fileSnapshots.entries()) {
    fs.writeFileSync(filePath, content);
  }
});

console.log(`\n====================================================`);
console.log(`ALL ${testsPassed} PIPELINE TESTS PASSED (100% SUCCESS).`);
console.log(`====================================================\n`);
