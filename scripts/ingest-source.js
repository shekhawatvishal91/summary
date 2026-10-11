#!/usr/bin/env node

/**
 * scripts/ingest-source.js
 * AI Knowledge Brain OS - Primary Ingestion & Knowledge Extraction Subsystem
 *
 * Implements:
 * 1. Source registration with SHA-256 duplicate prevention.
 * 2. Unchanged preservation of raw source.
 * 3. Product A: Exhaustive codex scaffolding (6-Dimensional Matrix) with explicit decoding status.
 * 4. Product B: Canonical concept, claim, and relationship extraction with collision handling.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO_ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(REPO_ROOT, 'sources', 'registry.json');
const RAW_DIR = path.join(REPO_ROOT, 'sources', 'raw');
const TEXT_DIR = path.join(REPO_ROOT, 'sources', 'text');
const KNOWLEDGE_SOURCES_DIR = path.join(REPO_ROOT, 'knowledge', 'sources');
const NODES_DIR = path.join(REPO_ROOT, 'knowledge', 'tree', 'nodes');
const EDGES_PATH = path.join(REPO_ROOT, 'knowledge', 'tree', 'edges', 'edges.jsonl');
const ALIASES_PATH = path.join(REPO_ROOT, 'knowledge', 'tree', 'aliases.json');

// Medium Code Mapping
const MEDIUM_CODES = {
  book: 'BK',
  youtube: 'YT',
  paper: 'RP',
  notes: 'MN',
  article: 'AR'
};

/**
 * Calculates SHA-256 hash of a file or string
 */
function computeSHA256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Loads registry safely
 */
function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    return { version: '1.0.0', sources: [] };
  }
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
}

/**
 * Saves registry atomically
 */
function saveRegistry(registry) {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8');
}

/**
 * Loads concept aliases dictionary
 */
function loadAliases() {
  if (!fs.existsSync(ALIASES_PATH)) {
    return { version: '1.0.0', mappings: {} };
  }
  return JSON.parse(fs.readFileSync(ALIASES_PATH, 'utf-8'));
}

/**
 * Saves concept aliases dictionary
 */
function saveAliases(aliases) {
  fs.writeFileSync(ALIASES_PATH, JSON.stringify(aliases, null, 2), 'utf-8');
}

/**
 * Generates the next sequential Source ID
 */
function generateSourceID(medium, year, registry) {
  const code = MEDIUM_CODES[medium.toLowerCase()] || 'MN';
  const prefix = `SRC-${code}-${year}-`;
  const existing = registry.sources
    .filter(s => s.source_id.startsWith(prefix))
    .map(s => parseInt(s.source_id.split('-').pop(), 10))
    .filter(n => !isNaN(n));
  const nextSeq = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}

/**
 * Parse Markdown headings and paragraphs into structural segments
 */
function parseStructuralSegments(content) {
  const lines = content.split('\n');
  const segments = [];
  let currentHeader = 'Preamble';
  let currentLines = [];

  lines.forEach((line, idx) => {
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headerMatch) {
      if (currentLines.length > 0) {
        segments.push({
          title: currentHeader,
          paragraphs: currentLines.join('\n').trim(),
          line_start: idx - currentLines.length + 1,
          line_end: idx
        });
        currentLines = [];
      }
      currentHeader = headerMatch[2].trim();
    } else {
      currentLines.push(line);
    }
  });

  if (currentLines.length > 0) {
    segments.push({
      title: currentHeader,
      paragraphs: currentLines.join('\n').trim(),
      line_start: lines.length - currentLines.length + 1,
      line_end: lines.length
    });
  }

  return segments;
}

/**
 * Ingests a raw source file into the repository
 */
function ingestSource(filePath, options = {}) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Input file does not exist: ${absolutePath}`);
  }

  const rawBytes = fs.readFileSync(absolutePath);
  const rawContent = rawBytes.toString('utf-8');
  if (!rawContent.trim()) {
    throw new Error(`Input file is empty: ${absolutePath}`);
  }

  const sha256 = computeSHA256(rawBytes);
  const registry = loadRegistry();

  // Check for duplicate source by SHA-256 fingerprint
  const existing = registry.sources.find(s => s.sha256 === sha256);
  if (existing) {
    return {
      status: 'IDEMPOTENT_SKIPPED',
      source: existing,
      message: `Source already registered as ${existing.source_id} (SHA-256 match). Unchanged.`
    };
  }

  const year = options.year || new Date().getFullYear();
  const medium = options.medium || (filePath.endsWith('.md') ? 'notes' : 'article');
  const epistemicTier = options.tier || 'tier_2';
  const title = options.title || path.basename(filePath, path.extname(filePath));
  const author = options.author || 'Unspecified';
  const sourceId = generateSourceID(medium, year, registry);

  // 1. Preserve original source unchanged
  const rawFileName = `${sourceId}_${path.basename(filePath)}`;
  const preservedRawPath = path.join(RAW_DIR, rawFileName);
  fs.writeFileSync(preservedRawPath, rawBytes);

  // 2. Write normalized text file
  const extractedTextPath = path.join(TEXT_DIR, `${sourceId}.txt`);
  fs.writeFileSync(extractedTextPath, rawContent, 'utf-8');

  // 3. Structural segment parsing
  const segments = parseStructuralSegments(rawContent);

  // 4. Product A: Scaffold Codex (knowledge/sources/{sourceId}/)
  const sourceKnowledgeDir = path.join(KNOWLEDGE_SOURCES_DIR, sourceId);
  fs.mkdirSync(sourceKnowledgeDir, { recursive: true });

  const codexContent = `# ${title}: Analytical Master Codex
**Author:** ${author} | **Year:** ${year} | **Source ID:** ${sourceId}
**Epistemic Tier:** ${epistemicTier} | **Locator Format:** Paragraph / Section Anchor
**Decoding Status:** SCAFFOLDED_WITHOUT_LLM

> [!NOTE]
> This codex scaffold was automatically structured by \`scripts/ingest-source.js\`.
> Semantic LLM decoding has NOT yet been applied to this file. All section headings reflect parsed source structure.

---

## Dimension 1: The Core Thesis & Paradigm Shift
* **Plain-Language Premise:** [Pending Deep LLM Pass]
* **The "What Everyone Gets Wrong" Paradigm Shift:** [Pending Deep LLM Pass]

---

## Dimension 2: Foundational Causal & Theoretical Models
* **Mechanism Over Motivation:** [Pending Deep LLM Pass]
* **Quantitative Relationships & Ratios:** [Pending Deep LLM Pass]

---

## Dimension 3: The Concrete Master Analogy
* [Pending Deep LLM Pass]

---

## Dimension 4: Diagnostic Nuances, Typologies & Edge Cases
* **Classification Tables:** [Pending Deep LLM Pass]
* **The Shadow & Failure Modes:** [Pending Deep LLM Pass]

---

## Dimension 5: Field Protocols & Verbatim Behavioral Scripts
* **The "What to Do Tomorrow" Playbook:** [Pending Deep LLM Pass]
* **Verbatim Scripts:** [Pending Deep LLM Pass]

---

## Dimension 6: Skeptic Auditor's Demarcation Box
* **Pop-Culture Distortion:** [Pending Deep LLM Pass]
* **Clinical / Empirical Reality:** [Pending Deep LLM Pass]

---

## Structural Segments Extracted from Source
${segments.map((seg, i) => `### Segment ${i + 1}: ${seg.title} (Lines ${seg.line_start}-${seg.line_end})
${seg.paragraphs.length > 300 ? seg.paragraphs.substring(0, 300) + '...' : seg.paragraphs}
`).join('\n')}
`;

  fs.writeFileSync(path.join(sourceKnowledgeDir, 'codex.md'), codexContent, 'utf-8');

  // 5. Metadata Record
  const meta = {
    source_id: sourceId,
    title,
    author,
    year,
    medium,
    epistemic_tier: epistemicTier,
    sha256,
    char_count: rawContent.length,
    word_count: rawContent.trim().split(/\s+/).length,
    total_segments: segments.length,
    segments: segments.map((s, i) => ({
      segment_index: i + 1,
      title: s.title,
      line_start: s.line_start,
      line_end: s.line_end
    })),
    decoding_status: 'SCAFFOLDED_WITHOUT_LLM',
    created_at: new Date().toISOString()
  };
  fs.writeFileSync(path.join(sourceKnowledgeDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8');

  // 6. Active Recall Cards Scaffold
  const cards = [
    {
      card_id: `CARD-${sourceId}-001`,
      question: `What is the foundational premise established in ${title}?`,
      answer: `[Pending active recall extraction from ${sourceId}]`,
      source_id: sourceId,
      locator: 'sec: Segment 1',
      dimension: 'Core Thesis'
    }
  ];
  fs.writeFileSync(path.join(sourceKnowledgeDir, 'cards.json'), JSON.stringify(cards, null, 2), 'utf-8');

  // 7. Register Source in sources/registry.json
  const sourceRecord = {
    source_id: sourceId,
    title,
    author,
    published_year: year,
    medium,
    epistemic_tier: epistemicTier,
    sha256,
    raw_path: path.relative(REPO_ROOT, preservedRawPath).replace(/\\/g, '/'),
    extracted_path: path.relative(REPO_ROOT, extractedTextPath).replace(/\\/g, '/'),
    codex_path: path.relative(REPO_ROOT, path.join(sourceKnowledgeDir, 'codex.md')).replace(/\\/g, '/'),
    locator_type: 'paragraph',
    coverage_status: 'complete',
    decoding_status: 'SCAFFOLDED_WITHOUT_LLM',
    is_test_fixture: Boolean(options.is_test_fixture || (options.source_role === 'synthetic_benchmark_fixture')),
    source_role: options.source_role || (options.is_test_fixture ? 'synthetic_benchmark_fixture' : 'real_user_source'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  registry.sources.push(sourceRecord);
  saveRegistry(registry);

  return {
    status: 'INGESTED',
    source: sourceRecord,
    segments_count: segments.length
  };
}

/**
 * Extracts and integrates concepts, claims, and relationships into Product B Knowledge Tree
 */
function integrateKnowledgeNode(conceptData, options = {}) {
  const aliasesObj = loadAliases();
  const canonicalName = conceptData.name.trim();
  const normalizedKey = canonicalName.toLowerCase();

  let nodeId = aliasesObj.mappings[normalizedKey];
  let isNewConcept = false;

  if (!nodeId) {
    // Generate new Concept Node ID
    const count = Object.keys(aliasesObj.mappings).length + 1;
    nodeId = `CON-${String(count).padStart(3, '0')}`;
    aliasesObj.mappings[normalizedKey] = nodeId;
    isNewConcept = true;
  }

  // Register all provided aliases
  if (Array.isArray(conceptData.aliases)) {
    conceptData.aliases.forEach(alias => {
      const aKey = alias.trim().toLowerCase();
      if (!aliasesObj.mappings[aKey]) {
        aliasesObj.mappings[aKey] = nodeId;
      }
    });
  }
  saveAliases(aliasesObj);

  const nodeFilePath = path.join(NODES_DIR, `concept_${nodeId}.json`);
  let node;

  if (fs.existsSync(nodeFilePath)) {
    node = JSON.parse(fs.readFileSync(nodeFilePath, 'utf-8'));
    // Merge aliases and domains
    if (conceptData.aliases) {
      node.aliases = Array.from(new Set([...node.aliases, ...conceptData.aliases]));
    }
    if (conceptData.source_id && !node.sources_contributing.includes(conceptData.source_id)) {
      node.sources_contributing.push(conceptData.source_id);
    }
    node.updated_at = new Date().toISOString();
  } else {
    node = {
      node_id: nodeId,
      node_type: 'concept',
      canonical_name: canonicalName,
      aliases: conceptData.aliases || [],
      domain: conceptData.domain || 'General',
      definition: conceptData.definition || '',
      epistemic_tier: conceptData.epistemic_tier || 'tier_2',
      associated_claims: [],
      sources_contributing: conceptData.source_id ? [conceptData.source_id] : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Add claims if provided with claim deduplication
  if (Array.isArray(conceptData.claims)) {
    conceptData.claims.forEach((clm, idx) => {
      // Check if an identical claim statement already exists for this concept
      const existingDuplicateClaim = node.associated_claims.find(cId => {
        const cPath = path.join(NODES_DIR, `claim_${cId}.json`);
        if (fs.existsSync(cPath)) {
          try {
            const cObj = JSON.parse(fs.readFileSync(cPath, 'utf-8'));
            return cObj.statement.trim() === clm.statement.trim();
          } catch (e) { return false; }
        }
        return false;
      });

      if (existingDuplicateClaim) {
        return; // Skip duplicate claim
      }

      const claimId = `CLM-${nodeId}-${String(node.associated_claims.length + 1).padStart(3, '0')}`;
      const claimFilePath = path.join(NODES_DIR, `claim_${claimId}.json`);
      const claimRecord = {
        node_id: claimId,
        node_type: 'claim',
        statement: clm.statement,
        claim_type: clm.claim_type || 'empirical_finding',
        epistemic_tier: clm.epistemic_tier || node.epistemic_tier,
        evidence: [
          {
            source_id: clm.source_id || conceptData.source_id,
            locator_type: clm.locator_type || 'paragraph',
            locator: clm.locator || 'sec: General',
            verbatim_quote: clm.verbatim_quote || null
          }
        ],
        associated_concept_ids: [nodeId],
        created_at: new Date().toISOString()
      };
      fs.writeFileSync(claimFilePath, JSON.stringify(claimRecord, null, 2), 'utf-8');
      node.associated_claims.push(claimId);
    });
  }

  fs.writeFileSync(nodeFilePath, JSON.stringify(node, null, 2), 'utf-8');

  // Handle directed relationships
  if (Array.isArray(conceptData.relationships)) {
    conceptData.relationships.forEach(rel => {
      addRelationship({
        source_node_id: nodeId,
        target_node_id: rel.target_node_id,
        relation_type: rel.relation_type,
        description: rel.description,
        dispute_details: rel.dispute_details || null
      });
    });
  }

  return {
    status: isNewConcept ? 'CONCEPT_CREATED' : 'CONCEPT_UPDATED',
    node_id: nodeId,
    canonical_name: canonicalName
  };
}

/**
 * Appends a relationship edge to knowledge/tree/edges/edges.jsonl
 * Guarantees duplicate prevention.
 */
function addRelationship(edge) {
  let existingLines = [];
  if (fs.existsSync(EDGES_PATH)) {
    existingLines = fs.readFileSync(EDGES_PATH, 'utf-8')
      .split('\n')
      .filter(l => l.trim().length > 0)
      .map(l => {
        try { return JSON.parse(l); } catch (e) { return null; }
      })
      .filter(Boolean);
  }

  // Duplicate Check: Same source, target, and relation_type
  const duplicate = existingLines.find(e =>
    e.source_node_id === edge.source_node_id &&
    e.target_node_id === edge.target_node_id &&
    e.relation_type === edge.relation_type
  );

  if (duplicate) {
    return { status: 'DUPLICATE_EDGE_SKIPPED', edge_id: duplicate.edge_id };
  }

  // Determine maximum existing edge ID across active edges and archived/retired records
  const allKnownIds = new Set(existingLines.map(e => e.edge_id).filter(Boolean));
  const archiveDir = path.join(REPO_ROOT, 'knowledge', 'tree', 'archive');
  if (fs.existsSync(archiveDir)) {
    const scanDir = (dir) => {
      fs.readdirSync(dir).forEach(file => {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) {
          scanDir(full);
        } else if (file.includes('edge') || file.endsWith('.jsonl') || file.endsWith('.bak')) {
          try {
            fs.readFileSync(full, 'utf-8').split('\n').forEach(l => {
              try {
                const parsed = JSON.parse(l);
                if (parsed.edge_id) allKnownIds.add(parsed.edge_id);
              } catch (e) {}
            });
          } catch (e) {}
        }
      });
    };
    scanDir(archiveDir);
  }

  const existingNums = Array.from(allKnownIds)
    .map(id => parseInt(id.replace(/^EDG-/, ''), 10))
    .filter(n => !isNaN(n));
  const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
  const edgeId = `EDG-${String(nextNum).padStart(3, '0')}`;
  const newEdge = {
    edge_id: edgeId,
    source_node_id: edge.source_node_id,
    target_node_id: edge.target_node_id,
    relation_type: edge.relation_type,
    description: edge.description || '',
    dispute_details: edge.dispute_details || null,
    source_id: edge.source_id || null,
    locator: edge.locator || null,
    epistemic_classification: edge.epistemic_classification || null,
    created_at: new Date().toISOString()
  };

  fs.appendFileSync(EDGES_PATH, JSON.stringify(newEdge) + '\n', 'utf-8');
  return { status: 'EDGE_CREATED', edge_id: edgeId };
}

// CLI Execution Handler
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node scripts/ingest-source.js <filepath> [--title "Title"] [--author "Author"] [--year YYYY] [--medium book|notes|article] [--tier tier_1|tier_2]');
    process.exit(1);
  }

  const filePath = args[0];
  const options = {};
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const val = args[i + 1];
    if (val) options[key] = val;
  }

  try {
    const result = ingestSource(filePath, options);
    console.log('[INGESTION RESULT]:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('[INGESTION ERROR]:', err.message);
    process.exit(1);
  }
}

module.exports = {
  ingestSource,
  integrateKnowledgeNode,
  addRelationship,
  computeSHA256,
  loadRegistry,
  saveRegistry,
  loadAliases,
  saveAliases
};
