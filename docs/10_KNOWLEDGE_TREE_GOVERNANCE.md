# 10 KNOWLEDGE TREE GOVERNANCE: CANONICALIZATION, CONFLICT & REVIEW

> **Document Type:** Graph Governance & Curatorial Protocol  
> **Status:** RATIFIED & BINDING  
> **Constitutional Anchor:** Article IV (Knowledge Integration)  

---

## 1. Prime Curatorial Principle: Intellectual Preservation

The Knowledge Tree does not seek false harmony. When two seminal authors disagree on the etiology of a disorder, economic mechanisms, or physical laws, the Tree must not force an arbitrary compromise. 

Instead, the Tree captures the dialectical dispute, maps the respective evidence bases, and maintains the integrity of both positions.

---

## 2. Concept Canonicalization Protocol

To avoid graph fragmentation, concept nodes undergo rigorous canonicalization:

```
[ New Candidate Concept C ]
             │
             ▼
1. Alias Lookup in knowledge/tree/aliases.json
   ├─ Match Found? -> Attach claim to Existing Node & add alias if needed.
   └─ No Match? -> Proceed to Step 2.
             │
             ▼
2. Semantic Demarcation Analysis
   ├─ Is C genuinely a distinct intellectual entity? -> Create New Concept Node.
   └─ Is C merely a synonymous rephrasing? -> Add alias to Canonical Node.
             │
             ▼
3. Update aliases.json & Registry
```

### The Anti-Premature Merge Invariant
Under Article IV, embedding vector proximity (e.g., cosine distance > 0.88) **is strictly insufficient** to warrant merging nodes. A merge is executed only when the definitions are ontologically identical in domain function.

---

## 3. Dialectical Conflict Resolution Protocol

When a new claim contradicts an existing claim in the tree:

1. **Do Not Overwrite:** The existing claim is preserved in its entirety.
2. **Create a `contradicts` Edge:** An explicit edge is generated in `knowledge/tree/edges/edges.jsonl`:
   ```json
   {
     "edge_id": "EDG-DISPUTE-042",
     "source_node_id": "CLM-NEW-012",
     "target_node_id": "CLM-EXISTING-008",
     "relation_type": "contradicts",
     "description": "Source B challenges the metabolic hypothesis of Source A with randomized trial data.",
     "dispute_details": {
       "nature_of_disagreement": "Empirical replication failure",
       "source_a_method": "Observational cohort (n=120)",
       "source_b_method": "Double-blind RCT (n=1500)"
     }
   }
   ```
3. **Generate a Master Synthesis Callout:** Highlight the dispute in the cross-source master note (`knowledge/master/`).

---

## 4. The Review Queue (`knowledge/tree/review_queue.json`)

Changes that carry high epistemic risk are not merged automatically. They are routed to the review queue:

- Candidate merges between concepts across disparate academic fields.
- Claims flagged as Tier 4 (Pseudoscience) attempting to connect as Tier 1.
- Contradictions touching core foundational axioms.

The queue is maintained as a clean JSON ledger requiring human sign-off before graph mutation.
