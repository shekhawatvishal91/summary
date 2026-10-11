# 06 BOOK DECODING PROTOCOL: 6-DIMENSIONAL CODEX ENGINE

> **Document Type:** Domain Decoding Specification  
> **Status:** RATIFIED & MANDATORY  
> **Skill Integration:** `book-distillation-framework`  
> **Standard:** The Golden Test of Total Replacement  

---

## 1. The Prime Objective: Total Replacement

A book distillation fails if the reader still needs to open the original source to find a mechanism, formula, script, diagnostic edge case, or practical protocol. 

The codex is not an executive summary; it is an **exhaustive, self-contained analytical reconstruction**.

---

## 2. Epistemic Screening (Pass 0)

Before drafting, classify the book into one of four epistemic tiers:

- **Tier 1: Seminal / Empirical / Clinical Treatises:** Peer-reviewed frameworks, clinical data, foundational philosophy. Focus on primary causal mechanisms, empirical ratios, and diagnostic criteria.
- **Tier 2: Practical / Applied Systems:** Field-tested methodologies, engineering manuals, behavioral systems. Focus on step-by-step algorithms, scripts, boundary conditions.
- **Tier 3: Pop-Science / Literature:** Books with high narrative fluff and 1-2 key insights. Strip publisher padding, anecdotes, and promotional filler; extract core mental models and connect to Tier 1 foundations.
- **Tier 4: Charlatanism / Pseudoscience:** Exclude from factual knowledge; treat as a **Cautionary Demarcation Case Study** demonstrating why the claim fails scientifically.

---

## 3. The 6-Dimensional Distillation Matrix (Mandatory)

Every generated `knowledge/sources/{source-id}/codex.md` must implement all six sections:

```markdown
# [SOURCE_TITLE]: Analytical Master Codex
**Author:** [Author Name] | **Year:** [YYYY] | **Source ID:** [SRC-BK-YYYY-NNN]
**Epistemic Tier:** [Tier 1 - 4] | **Audited By:** AI Knowledge Brain Engine

---

## Dimension 1: The Core Thesis & Paradigm Shift
* **Plain-Language Premise:** (1-2 sentences stating the breakthrough insight).
* **The "What Everyone Gets Wrong" Paradigm Shift:** (Explicitly what common cultural dogma, intuitive belief, or legacy science this book demolishes).

---

## Dimension 2: Foundational Causal & Theoretical Models
* **Mechanism Over Motivation:** (Explain WHY the phenomenon occurs at a biological, neurological, economic, evolutionary, or sociological level).
* **Zero Raw KaTeX Equations:** (Render quantitative relationships in crisp prose, ratios, and intuitive empirical comparisons).

---

## Dimension 3: The Concrete Master Analogy
* (A memorable physical or mechanical analogy that captures the core dynamic, e.g., "Telegraph vs. Acoustic Resonator", "Granite Breakwater vs. Chasing Skiff").

---

## Dimension 4: Diagnostic Nuances, Typologies & Edge Cases
* **Comparative Classification Tables:** (Structured tables breaking down stages, types, or system states).
* **The Shadow & Failure Modes:** (Pathological manifestations when the concept is misapplied, taken to extremes, or applied in invalid domains).

---

## Dimension 5: Field Protocols & Verbatim Behavioral Scripts
* **The "What to Do Tomorrow" Playbook:** (Step-by-step sequential algorithms, checklists, diagnostic questions).
* **Verbatim Scripts:** (Exact phrasing for critical conversations, boundary declarations, or decision trees).

---

## Dimension 6: Skeptic Auditor's Demarcation Box
* **Pop-Culture Distortion:** (How internet gurus or pop media distort and oversimplify this idea).
* **Clinical / Empirical Reality:** (What peer-reviewed science actually establishes).
```

---

## 4. Chapter-by-Chapter Comprehensive Reconstruction

Following the 6-Dimensional Matrix, the codex must reconstruct each chapter in sequence:

For each chapter:
1. **Chapter Number & Title** (`## Chapter X: ...`)
2. **Core Argument & Flow of Reasoning**
3. **Key Propositions & Evidentiary Base** (with exact page citations `p. XX`)
4. **Counter-Intuitive Insights & Edge Cases**
5. **Key Definitions & Technical Vocabulary**

---

## 5. Active Recall Generation Contract

Every book codex must output 3-5 deep causal active recall flashcards stored in `knowledge/sources/{source-id}/cards.json`:

```json
[
  {
    "card_id": "CARD-001",
    "question": "What is the neurological mechanism distinguishing...",
    "answer": "The mechanism operates via...",
    "source_id": "SRC-BK-2026-001",
    "locator": "p. 88-92",
    "dimension": "Causal Model"
  }
]
```

---

## 6. Native Agent Decoding Workflow

To eliminate external API dependencies, book decoding is executed via the Native Agent Auditable Task Protocol:

1. **Task Initialization:** Run `node scripts/agent-protocol.js prepare <source_id>` to generate `sources/tasks/<source_id>/task.json` with structural segments.
2. **Layer A Semantic Pass:** The Antigravity native AI agent reads the source segments in conversational context, drafts the 6-Dimensional Matrix and extracted claims with page locators, and saves `knowledge/sources/<source_id>/staged_decoding.json`.
3. **Layer B Deterministic Audit:** Run `node scripts/agent-protocol.js validate-staged <source_id>` to verify all locators, verbatim quotes against raw text, and epistemic classifications.
4. **Integration:** Run `node scripts/agent-protocol.js integrate-staged <source_id>` to compile `codex.md`, update `cards.json`, merge concept nodes into `knowledge/tree/`, and refresh `web/manifest.json`.
