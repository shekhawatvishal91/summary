# 11 SYNTHESIS & RETRIEVAL: MASTER NOTES & GROUNDED QA

> **Document Type:** Synthesis Engineering Specification  
> **Status:** RATIFIED & BINDING  
> **Target Scope:** Cross-Source Master Notes & Query Engines  

---

## 1. Prime Directive of Cross-Source Synthesis

Cross-source synthesis in the AI Knowledge Brain is distinct from naive summarization. Synthesis is the process of:
1. Mapping connections, dependencies, and contradictions across independent resources.
2. Building thematic Master Notes that transcend individual authors while preserving specific source attributions.
3. Enabling question answering that relies strictly on verified evidence chains.

---

## 2. Cross-Source Master Note Architecture

Master notes reside in `knowledge/master/{topic_slug}.md` and synthesize multiple sources covering a shared domain.

### Mandatory Master Note Structure
```markdown
# [THEMATIC_TOPIC]: Cross-Source Master Synthesis
**Contributing Sources:** [SRC-BK-001, SRC-YT-002, SRC-RP-003]
**Last Synthesized:** [YYYY-MM-DD] | **Status:** [VERIFIED]

---

## 1. Ontological Consensus & Core Breakthroughs
* (Claims and models independently corroborated across multiple sources).
* (Direct citations: `[SRC-BK-001: p. 45]`, `[SRC-RP-003: sec: Results]`).

---

## 2. Dialectical Fault Lines & Scholarly Disagreements
* **Dispute A:** [Author A vs. Author B].
  * *Author A Stance & Data:* [Argument + Citation]
  * *Author B Stance & Data:* [Counter-argument + Citation]
  * *Epistemic Demarcation:* [Clinical/methodological comparison].

---

## 3. Unified Causal Matrix
* (Comprehensive synthesized table contrasting mechanisms, diagnostic criteria, and domain applications across all contributing works).

---

## 4. Master Field Protocols & Action Algorithms
* (Synthesized step-by-step algorithms combining the best actionable protocols from the source codices).
```

---

## 5. Grounded Question-Answering (Traceable QA) Protocol

When answering queries using the Knowledge Brain, the engine must follow this retrieval protocol:

1. **Sub-claim Decomposition:** Break the user's question into atomic verifiable sub-questions.
2. **Graph Traversal:** Query `knowledge/tree/nodes/` and `edges/` for relevant concepts and claims.
3. **Evidence Anchoring:** Assemble the direct source quotes and locators supporting each sub-claim.
4. **Factual Synthesis:** Formulate the response leading with direct answers, backed by inline citations:
   > *"The prefrontal cortex undergoes synaptic pruning during late adolescence [SRC-BK-2026-001: p. 94], although earlier fMRI studies suggested an earlier plateau [SRC-RP-2026-005: p. 12]."*
5. **Epistemic Uncertainty Flagging:** If no source in the Knowledge Brain addresses a portion of the query, explicitly state:
   > *"The current Knowledge Base contains no verified evidence on [X]."*
   Never extrapolate plausible speculation without an explicit demarcation label.
