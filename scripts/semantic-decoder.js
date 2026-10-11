#!/usr/bin/env node

/**
 * scripts/semantic-decoder.js
 * AI Knowledge Brain OS - Semantic Decoding Engine
 *
 * Implements:
 * 1. Prompt-engineered 6-Dimensional Matrix extraction using configured LLM provider.
 * 2. Strict epistemic class demarcation (Direct Quote, Statement, Inference, Interpretation, External Fact).
 * 3. Validation of output schemas with fail-safe rejection of malformed outputs.
 * 4. Staged knowledge-tree proposals (knowledge/sources/{source_id}/proposed_changes.json).
 * 5. Atomic transaction rollback on model failure.
 */

const fs = require('fs');
const path = require('path');
const { getActiveProvider } = require('./llm-adapter');

const REPO_ROOT = path.resolve(__dirname, '..');
const KNOWLEDGE_SOURCES_DIR = path.join(REPO_ROOT, 'knowledge', 'sources');
const TEXT_DIR = path.join(REPO_ROOT, 'sources', 'text');

const VALID_EPISTEMIC_CLASSES = [
  'DIRECT_QUOTE',
  'SOURCE_STATEMENT',
  'SOURCE_INFERENCE',
  'AI_INTERPRETATION',
  'EXTERNAL_FACT'
];

/**
 * Validates the schema of an LLM semantic decoding payload
 */
function validateDecodingPayload(data, sourceRawText) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Response is not a valid JSON object.'] };
  }

  // 1. Verify Dimensions
  if (!data.dimensions) {
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
      if (!data.dimensions[dim]) {
        errors.push(`Missing mandatory dimension: ${dim}`);
      }
    });
  }

  // 2. Verify Extracted Claims & Locators
  if (!Array.isArray(data.extracted_claims)) {
    errors.push('Missing or invalid "extracted_claims" array.');
  } else {
    data.extracted_claims.forEach((claim, idx) => {
      if (!claim.statement || typeof claim.statement !== 'string') {
        errors.push(`Claim [${idx}] missing valid "statement".`);
      }
      if (!claim.epistemic_class || !VALID_EPISTEMIC_CLASSES.includes(claim.epistemic_class)) {
        errors.push(`Claim [${idx}] has invalid epistemic_class: "${claim.epistemic_class}".`);
      }
      if (!claim.locator || typeof claim.locator !== 'string') {
        errors.push(`Claim [${idx}] missing valid locator anchor.`);
      }
      // If verbatim quote is asserted, verify against raw text
      if (claim.verbatim_quote && typeof claim.verbatim_quote === 'string') {
        if (!sourceRawText.includes(claim.verbatim_quote.trim())) {
          errors.push(`Claim [${idx}] verbatim quote mismatch: quote not found in source text.`);
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Executes semantic decoding for a given source ID
 */
async function decodeSource(sourceId, options = {}) {
  const sourceKnowledgeDir = path.join(KNOWLEDGE_SOURCES_DIR, sourceId);
  const textFilePath = path.join(TEXT_DIR, `${sourceId}.txt`);
  const metaFilePath = path.join(sourceKnowledgeDir, 'meta.json');
  const codexFilePath = path.join(sourceKnowledgeDir, 'codex.md');

  if (!fs.existsSync(sourceKnowledgeDir) || !fs.existsSync(textFilePath)) {
    throw new Error(`Source assets not found for ${sourceId}`);
  }

  const rawSourceText = fs.readFileSync(textFilePath, 'utf-8');
  const meta = JSON.parse(fs.readFileSync(metaFilePath, 'utf-8'));

  // Backup original codex and meta in memory for rollback guarantee
  const originalCodexContent = fs.existsSync(codexFilePath) ? fs.readFileSync(codexFilePath, 'utf-8') : null;
  const originalMetaContent = JSON.stringify(meta);

  // Resolve LLM Provider
  const provider = getActiveProvider({
    forceMock: options.forceMock || false,
    customMockHandler: options.customMockHandler || null
  });

  if (!provider.isConfigured()) {
    return {
      status: 'SKIPPED_NO_PROVIDER',
      source_id: sourceId,
      message: 'No authorized LLM provider configured. Set GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY.'
    };
  }

  // Construct Prompt
  const prompt = `You are the AI Knowledge Brain Semantic Codex Engine.
Analyze the following source material and output a STRICT JSON object complying with the 6-Dimensional Matrix and Knowledge Model.

SOURCE TITLE: ${meta.title}
AUTHOR: ${meta.author} (${meta.year})
MEDIUM: ${meta.medium}
EPISTEMIC TIER: ${meta.epistemic_tier}

RAW TEXT & STRUCTURAL SEGMENTS:
${rawSourceText}

OUTPUT FORMAT: Return raw JSON only with keys:
- decoding_status: string
- model_identifier: string
- prompt_version: string
- dimensions: { dim_1_core_thesis, dim_2_causal_model, dim_3_master_analogy, dim_4_diagnostics, dim_5_field_protocols, dim_6_skeptic_box }
- extracted_claims: array of { statement, epistemic_class, claim_type, locator, verbatim_quote }
- proposed_concepts: array of { name, aliases, domain, definition }
- proposed_relationships: array of { source_concept, target_concept, relation_type, description }
- coverage_warnings: array of strings
`;

  try {
    const rawResponse = await provider.generateCompletion(prompt, { temperature: 0.1 });
    
    // Extract JSON from response
    let cleanJsonStr = rawResponse.trim();
    if (cleanJsonStr.startsWith('```json')) {
      cleanJsonStr = cleanJsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJsonStr.startsWith('```')) {
      cleanJsonStr = cleanJsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const payload = JSON.parse(cleanJsonStr);

    // Schema & Citation Validation
    const validation = validateDecodingPayload(payload, rawSourceText);
    if (!validation.valid) {
      throw new Error(`Decoding validation failed:\n - ${validation.errors.join('\n - ')}`);
    }

    // 1. Update Product A Codex Markdown with Decoded Content
    const dims = payload.dimensions;
    const decodedCodex = `# ${meta.title}: Analytical Master Codex
**Author:** ${meta.author} | **Year:** ${meta.year} | **Source ID:** ${sourceId}
**Epistemic Tier:** ${meta.epistemic_tier} | **Decoding Status:** ${payload.decoding_status}
**Engine:** ${payload.model_identifier} (${payload.prompt_version})

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
${Array.isArray(dims.dim_5_field_protocols.algorithm) ? dims.dim_5_field_protocols.algorithm.map(a => `  - ${a}`).join('\n') : ''}
* **Verbatim Scripts:**
${Array.isArray(dims.dim_5_field_protocols.verbatim_scripts) ? dims.dim_5_field_protocols.verbatim_scripts.map(s => `  - ${s}`).join('\n') : ''}

---

## Dimension 6: Skeptic Auditor's Demarcation Box
* **Pop-Culture Distortion:** ${dims.dim_6_skeptic_box.pop_culture_distortion}
* **Clinical / Empirical Reality:** ${dims.dim_6_skeptic_box.clinical_empirical_reality}

---

## Grounded Claims Summary
${payload.extracted_claims.map((c, i) => `### Claim ${i + 1} [${c.epistemic_class}]
* "${c.statement}"
* **Locator:** \`${c.locator}\`
${c.verbatim_quote ? `* **Verbatim:** > "${c.verbatim_quote}"` : ''}
`).join('\n')}
`;

    fs.writeFileSync(codexFilePath, decodedCodex, 'utf-8');

    // 2. Write Proposed Knowledge Graph Changes
    const proposedChangesPath = path.join(sourceKnowledgeDir, 'proposed_changes.json');
    const proposedChanges = {
      source_id: sourceId,
      generated_at: new Date().toISOString(),
      model: payload.model_identifier,
      proposed_concepts: payload.proposed_concepts || [],
      extracted_claims: payload.extracted_claims || [],
      proposed_relationships: payload.proposed_relationships || []
    };
    fs.writeFileSync(proposedChangesPath, JSON.stringify(proposedChanges, null, 2), 'utf-8');

    // 3. Write Coverage Warnings
    const coverageWarningsPath = path.join(sourceKnowledgeDir, 'coverage_warnings.json');
    fs.writeFileSync(
      coverageWarningsPath,
      JSON.stringify(payload.coverage_warnings || [], null, 2),
      'utf-8'
    );

    // 4. Update Metadata
    meta.decoding_status = payload.decoding_status;
    meta.decoded_at = new Date().toISOString();
    meta.decoding_model = payload.model_identifier;
    meta.prompt_version = payload.prompt_version;
    meta.claims_count = payload.extracted_claims.length;
    fs.writeFileSync(metaFilePath, JSON.stringify(meta, null, 2), 'utf-8');

    return {
      status: 'DECODED_SUCCESS',
      source_id: sourceId,
      model: payload.model_identifier,
      claims_extracted: payload.extracted_claims.length,
      proposed_concepts: (payload.proposed_concepts || []).length
    };
  } catch (err) {
    // Transactional Rollback: Restore original state untouched
    if (originalCodexContent !== null) {
      fs.writeFileSync(codexFilePath, originalCodexContent, 'utf-8');
    }
    fs.writeFileSync(metaFilePath, originalMetaContent, 'utf-8');

    return {
      status: 'DECODING_FAILED',
      source_id: sourceId,
      error: err.message,
      rollback_applied: true
    };
  }
}

module.exports = {
  decodeSource,
  validateDecodingPayload
};
