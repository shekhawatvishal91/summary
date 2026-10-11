# 08 KNOWLEDGE MODEL: NODES, CLAIMS, EVIDENCE & GRAPH SCHEMAS

> **Document Type:** Data Modeling & Schema Specification  
> **Status:** RATIFIED & ENFORCEABLE  
> **Target Scope:** Product B — Integrated Knowledge Tree  

---

## 1. Ontological Entities Overview

Product B models human knowledge as a typed, directed, hyper-linked property graph. The graph consists of five primary primitive entity types:

```
┌──────────────────┐
│      SOURCE      │ (Immutable origin asset, e.g., SRC-BK-2026-001)
└─────────┬────────┘
          │ has_evidence
          ▼
┌──────────────────┐
│     EVIDENCE     │ (Exact text excerpt, page/timestamp locator)
└─────────┬────────┘
          │ grounds
          ▼
┌──────────────────┐
│      CLAIM       │ (Atomic proposition, empirical assertion, or protocol)
└─────────┬────────┘
          │ instantiates / defines
          ▼
┌──────────────────┐
│     CONCEPT      │ (Canonical mental model, principle, or domain term)
└─────────┬────────┘
          │ relates_to (via typed edges)
          ▼
┌──────────────────┐
│  CONCEPT / CLAIM │ (Graph neighbor)
└──────────────────┘
```

---

## 2. Canonical JSON Schemas

### 2.1 Concept Node Schema (`knowledge/tree/nodes/concept_{id}.json`)
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "node_id": "CON-NEURO-001",
  "node_type": "concept",
  "canonical_name": "Executive Function",
  "aliases": ["Cognitive Control", "Frontal Lobe Regulation", "Volitional Control"],
  "domain": "Cognitive Neuroscience",
  "definition": "The suite of top-down mental processes that enable goal-directed behavior, working memory manipulation, and inhibitory control.",
  "epistemic_tier": "tier_1",
  "associated_claims": ["CLM-001", "CLM-004"],
  "sources_contributing": ["SRC-BK-2026-001", "SRC-YT-2026-002"],
  "created_at": "2026-10-11T09:00:00Z",
  "updated_at": "2026-10-11T09:00:00Z"
}
```

### 2.2 Claim Node Schema (`knowledge/tree/nodes/claim_{id}.json`)
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "node_id": "CLM-001",
  "node_type": "claim",
  "statement": "Working memory capacity is strictly constrained to 4 plus or minus 1 chunks under active cognitive load.",
  "claim_type": "empirical_finding",
  "epistemic_tier": "tier_1",
  "evidence": [
    {
      "source_id": "SRC-BK-2026-001",
      "locator_type": "page_number",
      "locator": "p. 112",
      "verbatim_quote": "The magical number seven is an artifact; true un-chunked working memory holds approximately four items."
    }
  ],
  "associated_concept_ids": ["CON-NEURO-001"],
  "created_at": "2026-10-11T09:00:00Z"
}
```

### 2.3 Edge Schema (`knowledge/tree/edges/edges.jsonl`)
Stored as an append-only JSON Lines stream:
```json
{
  "edge_id": "EDG-001",
  "source_node_id": "CON-NEURO-001",
  "target_node_id": "CON-PSYCH-042",
  "relation_type": "extends",
  "description": "Executive function provides the physiological substrate for ego depletion models.",
  "confidence": 0.95,
  "competing_evidence": null,
  "created_at": "2026-10-11T09:00:00Z"
}
```

---

## 3. Standard Relation Types & Semantics

| Relation Type | Direction | Semantic Meaning |
| :--- | :--- | :--- |
| `supports` | Source -> Target | Source provides empirical or logical evidence strengthening Target. |
| `contradicts` | Source -> Target | Source and Target present mutually incompatible claims or empirical findings. |
| `extends` | Source -> Target | Source builds upon, refines, or generalizes Target. |
| `specializes` | Source -> Target | Source represents a concrete domain subtype of abstract Target. |
| `invalidates` | Source -> Target | Source provides methodological proof debunking Target (Tier 4 Demarcation). |
| `implements` | Source -> Target | Source is a practical behavioral protocol executing theoretical Target. |

---

## 4. Integrity Constraints

1. **No Orphan Claims:** Every claim must belong to at least one valid concept and point to at least one valid source.
2. **Referential Validity:** Every `source_id` referenced in a node or claim must exist in `sources/registry.json`.
3. **Immutability of Historical Claim IDs:** Once assigned, a `node_id` or `claim_id` is never reassigned or deleted. Deprecations mark `status: "deprecated"` with a pointer to the successor node.
