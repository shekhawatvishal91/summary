# 04 TARGET ARCHITECTURE: SYSTEM COMPONENTS & DATA PIPELINES

> **Document Type:** Systems Engineering & Architecture Specification  
> **Status:** RATIFIED & BINDING  
> **Target Scope:** AI Knowledge Brain Operating System  

---

## 1. Architectural Philosophy

The **AI Knowledge Brain OS** is built on four core architectural tenets:
1. **File-Over-App Substrate:** All knowledge is stored as durable, human-readable Markdown files and plain JSON records. No opaque binary blobs or proprietary database locks.
2. **Dual-Product Invariance:** Product A (Source Reconstruction) and Product B (Integrated Tree) are preserved as distinct, synchronized directories.
3. **Static-First Web Interface:** The web presentation engine compiles Markdown into a responsive, zero-runtime, static single-page application (SPA) capable of running seamlessly on GitHub Pages.
4. **Node.js-Driven Local Runtime:** Taking advantage of the verified local Node.js v24 environment, all CLI tools, parsers, and validation suites are implemented in lightweight vanilla Node.js scripts with zero unnecessary external dependencies.

---

## 2. Global Repository Layout

The filesystem inside `c:\Users\visha\OneDrive\Documents\Summary` is strictly structured as follows:

```
summary/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml          # Automated GitHub Pages build & deploy
├── .gitignore                        # Strict secret, temp, and build exclusions
├── README.md                         # Public portal overview & navigation
├── AGENTS.md                         # System operational instructions for AI agents
├── docs/                             # The authoritative 18-volume documentation pack
│   ├── 00_MASTER_DIRECTIVE.md
│   ├── ...
│   └── 17_CHANGELOG.md
├── sources/                          # Raw and normalized source storage
│   ├── registry.json                 # Master inventory of all ingested sources
│   ├── raw/                          # Original binary/text files (immutable)
│   └── text/                         # Extracted plain text & cleaned transcripts
├── knowledge/                        # The dual-product knowledge store
│   ├── sources/                      # PRODUCT A: Source-specific codices
│   │   └── {source-id}/
│   │       ├── codex.md              # Exhaustive reconstruction (Golden Test)
│   │       ├── meta.json             # Source metadata & extraction audit
│   │       └── cards.json            # Active recall causal flashcards
│   ├── tree/                         # PRODUCT B: Integrated Knowledge Tree
│   │   ├── nodes/                    # Canonical concept & claim records (.json)
│   │   ├── edges/                    # Directed semantic relationships
│   │   │   └── edges.jsonl           # Append-only relationship ledger
│   │   └── aliases.json              # Terminology mapping dictionary
│   └── master/                       # Synthesized cross-source master notes (.md)
├── web/                              # The public web interface (GitHub Pages)
│   ├── index.html                    # Responsive, zero-dependency reader portal
│   ├── styles.css                    # Clean, high-legibility typographic styling
│   ├── app.js                        # Client-side graph explorer & codex reader
│   └── manifest.json                 # Search index & knowledge catalog
├── scripts/                          # Operational CLI utilities (Node.js)
│   ├── validate-integrity.js         # Comprehensive audit & schema validation
│   ├── build-search-index.js         # Generates web/manifest.json from knowledge/
│   ├── ingest-source.js              # Standardized ingestion pipeline runner
│   └── publish-check.js              # Pre-commit & pre-push security scanner
└── tests/                            # Automated quality assurance harness
    ├── fixtures/                     # Test sources (sample book, video transcript)
    └── run-all-tests.js              # Regression test suite runner
```

---

## 3. End-to-End Data Flow Pipeline

```
[ Ingested Resource ] (PDF, YouTube URL, Markdown, Paper)
         │
         ▼
[ Stage 1: Extraction & Hashing ] (scripts/ingest-source.js)
         ├─ Assign Source ID (e.g., SRC-2026-001)
         ├─ Compute SHA-256 Checksum
         ├─ Extract Raw Text + Locators (pages/timestamps)
         └─ Register entry in sources/registry.json
         │
         ▼
[ Stage 2: Product A Generation (Codex Engine) ]
         ├─ Apply 6-Dimensional Distillation Matrix
         ├─ Conduct Golden Test of Total Replacement
         ├─ Generate Active Recall Flashcards
         └─ Write knowledge/sources/{source-id}/codex.md
         │
         ▼
[ Stage 3: Product B Knowledge Extraction ]
         ├─ Extract Canonical Concepts, Claims, Principles
         ├─ Match against tree/aliases.json
         ├─ Detect Contradictions & Complementary Evidence
         └─ Write nodes to tree/nodes/ and edges to tree/edges/edges.jsonl
         │
         ▼
[ Stage 4: Synthesis & Indexing ] (scripts/build-search-index.js)
         ├─ Update Cross-Source Master Notes in knowledge/master/
         ├─ Compile full-text search index into web/manifest.json
         └─ Validate internal links and anchor integrity
         │
         ▼
[ Stage 5: Quality Assurance & Gate Check ] (scripts/validate-integrity.js)
         ├─ Article I-VI Constitutional Checks
         ├─ Zero Broken Links
         └─ Zero Secret / Token Exposure
         │
         ▼
[ Stage 6: Controlled Publication ] (Git Commit -> Direct User Auth -> Push)
         └─ Deploys to GitHub Pages (https://shekhawatvishal91.github.io/summary/)
```

---

## 4. Component Interface Contracts

### 4.1 Ingestion Contract (`sources/registry.json`)
Every source entry must conform to:
```json
{
  "source_id": "SRC-YYYY-NNN",
  "title": "string",
  "author": "string",
  "published_year": 2026,
  "medium": "book | youtube | paper | notes | article",
  "epistemic_tier": "tier_1 | tier_2 | tier_3 | tier_4",
  "sha256": "hex-string",
  "raw_path": "sources/raw/filename.ext",
  "extracted_path": "sources/text/filename.txt",
  "locator_type": "page_number | timestamp | paragraph",
  "coverage_status": "complete | partial | failed",
  "created_at": "ISO-8601"
}
```

### 4.2 Product A Codex Contract (`knowledge/sources/{source-id}/codex.md`)
Must feature frontmatter YAML + mandatory 6 dimensions:
1. Plain-Language Premise & "What Everyone Gets Wrong" Paradigm Shift
2. Foundational Causal / Theoretical Model (Zero raw LaTeX equations)
3. The Concrete Master Analogy
4. Diagnostic Nuances, Typologies & Edge Cases
5. Field Protocols & Verbatim Behavioral Scripts
6. Skeptic Auditor's Demarcation Box

### 4.3 Product B Knowledge Node Contract (`knowledge/tree/nodes/{node-id}.json`)
```json
{
  "node_id": "NODE-XXX-NNN",
  "canonical_name": "string",
  "aliases": ["string"],
  "domain": "string",
  "definition": "string",
  "epistemic_tier": "tier_1 | tier_2 | tier_3 | tier_4",
  "primary_claims": [
    {
      "claim_id": "CLM-001",
      "statement": "string",
      "source_id": "SRC-YYYY-NNN",
      "locator": "p. 142 | 00:15:30",
      "claim_type": "empirical | theoretical | protocol | caution"
    }
  ],
  "updated_at": "ISO-8601"
}
```
