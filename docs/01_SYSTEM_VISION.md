# 01 SYSTEM VISION & ACCEPTANCE CRITERIA

> **Document Type:** System Specification & Requirements  
> **Status:** APPROVED & MANDATORY  
> **Target Scope:** AI Knowledge Brain Operating System  

---

## 1. Executive Summary

The modern problem of information consumption is characterized by shallow summaries, fragmented notes, lost citations, and ephemeral comprehension. The **AI Knowledge Brain (KB-OS)** is engineered as a cognitive exoskeleton that digests deep, dense, heterogeneous materials and synthesizes them into an indelible, hyper-structured knowledge base.

It balances the need for comprehensive monograph fidelity with the cross-disciplinary power of an integrated ontological graph.

---

## 2. Ingestion Scope & Source Formats

The system is designed to ingest and faithfully process five classes of inputs:

1. **Books & Long-form Treatises:**
   - Formats: EPUB, PDF, plain text, scanned OCR pages.
   - Types: Seminal clinical treatises, technical textbooks, philosophy, history, empirical monographs, literature.
2. **Video & Audio Lectures:**
   - Formats: YouTube URLs, MP4 recordings, MP3 audio, WebVTT/SRT transcripts.
   - Types: University lectures, long-form podcast interviews, technical conference talks, tutorials.
3. **Research Papers & Technical Reports:**
   - Formats: ArXiv PDFs, DOI links, whitepapers, clinical trial disclosures.
   - Types: Peer-reviewed experimental studies, theoretical proofs, meta-analyses.
4. **Legacy Personal Notes & Markdown Archives:**
   - Formats: Obsidian vaults, Roam JSON, raw Markdown files, Logseq outlines.
   - Integration: Historical notes are treated as primary personal claims with attributed provenance.
5. **Multi-Source Synthesis Bundles:**
   - Formats: Curated thematic reading lists, competing debate papers, multi-part course series.

---

## 3. The Dual-Product Architecture

Every ingested resource generates two parallel, non-fungible artifacts:

### Product A: Source-Specific Reconstruction (The Dedicated Codex)
- **Nature:** An exhaustive, self-contained reconstruction that satisfies the *Golden Test of Total Replacement*:
  > *"If the reader never opens the original source text or video, they will not miss a single foundational model, diagnostic distinction, counter-intuitive nuance, experimental finding, quantitative ratio, or practical protocol."*
- **Structure:**
  - Preserves author’s internal logic, sequencing, chapter hierarchy, and rhetorical architecture.
  - Documents exact page/timestamp anchors for all primary claims.
  - Captures verbatim quotes for foundational axioms and critical declarations.
  - Retains all caveats, assumptions, historical contexts, and failure modes.
- **Storage Path:** `knowledge/sources/{source-id}/codex.md`

### Product B: Integrated Knowledge Tree (The Ontological Graph)
- **Nature:** A cross-resource ontological graph that indexes ideas, models, claims, and entities into a living synthesis.
- **Characteristics:**
  - Does not homogenize disagreement; it surfaces contradictions and competing schools of thought.
  - Normalizes aliases to canonical concepts (e.g., *Self-Regulation*, *Executive Function*, *Volition*) while retaining contextual nuance.
  - Maps multi-hop relationships (`supports`, `contradicts`, `extends`, `specializes`, `invalidates`, `instantiates`).
- **Storage Path:** `knowledge/tree/nodes/`, `knowledge/tree/edges/`, and `knowledge/master/`

---

## 4. Key Performance Invariants & Acceptance Gates

To transition any source or synthesis from `DRAFT` to `VERIFIED_PUBLISHED`, it must pass five gates:

### Gate 1: Completeness Audit (Source Coverage Gate)
- Minimum structural coverage: 100% of chapters, modules, or sections present in the source table of contents must be represented in Product A.
- Any omitted section (e.g., publisher index, unreadable scan) must be explicitly flagged with a `[COVERAGE_WARNING]` and justification.

### Gate 2: Epistemic Demarcation Gate
- All claims must be marked with epistemic tiers:
  - **Tier 1:** Empirical / Clinical / Primary Proofs
  - **Tier 2:** Applied Protocols & Field Systems
  - **Tier 3:** Popular Heuristics & Anecdotes
  - **Tier 4:** Cautionary Demarcation (Debunked / Pseudoscience)
- Zero hallucinated quotes, fabricated statistics, or invented page numbers.

### Gate 3: Provenance & Traceability Gate
- 100% of substantive factual assertions in Product A and Product B must possess a valid provenance locator (`locator_type`: `page_number`, `timestamp`, `paragraph`, `section_hash`).
- Dangling claims are automatically routed to the quarantine queue.

### Gate 4: Visual & Web Presentation Gate
- Markdown artifacts must compile cleanly into semantic, accessible HTML for the web interface and GitHub Pages.
- Clean typography, high readability, zero raw LaTeX syntax in text (lucid prose ratios preferred), structured tables, and collapsible technical callouts.

### Gate 5: Security & Secret Cleanliness Gate
- Zero personal access tokens (PAT), credentials, private system paths, or unvetted scripts in commits or published web outputs.
- Build scripts and validation harnesses must pass with exit code `0`.
