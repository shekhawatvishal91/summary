# 17 CHANGELOG & ARCHITECTURE DECISION RECORDS (ADR)

> **Document Type:** System Ledger & Evolution Log  
> **Status:** ACTIVE & ACCUMULATING  
> **Target Scope:** All Architecture & Infrastructure Changes  

---

## 1. System Version History

### [1.0.0-rc2] — 2026-10-11: Rigorous Audit Correction & Link Verification Engine
- **Demarcated:** Audited repository components into five explicit tiers (Executable Code, Prompt Skills, Designed Specs, Missing Items, Blocked Runtimes) in `docs/03_REPOSITORY_AUDIT.md`.
- **Refined:** Documented prompt vs binary nature of skills in `docs/14_SKILLS_AND_TOOLING.md`.
- **Upgraded:** Enhanced `scripts/validate-integrity.js` regex parser to comprehensively verify all 55 relative links across `README.md`, `AGENTS.md`, and `docs/`.

### [1.0.0-rc1] — 2026-10-11: Foundation & Constitutional Baseline
- **Initialized:** Local Git repository on branch `main` at `c:\Users\visha\OneDrive\Documents\Summary`.
- **Configured:** Remote origin mapped to `https://github.com/shekhawatvishal91/summary.git`.
- **Ratified:** Complete 18-volume documentation pack in `docs/` establishing the Non-Negotiable Constitution, Dual-Product Architecture, and Ingestion/Publishing Protocols.
- **Created:** Strict `.gitignore` preventing secret leakage, log accumulation, and temporary build file pollution.
- **Created:** System entry points `README.md` and `AGENTS.md`.

---

## 2. Architecture Decision Records (ADR)

### ADR-001: Adoption of Vanilla Node.js for CLI Tooling & Validation
- **Status:** ACCEPTED
- **Context:** The environment audit revealed that Node.js v24.18.0 is installed, while Python is absent.
- **Decision:** Implement all validation scripts, link checkers, schema validators, and test runners in vanilla Node.js using native modules (`node:fs`, `node:path`, `node:assert`, `node:crypto`).
- **Consequences:** Zero external package dependencies needed for core integrity checks. Instant execution speed on Windows.

---

### ADR-002: Dual-Product Invariance (Product A vs. Product B)
- **Status:** ACCEPTED
- **Context:** Standard knowledge bases tend to collapse source notes into generic summaries or atomic note fragments, losing the author's nuanced rhetorical architecture.
- **Decision:** Strictly separate Product A (exhaustive, source-faithful codices fulfilling the Golden Test of Total Replacement) from Product B (interconnected ontological concept/claim graph). Neither product may replace or overwrite the other.
- **Consequences:** Readers retain access to the full monograph depth while benefiting from cross-disciplinary graph synthesis.

---

### ADR-003: Plain File Substrate Over External Databases
- **Status:** ACCEPTED
- **Context:** Proprietary graph databases (Neo4j) or SQL daemons create installation bottlenecks, lock-in, and fragile portability.
- **Decision:** Store all knowledge as plain Markdown files (`.md`), JSON records (`.json`), and append-only JSON Lines streams (`.jsonl`).
- **Consequences:** Complete transparency, native Git versioning, human readability, and instant static web deployment via GitHub Pages.

---

### ADR-004: Direct Human Authorization Gate for Remote Git Pushes
- **Status:** ACCEPTED
- **Context:** Automated, unmonitored git pushes can leak secrets, overwrite remote history, or publish unverified content prematurely.
- **Decision:** Pushing to remote GitHub remotes and publishing to the live web requires explicit, direct instruction from the human operator.
- **Consequences:** Guarantees zero unvetted releases and absolute credential safety.
