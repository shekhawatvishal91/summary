# 14 SKILLS & TOOLING: CAPABILITIES, INTEGRATION DECISIONS & AUDIT

> **Document Type:** Tooling Assessment & Environment Capability Specification  
> **Status:** RATIFIED & AUDITED  
> **Target Scope:** Antigravity Skills, MCP Tools, System Runtimes  

---

## 1. Environment Runtime Inventory (Audited)

Before proposing any integration, the local execution environment was empirically audited:

| Tool / Runtime | Location | Version | Status | Operational Capability |
| :--- | :--- | :--- | :--- | :--- |
| **Node.js** | `C:\Program Files\nodejs\node.exe` | `v24.18.0` | `VERIFIED` | Full JavaScript runtime; can run scripts, parsers, test runners, local HTTP servers. |
| **NPM** | `C:\Program Files\nodejs\npm.ps1` | `11.18.0` | `VERIFIED` | Package installer available for Node modules. |
| **Git** | `C:\Program Files\Git\cmd\git.exe` | `2.55.0` | `VERIFIED` | Full VCS CLI available for branching, committing, diffing, remoting. |
| **Python** | MS App Execution Alias stub | None | `BLOCKED` | Native Python is missing. Python-based packages cannot be executed directly without Python installation. |

---

## 2. Agent Skills Inventory (Audited)

The following skills are installed and verified in the agent configuration:

### 2.1 `book-distillation-framework` (`C:\Users\visha\.gemini\config\skills\book-distillation-framework\SKILL.md`)
- **Status:** `VERIFIED & ADOPTED`
- **Problem Solved:** Provides the Golden Test of Total Replacement and the 6-Dimensional Distillation Matrix for book decoding.
- **Decision:** Adopted as the primary decoding standard for Product A (Codex Engine).

### 2.2 `claude-style-writing` (`C:\Users\visha\.gemini\config\skills\claude-style-writing\SKILL.md`)
- **Status:** `VERIFIED & ADOPTED`
- **Problem Solved:** Enforces high signal-to-noise ratio, intellectual honesty, structural elegance, and zero corporate preamble.
- **Decision:** Adopted as the core editorial tone standard for all documentation and codices.

---

## 3. Required Pipeline Capabilities & Tooling Decisions

To fulfill the mission without unnecessary dependencies or unverified external packages, the following tooling strategy is adopted:

### 3.1 PDF & Document Extraction
- **Problem Solved:** Extracting text and preserving chapter/page layout from EPUB/PDF.
- **Existing Capability:** Standard file reading tools (`view_file`), native Node.js text processing.
- **Proposed Node Tool:** Lightweight native PDF text reader script using `pdfjs-dist` or uncompressed EPUB parser in Node.js.
- **Fallback:** Reading extracted text or markdown chapters directly via built-in workspace tools.

### 3.2 YouTube Transcripts & Metadata
- **Problem Solved:** Ingesting video timestamps, captions, and slide descriptions.
- **Existing Capability:** Web content retrieval (`read_url_content`), YouTube web caption API via HTTPS fetch.
- **Trustworthiness:** Official YouTube web endpoints via standard HTTPS. No third-party binary downloads required.

### 3.3 Knowledge Graph Operations
- **Problem Solved:** Graph node creation, edge linking, cycle detection, query traversal.
- **Architectural Decision:** Implemented as zero-dependency plain JSON/JSONL files (`knowledge/tree/nodes/`, `knowledge/tree/edges/`).
- **Rationale:** Avoids heavyweight graph databases (Neo4j, Memgraph) that introduce system daemon dependencies. Plain JSON is Git-diffable, highly portable, and resilient.

### 3.4 Automated Testing & Validation Harness
- **Problem Solved:** Regression testing, broken link detection, schema validation, secret scanning.
- **Implementation:** Native Node.js test script `tests/run-all-tests.js`. Zero external dependencies needed; uses built-in `node:fs`, `node:path`, `node:assert`.

### 3.5 Web Presentation Engine
- **Problem Solved:** Visual interactive exploration on GitHub Pages.
- **Implementation:** Standalone static web application in `web/` using vanilla HTML5, CSS3, and modern JavaScript. Requires no node build server on GitHub Pages; works out-of-the-box via GitHub Pages static hosting.
