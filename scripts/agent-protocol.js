#!/usr/bin/env node

/**
 * scripts/agent-protocol.js
 * AI Knowledge Brain OS - Native Agent Auditable Task Protocol Subsystem
 *
 * Implements the deterministic Layer B support for Layer A (the Native Antigravity AI Agent):
 * 1. `prepare <source_id>`:
 *    - Validates source registration in registry.json.
 *    - Extracts raw segments and structure into a task descriptor:
 *      `sources/tasks/{source_id}/task.json` (state: PREPARED).
 *    - Scaffolds `knowledge/sources/{source_id}/staged_decoding.json` template if absent.
 * 2. `task-status <source_id>`:
 *    - Reports the lifecycle state and validation audit of the task.
 * 3. `validate-staged <source_id>`:
 *    - Deterministically validates `staged_decoding.json` against raw text.
 *    - Checks 6 dimensions, epistemic classes, claim statements, locators, and verbatim quotes.
 *    - Updates `task.json` state to VALIDATED (or NEEDS_REVIEW if failed).
 * 4. `integrate-staged <source_id>`:
 *    - Compiles verified staged output into Product A (`codex.md`, `meta.json`, `cards.json`)
 *    - Integrates concepts, claims, and relationships into Product B (`knowledge/tree/`)
 *    - Rebuilds search index (`web/manifest.json`)
 *    - Updates `task.json` state to INTEGRATED and registry status to `NATIVE_AGENT_DECODED`.
 * 5. `rollback-staged <source_id>`:
 *    - Reverts staged changes safely.
 */

const fs = require('fs');
const path = require('path');
const { integrateKnowledgeNode, addRelationship, loadRegistry, saveRegistry } = require('./ingest-source');
const { buildSearchIndex } = require('./build-search-index');

const REPO_ROOT = path.resolve(__dirname, '..');
const TASKS_DIR = path.join(REPO_ROOT, 'sources', 'tasks');
const TEXT_DIR = path.join(REPO_ROOT, 'sources', 'text');
const KNOWLEDGE_SOURCES_DIR = path.join(REPO_ROOT, 'knowledge', 'sources');

const VALID_EPISTEMIC_CLASSES = [
  'DIRECT_QUOTE',
  'SOURCE_STATEMENT',
  'SOURCE_INFERENCE',
  'AI_INTERPRETATION',
  'EXTERNAL_FACT'
];

const VALID_TASK_STATES = [
  'PREPARED',
  'IN_PROGRESS',
  'AWAITING_VALIDATION',
  'NEEDS_REVIEW',
  'VALIDATED',
  'INTEGRATED'
];

/**
 * Prepares an auditable task manifest for an ingested source
 */
function prepareTask(sourceId) {
  const registry = loadRegistry();
  const sourceRecord = registry.sources.find(s => s.source_id === sourceId);
  if (!sourceRecord) {
    throw new Error(`Source "${sourceId}" is not registered in sources/registry.json.`);
  }

  const textPath = path.join(REPO_ROOT, sourceRecord.extracted_path);
  if (!fs.existsSync(textPath)) {
    throw new Error(`Extracted text file missing for "${sourceId}": ${textPath}`);
  }
  const rawText = fs.readFileSync(textPath, 'utf-8');

  const sourceMetaPath = path.join(KNOWLEDGE_SOURCES_DIR, sourceId, 'meta.json');
  let meta = {};
  if (fs.existsSync(sourceMetaPath)) {
    meta = JSON.parse(fs.readFileSync(sourceMetaPath, 'utf-8'));
  }

  const taskDir = path.join(TASKS_DIR, sourceId);
  fs.mkdirSync(taskDir, { recursive: true });

  const taskFilePath = path.join(taskDir, 'task.json');
  const taskDescriptor = {
    task_id: `TASK-${sourceId}`,
    source_id: sourceId,
    title: sourceRecord.title,
    author: sourceRecord.author,
    year: sourceRecord.published_year,
    medium: sourceRecord.medium,
    epistemic_tier: sourceRecord.epistemic_tier,
    state: 'PREPARED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    text_path: sourceRecord.extracted_path,
    segments: meta.segments || [],
    staged_output_path: `knowledge/sources/${sourceId}/staged_decoding.json`,
    validation_results: null
  };

  fs.writeFileSync(taskFilePath, JSON.stringify(taskDescriptor, null, 2), 'utf-8');

  // Scaffold empty staged_decoding.json template if not existing
  const stagedPath = path.join(KNOWLEDGE_SOURCES_DIR, sourceId, 'staged_decoding.json');
  if (!fs.existsSync(stagedPath)) {
    const template = {
      source_id: sourceId,
      agent_identifier: 'antigravity-native-agent',
      decoding_status: 'NATIVE_AGENT_DECODED',
      dimensions: {
        dim_1_core_thesis: {
          premise: '',
          paradigm_shift: ''
        },
        dim_2_causal_model: {
          mechanism: '',
          ratios_in_prose: ''
        },
        dim_3_master_analogy: {
          analogy: ''
        },
        dim_4_diagnostics: {
          classifications: [],
          failure_modes: []
        },
        dim_5_field_protocols: {
          algorithm: [],
          verbatim_scripts: []
        },
        dim_6_skeptic_box: {
          pop_culture_distortion: '',
          clinical_empirical_reality: ''
        }
      },
      extracted_claims: [],
      proposed_concepts: [],
      proposed_relationships: [],
      coverage_warnings: [],
      recall_cards: []
    };
    fs.writeFileSync(stagedPath, JSON.stringify(template, null, 2), 'utf-8');
  }

  return {
    status: 'TASK_PREPARED',
    task_file: path.relative(REPO_ROOT, taskFilePath).replace(/\\/g, '/'),
    staged_file: path.relative(REPO_ROOT, stagedPath).replace(/\\/g, '/')
  };
}

/**
 * Deterministically audits staged_decoding.json against raw source text
 */
function validateStaged(sourceId) {
  const taskFilePath = path.join(TASKS_DIR, sourceId, 'task.json');
  const stagedPath = path.join(KNOWLEDGE_SOURCES_DIR, sourceId, 'staged_decoding.json');
  const textPath = path.join(TEXT_DIR, `${sourceId}.txt`);

  if (!fs.existsSync(stagedPath)) {
    throw new Error(`Staged decoding file does not exist: ${stagedPath}`);
  }
  if (!fs.existsSync(textPath)) {
    throw new Error(`Source raw text does not exist: ${textPath}`);
  }

  const rawText = fs.readFileSync(textPath, 'utf-8');
  let staged;
  try {
    staged = JSON.parse(fs.readFileSync(stagedPath, 'utf-8'));
  } catch (e) {
    return {
      valid: false,
      errors: [`Invalid JSON in staged_decoding.json: ${e.message}`]
    };
  }

  const errors = [];
  const warnings = [];

  // 1. Mandatory Dimensions
  if (!staged.dimensions) {
    errors.push('Missing "dimensions" root object.');
  } else {
    const requiredDims = [
      'dim_1_core_thesis',
      'dim_2_causal_model',
      'dim_3_master_analogy',
      'dim_4_diagnostics',
      'dim_5_field_protocols',
      'dim_6_skeptic_box'
    ];
    requiredDims.forEach(dim => {
      if (!staged.dimensions[dim]) {
        errors.push(`Missing mandatory dimension: ${dim}`);
      }
    });

    if (staged.dimensions.dim_1_core_thesis) {
      if (!staged.dimensions.dim_1_core_thesis.premise || staged.dimensions.dim_1_core_thesis.premise.trim().length === 0) {
        errors.push('Dimension 1 premise must not be empty.');
      }
    }
  }

  // 2. Extracted Claims & Physical Locators
  if (!Array.isArray(staged.extracted_claims) || staged.extracted_claims.length === 0) {
    errors.push('Must provide at least one extracted claim in "extracted_claims".');
  } else {
    staged.extracted_claims.forEach((claim, idx) => {
      if (!claim.statement || typeof claim.statement !== 'string' || !claim.statement.trim()) {
        errors.push(`Claim [${idx}] missing valid non-empty statement.`);
      }
      if (!claim.epistemic_class || !VALID_EPISTEMIC_CLASSES.includes(claim.epistemic_class)) {
        errors.push(`Claim [${idx}] has invalid epistemic_class "${claim.epistemic_class}".`);
      }
      if (!claim.locator || typeof claim.locator !== 'string' || !claim.locator.trim()) {
        errors.push(`Claim [${idx}] missing physical locator.`);
      }

      // Verbatim Quote Verification against Raw Text
      if (claim.verbatim_quote && typeof claim.verbatim_quote === 'string') {
        const trimmedQuote = claim.verbatim_quote.trim();
        if (trimmedQuote.length > 0 && !rawText.includes(trimmedQuote)) {
          errors.push(`Claim [${idx}] verbatim quote mismatch: Quote "${trimmedQuote.substring(0, 40)}..." not found in raw source.`);
        }
      }

      // Validate explicit associated_concepts
      if (!Array.isArray(claim.associated_concepts) || claim.associated_concepts.length === 0) {
        errors.push(`Claim [${idx}] must explicitly specify non-empty "associated_concepts" array.`);
      } else {
        const proposedNames = Array.isArray(staged.proposed_concepts) ? staged.proposed_concepts.map(c => c.name.toLowerCase().trim()) : [];
        claim.associated_concepts.forEach(cName => {
          if (typeof cName !== 'string' || !cName.trim()) {
            errors.push(`Claim [${idx}] contains invalid empty associated concept reference.`);
          } else {
            const trimmed = cName.toLowerCase().trim();
            // Must match either a proposed concept in this staged payload or an existing alias
            const aliasesObj = require('./ingest-source').loadAliases();
            const existsInProposed = proposedNames.includes(trimmed);
            const existsInAliases = Boolean(aliasesObj.mappings[trimmed]);
            if (!existsInProposed && !existsInAliases) {
              errors.push(`Claim [${idx}] references unknown concept "${cName}".`);
            }
          }
        });
      }
    });
  }

  // 3. Proposed Concepts & Relationships
  if (Array.isArray(staged.proposed_concepts)) {
    staged.proposed_concepts.forEach((c, idx) => {
      if (!c.name || typeof c.name !== 'string' || !c.name.trim()) {
        errors.push(`Proposed concept [${idx}] missing canonical name.`);
      }
      if (!c.definition || typeof c.definition !== 'string' || !c.definition.trim()) {
        warnings.push(`Proposed concept "${c.name}" has an empty definition.`);
      }
    });
  }

  // 4. Update task state if task.json exists
  const validationResult = {
    valid: errors.length === 0,
    errors,
    warnings,
    claims_count: Array.isArray(staged.extracted_claims) ? staged.extracted_claims.length : 0,
    concepts_count: Array.isArray(staged.proposed_concepts) ? staged.proposed_concepts.length : 0,
    validated_at: new Date().toISOString()
  };

  if (fs.existsSync(taskFilePath)) {
    const task = JSON.parse(fs.readFileSync(taskFilePath, 'utf-8'));
    const newState = validationResult.valid ? 'VALIDATED' : 'NEEDS_REVIEW';
    const stateChanged = task.state !== newState;
    const prevValid = task.validation_results?.valid;
    const prevErrors = JSON.stringify(task.validation_results?.errors || []);
    const currErrors = JSON.stringify(validationResult.errors);
    const prevClaims = task.validation_results?.claims_count;
    const prevConcepts = task.validation_results?.concepts_count;

    if (stateChanged || prevValid !== validationResult.valid || prevErrors !== currErrors || prevClaims !== validationResult.claims_count || prevConcepts !== validationResult.concepts_count) {
      task.state = newState;
      task.updated_at = new Date().toISOString();
      task.validation_results = validationResult;
      fs.writeFileSync(taskFilePath, JSON.stringify(task, null, 2), 'utf-8');
    }
  }

  return validationResult;
}

/**
 * Integrates validated staged decoding into Product A and Product B
 */
function integrateStaged(sourceId) {
  const validation = validateStaged(sourceId);
  if (!validation.valid) {
    throw new Error(`Cannot integrate unvalidated staged decoding for "${sourceId}":\n - ${validation.errors.join('\n - ')}`);
  }

  const stagedPath = path.join(KNOWLEDGE_SOURCES_DIR, sourceId, 'staged_decoding.json');
  const staged = JSON.parse(fs.readFileSync(stagedPath, 'utf-8'));
  const sourceDir = path.join(KNOWLEDGE_SOURCES_DIR, sourceId);
  const metaPath = path.join(sourceDir, 'meta.json');
  const codexPath = path.join(sourceDir, 'codex.md');
  const cardsPath = path.join(sourceDir, 'cards.json');
  const proposedChangesPath = path.join(sourceDir, 'proposed_changes.json');

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

  // 1. Compile Product A Codex
  const dims = staged.dimensions;
  const decodedCodex = `# ${meta.title}: Analytical Master Codex
**Author:** ${meta.author} | **Year:** ${meta.year} | **Source ID:** ${sourceId}
**Epistemic Tier:** ${meta.epistemic_tier} | **Decoding Status:** ${staged.decoding_status || 'NATIVE_AGENT_DECODED'}
**Decoding Engine:** Antigravity Native AI Agent (${staged.agent_identifier || 'antigravity-native-agent'})

---

## Dimension 1: The Core Thesis & Paradigm Shift
* **Plain-Language Premise:** ${dims.dim_1_core_thesis.premise}
* **The "What Everyone Gets Wrong" Paradigm Shift:** ${dims.dim_1_core_thesis.paradigm_shift}

---

## Dimension 2: Foundational Causal & Theoretical Models
* **Mechanism Over Motivation:** ${dims.dim_2_causal_model.mechanism}
* **Quantitative Relationships & Empirical Ratios:** ${dims.dim_2_causal_model.ratios_in_prose}

---

## Dimension 3: The Concrete Master Analogy
* ${dims.dim_3_master_analogy.analogy}

---

## Dimension 4: Diagnostic Nuances, Typologies & Edge Cases
* **Classification Typology:**
${Array.isArray(dims.dim_4_diagnostics.classifications) ? dims.dim_4_diagnostics.classifications.map(c => `  - **${c.state}:** ${c.symptom} (Mechanism: ${c.etiology})`).join('\n') : ''}
* **The Shadow & Failure Modes:**
${Array.isArray(dims.dim_4_diagnostics.failure_modes) ? dims.dim_4_diagnostics.failure_modes.map(f => `  - ${f}`).join('\n') : ''}

---

## Dimension 5: Field Protocols & Verbatim Behavioral Scripts
* **The "What to Do Tomorrow" Playbook:**
${Array.isArray(dims.dim_5_field_protocols.algorithm) ? dims.dim_5_field_protocols.algorithm.map(a => `  - ${typeof a === 'object' ? a.step || JSON.stringify(a) : a}`).join('\n') : ''}
* **Verbatim Scripts (Complete Utterances):**
${Array.isArray(dims.dim_5_field_protocols.verbatim_scripts) ? dims.dim_5_field_protocols.verbatim_scripts.map(s => typeof s === 'object' ? `  - **${s.label}** (\`${s.locator}\`):\n    > "${s.verbatim_text}"` : `  - ${s}`).join('\n') : ''}
${Array.isArray(dims.dim_5_field_protocols.verbatim_fragments) && dims.dim_5_field_protocols.verbatim_fragments.length > 0 ? `* **Verbatim Speech Fragments (Truncated at Cue Boundary):**\n${dims.dim_5_field_protocols.verbatim_fragments.map(f => `  - **${f.label}** (\`${f.locator}\`):\n    > "${f.verbatim_text}..."\n    *(Note: ${f.note})*`).join('\n')}` : ''}
${Array.isArray(dims.dim_5_field_protocols.ai_generated_practical_applications) && dims.dim_5_field_protocols.ai_generated_practical_applications.length > 0 ? `* **AI-Generated Practical Applications & Exercises:**\n${dims.dim_5_field_protocols.ai_generated_practical_applications.map(app => `  - ${app}`).join('\n')}` : ''}

---

## Dimension 6: Skeptic Auditor's Demarcation Box
* **Pop-Culture Distortion:** ${dims.dim_6_skeptic_box.pop_culture_distortion}
* **Clinical / Empirical Reality:** ${dims.dim_6_skeptic_box.clinical_empirical_reality}

---

## Grounded Claims Summary
${staged.extracted_claims.map((c, i) => `### Claim ${i + 1} [${c.epistemic_class}]
* "${c.statement}"
* **Locator:** \`${c.locator}\`
${c.verbatim_quote ? `* **Verbatim:** > "${c.verbatim_quote}"` : ''}
`).join('\n')}
`;

  fs.writeFileSync(codexPath, decodedCodex, 'utf-8');

  // 2. Active Recall Flashcards
  if (Array.isArray(staged.recall_cards) && staged.recall_cards.length > 0) {
    fs.writeFileSync(cardsPath, JSON.stringify(staged.recall_cards, null, 2), 'utf-8');
  }

  // 3. Save proposed_changes.json as record
  const proposedChanges = {
    source_id: sourceId,
    generated_at: new Date().toISOString(),
    model: staged.agent_identifier || 'antigravity-native-agent',
    proposed_concepts: staged.proposed_concepts || [],
    extracted_claims: staged.extracted_claims || [],
    proposed_relationships: staged.proposed_relationships || []
  };
  fs.writeFileSync(proposedChangesPath, JSON.stringify(proposedChanges, null, 2), 'utf-8');

  // 4. Update Meta
  meta.decoding_status = 'NATIVE_AGENT_DECODED';
  meta.decoded_at = new Date().toISOString();
  meta.decoding_model = staged.agent_identifier || 'antigravity-native-agent';
  meta.prompt_version = 'native-agent-v1';
  meta.claims_count = staged.extracted_claims.length;
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

  // 5. Product B Knowledge Graph Integration
  const integratedConcepts = [];
  if (Array.isArray(staged.proposed_concepts)) {
    staged.proposed_concepts.forEach(concept => {
      // Find matching claims for this concept strictly by explicit declaration
      const aliasesObj = require('./ingest-source').loadAliases();
      const conceptTargetId = aliasesObj.mappings[concept.name.toLowerCase().trim()];

      const conceptClaims = (staged.extracted_claims || []).filter(clm => {
        if (!Array.isArray(clm.associated_concepts)) {
          return false; // Do NOT associate if associated_concepts is absent
        }
        return clm.associated_concepts.some(ref => {
          const rTrim = ref.trim();
          if (rTrim === concept.name || rTrim.toLowerCase() === concept.name.toLowerCase()) return true;
          if (conceptTargetId && rTrim.toUpperCase() === conceptTargetId) return true;
          if (Array.isArray(concept.aliases) && concept.aliases.map(a => a.toLowerCase().trim()).includes(rTrim.toLowerCase())) return true;
          return false;
        });
      });

      const res = integrateKnowledgeNode({
        name: concept.name,
        aliases: concept.aliases || [],
        domain: concept.domain || 'General',
        definition: concept.definition || '',
        epistemic_tier: meta.epistemic_tier,
        source_id: sourceId,
        claims: conceptClaims
      });
      integratedConcepts.push(res);
    });
  }

  if (Array.isArray(staged.proposed_relationships)) {
    staged.proposed_relationships.forEach(rel => {
      addRelationship({
        source_node_id: rel.source_node_id,
        target_node_id: rel.target_node_id,
        relation_type: rel.relation_type,
        description: rel.description || ''
      });
    });
  }

  // 6. Update Registry
  const registry = loadRegistry();
  const regSource = registry.sources.find(s => s.source_id === sourceId);
  if (regSource) {
    regSource.decoding_status = 'NATIVE_AGENT_DECODED';
    regSource.updated_at = new Date().toISOString();
    saveRegistry(registry);
  }

  // 7. Rebuild Web Search Manifest
  buildSearchIndex();

  // 8. Update Task Descriptor
  const taskFilePath = path.join(TASKS_DIR, sourceId, 'task.json');
  if (fs.existsSync(taskFilePath)) {
    const task = JSON.parse(fs.readFileSync(taskFilePath, 'utf-8'));
    task.state = 'INTEGRATED';
    task.updated_at = new Date().toISOString();
    fs.writeFileSync(taskFilePath, JSON.stringify(task, null, 2), 'utf-8');
  }

  return {
    status: 'INTEGRATED_SUCCESS',
    source_id: sourceId,
    concepts_integrated: integratedConcepts.length,
    claims_recorded: staged.extracted_claims.length
  };
}

// CLI Handler
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const sourceId = args[1];

  if (!command || !sourceId) {
    console.log('Usage: node scripts/agent-protocol.js <prepare|task-status|validate-staged|integrate-staged> <source_id>');
    process.exit(1);
  }

  try {
    if (command === 'prepare') {
      const res = prepareTask(sourceId);
      console.log(JSON.stringify(res, null, 2));
    } else if (command === 'task-status') {
      const taskFilePath = path.join(TASKS_DIR, sourceId, 'task.json');
      if (!fs.existsSync(taskFilePath)) {
        console.log(JSON.stringify({ status: 'NO_TASK_FOUND', source_id: sourceId }, null, 2));
      } else {
        console.log(fs.readFileSync(taskFilePath, 'utf-8'));
      }
    } else if (command === 'validate-staged') {
      const res = validateStaged(sourceId);
      console.log(JSON.stringify(res, null, 2));
      if (!res.valid) process.exit(1);
    } else if (command === 'integrate-staged') {
      const res = integrateStaged(sourceId);
      console.log(JSON.stringify(res, null, 2));
    } else {
      console.error(`Unknown command: ${command}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`[ERROR]: ${err.message}`);
    process.exit(1);
  }
}

module.exports = {
  prepareTask,
  validateStaged,
  integrateStaged
};
