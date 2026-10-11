# 05 SOURCE INGESTION: REGISTRATION, EXTRACTION & METADATA PROTOCOL

> **Document Type:** Operational Pipeline Protocol  
> **Status:** RATIFIED & ENFORCEABLE  
> **Target Scope:** All Ingestion Pipelines (Books, YouTube, Papers, Notes)  

---

## 1. Objectives & Safety Guarantees

The Ingestion Subsystem is the gatekeeper of raw data into the AI Knowledge Brain. It guarantees:
1. **Immutability of Raw Sources:** Original source assets are preserved with cryptographic SHA-256 signatures.
2. **Structural Preservation:** Headings, chapter boundaries, page offsets, and timestamps are mapped during extraction.
3. **Resumable Batching:** Long extractions produce intermediate checkpoints to prevent lost progress.
4. **Data vs. Instruction Isolation:** Ingested texts are strictly parsed as data payloads; embedded prompt injections are completely quarantined.

---

## 2. Ingestion Lifecycle

```
[ Raw File / URL ] 
       │
       ▼
1. Pre-Flight Validation (Format, Size, Permission, Deduplication)
       │
       ▼
2. Identity Assignment & Hashing (Generate SRC-ID + Compute SHA-256)
       │
       ▼
3. Extraction to Normalized Segment Stream (Text + Page/Timestamp Locators)
       │
       ▼
4. Coverage Audit (Detect missing pages, corrupt chunks, audio cutoffs)
       │
       ▼
5. Registry Entry Creation (Register in sources/registry.json)
```

---

## 3. Standard Source Identifier (SRC-ID) Specification

Every source receives an immutable identifier formatted as:
`SRC-{MEDIUM_CODE}-{YYYY}-{SEQUENCE}`

Medium Codes:
- `BK`: Books & Monographs
- `YT`: YouTube & Video Lectures
- `RP`: Research Papers & Journals
- `MN`: Personal Markdown Notes & Obsidian Vaults
- `AR`: Web Articles & Essays

*Example:* `SRC-BK-2026-001`, `SRC-YT-2026-002`.

---

## 4. Extraction Protocols by Medium

### 4.1 Books & Long-Form Treatises (EPUB / PDF)
- **Tooling:** Node.js native text extractors (`pdfjs-dist` or uncompressed EPUB zip extractors).
- **Page Anchor Preservation:** Each text segment must preserve page boundaries:
  ```
  <!-- PAGE_ANCHOR: p. 45 -->
  ... extracted text ...
  ```
- **Table of Contents (ToC) Reconstruction:** ToC is extracted as the structural baseline for Gate 1 Coverage Audits.

### 4.2 YouTube & Audio Lectures
- **Tooling:** Transcripts extracted via YouTube Caption API, WebVTT/SRT parsers, or Whisper audio transcription.
- **Timestamp Segmentation:** Text is chunked into logical semantic segments not exceeding 120 seconds, with exact millisecond bounds:
  ```
  <!-- TIME_ANCHOR: [00:12:15 - 00:14:02] -->
  ... spoken text ...
  ```

### 4.3 Research Papers & Technical Reports
- **Abstract & Metadata Extraction:** Extract DOI, authors, institution, publication year, and peer-review status.
- **Section Demarcation:** Map explicitly to academic sections (`Abstract`, `Methodology`, `Empirical Results`, `Discussion`, `Limitations`).

### 4.4 Personal Markdown Notes
- **Frontmatter Ingestion:** Extract existing tags, aliases, and links.
- **Provenance Retention:** Retain note creation date, original author, and edit log.

---

## 5. Coverage Failure & Warning Codes

When extraction is imperfect, the pipeline registers an entry in `knowledge/sources/{source-id}/coverage_warnings.json`:

| Code | Severity | Description | Remediation |
| :--- | :--- | :--- | :--- |
| `ERR_PAGES_UNREADABLE` | HIGH | OCR failure or scanned image without text layer | Mark partial coverage, trigger manual OCR |
| `ERR_AUDIO_CUTOFF` | HIGH | Transcript truncated before lecture finishes | Halt codex generation until full audio obtained |
| `WARN_TOC_MISSING` | MEDIUM | No formal Table of Contents found in book | Reconstruct logical sections from H1/H2 headers |
| `WARN_TIMESTAMP_GAP` | MEDIUM | Missing subtitles for 15+ seconds of lecture | Note timestamp gap inline in Product A |
