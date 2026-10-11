# 13 TESTING & QUALITY ASSURANCE: COVERAGE, FIDELITY & REGRESSION

> **Document Type:** Quality Assurance & Test Engineering Manual  
> **Status:** RATIFIED & MANDATORY  
> **Constitutional Anchor:** Article V (Reliability & Operational Integrity)  

---

## 1. Prime QA Philosophy

In the AI Knowledge Brain OS, **testing is epistemic, not merely syntactic**. 

It is insufficient for code to execute without throwing an exception. The testing framework verifies semantic completeness, factual traceability, schema conformance, link integrity, and secret absence.

---

## 2. The Five Test Suites

```
┌────────────────────────────────────────────────────────┐
│ Suite 1: Structural & Schema Validation                │
│ (Verifies all JSON files adhere to v2020-12 schemas)   │
├────────────────────────────────────────────────────────┤
│ Suite 2: Referential Integrity & Broken Link Audit     │
│ (Verifies all Markdown links, node IDs, source refs)   │
├────────────────────────────────────────────────────────┤
│ Suite 3: Epistemic & Citation Coverage Checks          │
│ (Verifies every substantive claim has a valid locator) │
├────────────────────────────────────────────────────────┤
│ Suite 4: Security & Secret Leakage Scanners            │
│ (Verifies zero PATs, keys, or private paths in tree)   │
├────────────────────────────────────────────────────────┤
│ Suite 5: Web Build & Asset Compilation Tests           │
│ (Verifies web/index.html & manifest.json integrity)    │
└────────────────────────────────────────────────────────┘
```

---

## 3. Automated Test Runner (`tests/run-all-tests.js`)

All tests are executed via Node.js using native assertions:

```bash
node tests/run-all-tests.js
```

### Exit Code Semantics:
- `0`: All tests passed without error or regression.
- `1`: Validation or assertion failure. Publishing is strictly blocked.
- `2`: Environment or missing dependency error.

---

## 4. Specific Verification Invariants

### 4.1 Broken Link Invariant
Every Markdown file in `docs/`, `knowledge/`, and root must have zero broken relative file paths. The test parses `[text](path)` links and checks `fs.existsSync()`.

### 4.2 Dangling ID Invariant
Every `source_id` in `knowledge/sources/` or `knowledge/tree/nodes/` must resolve to an active entry in `sources/registry.json`.

### 4.3 Dimension Invariant
Every `codex.md` file must contain headers matching all six dimensions of the 6-Dimensional Distillation Matrix.

### 4.4 Secret Invariant
No file in the repository (excluding `.git` internals) may contain high-entropy strings matching GitHub tokens or API keys.

---

## 5. Test Reporting Contract

When reporting test outcomes to the user or recording in changelogs, use the five explicit constitutional statuses:
- `VERIFIED`: Explicitly executed with zero failures.
- `PARTIALLY VERIFIED`: Executed with non-blocking warnings.
- `UNVERIFIED`: Proposed or documented without execution.
- `BLOCKED`: Prevented by missing system runtime or permissions.
- `FAILED`: Executed and failed with recorded error trace.
