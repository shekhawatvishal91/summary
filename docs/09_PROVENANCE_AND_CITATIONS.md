# 09 PROVENANCE & CITATIONS: SOURCE TRACEABILITY REQUIREMENTS

> **Document Type:** Verification & Citation Standard  
> **Status:** RATIFIED & MANDATORY  
> **Constitutional Anchor:** Article III (Provenance & Traceability)  

---

## 1. The Core Standard: Grounded Traceability

In the AI Knowledge Brain, **no claim exists in isolation**. Every fact, insight, mechanism, or quote must be anchored to an exact evidentiary origin. 

A citation is considered mathematically valid only when an external auditor can navigate directly to the specified coordinates in the primary source and locate the asserted text or data.

---

## 2. Supported Locator Types & Syntax

The system enforces standardized locator strings based on source medium:

| Medium | Locator Type | Standard Syntax | Valid Example | Invalid Example |
| :--- | :--- | :--- | :--- | :--- |
| **Book / PDF** | Page Number | `p. {N}` or `pp. {N}-{M}` | `p. 142`, `pp. 210-215` | `around page 150`, `mid-book` |
| **Video / Audio** | Timestamp Range | `[{HH:MM:SS} - {HH:MM:SS}]` | `[00:14:22 - 00:15:05]` | `approx 15 mins in` |
| **Digital Article** | Section / Paragraph | `sec: {Header} # {Para}` | `sec: Methods # para-4` | `somewhere in the middle` |
| **Code / Repo** | File & Line Range | `{path}#L{Start}-L{End}` | `src/engine.js#L45-L60` | `in the engine file` |

---

## 3. Strict Rules Against Citation Hallucination

1. **The Granularity Constraint:** If a source provides only chapter-level granularity (e.g. an unpaginated reflowable EPUB without embedded page markers), the citation must record `ch. 4`, NOT an invented page number like `p. 88`.
2. **Direct Quote Exactitude:** Direct quotes wrapped in quotation marks must match the raw source text character-for-character, preserving punctuation. If text is omitted, an explicit ellipsis `[...]` must be used.
3. **Paraphrase Demarcation:** If text is paraphrased, it must never be enclosed in quotation marks or presented as a verbatim quote. It must use the `SOURCE_STATEMENT` marker.

---

## 4. Citation Auditing Algorithm (`scripts/validate-integrity.js`)

The automated validation harness enforces:

```
For each Claim C in Knowledge Tree:
  1. Retrieve Target Source S from sources/registry.json using C.source_id
     -> IF S does not exist: THROW ERROR (Dangling Source Reference)
  2. Inspect C.locator
     -> IF C.locator does not match standard syntax regex: THROW ERROR (Malformed Locator)
  3. IF C.verbatim_quote is present:
     -> Search for exact string inside sources/text/{S.extracted_path}
     -> IF match not found: THROW WARNING (Quote Verification Mismatch)
```
