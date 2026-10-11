# 15 FAILURE RECOVERY & MAINTENANCE: RESUMABILITY, BACKUPS & INTEGRITY

> **Document Type:** Reliability & Operations Manual  
> **Status:** RATIFIED & BINDING  
> **Target Scope:** System Failure Modes, Recovery Protocols, and Long-Term Operations  

---

## 1. Prime Directive of Fault Tolerance

No partial, interrupted, or crashed operation may leave the AI Knowledge Brain in an indeterminate or corrupt state. 

If a 500-page book extraction terminates at page 320, the system must either cleanly resume from page 321 or safely roll back to the pre-job state. It must **never** present an incomplete artifact as finished.

---

## 2. Checkpoint & Resumability Architecture

Long-running pipelines maintain durable state on disk in `sources/checkpoints/{job_id}.json`:

```json
{
  "job_id": "JOB-20261011-001",
  "source_id": "SRC-BK-2026-001",
  "pipeline_stage": "STAGE_2_EXTRACTION",
  "total_units": 18,
  "completed_units": 11,
  "last_successful_unit": "Chapter 11",
  "status": "PAUSED",
  "error_log": null,
  "updated_at": "2026-10-11T09:20:00Z"
}
```

### Resume Protocol:
1. On pipeline startup, check for existing checkpoints in `sources/checkpoints/`.
2. Verify integrity of completed units against SHA-256 hashes.
3. Resume execution strictly from `last_successful_unit + 1`.
4. Upon full completion and validation, archive checkpoint to `sources/checkpoints/history/`.

---

## 3. Failure Mode Matrix & Automated Remediation

| Failure Mode | Symptoms | Automated Remediation | Escalation Threshold |
| :--- | :--- | :--- | :--- |
| **Extraction Timeout** | Pipeline hangs on dense PDF/video | Split chunk size into 50% intervals, retry once | 2 consecutive timeouts -> mark `ERR_EXTRACTION_TIMEOUT` |
| **Broken Link Introduced** | Relative link in Markdown points to missing file | Validation script catches error prior to commit | Immediate commit halt (exit code 1) |
| **Dangling Graph Node** | Claim references nonexistent source ID | Validation harness detects missing registry key | Quarantine node in `knowledge/tree/quarantine/` |
| **Git Push Network Drop** | Connection drops during remote sync | Retain local commit intact; retry push when online | Report exact network error, never force-push |
| **Secret Detection Trigger** | PAT or API key detected in staged diff | `scripts/publish-check.js` aborts commit immediately | Zero tolerance: commit blocked, audit alert logged |

---

## 4. Disaster Recovery & Snapshot Backups

1. **Git as Canonical Ledger:** Because all knowledge is stored in plain Markdown and JSON, the local Git repository acts as a complete, versioned snapshot.
2. **Local Snapshots:** Before major structural migrations, an uncommitted backup snapshot of `knowledge/` and `sources/registry.json` is archived in `backups/snapshot-{timestamp}.tar.gz` (excluded from git).
3. **One-Command Rollback:** If a bad migration or corruption occurs:
   ```bash
   git reset --hard HEAD
   ```
