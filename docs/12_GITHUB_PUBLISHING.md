# 12 GITHUB PUBLISHING PROTOCOL: ARTIFACT VALIDATION, GIT & WEBPAGE DEPLOY

> **Document Type:** Release Engineering & Publishing Standard  
> **Status:** RATIFIED & MANDATORY  
> **Target Scope:** GitHub Commits, Pushes, and GitHub Pages Deployment  

---

## 1. Prime Publishing Directive

Publishing knowledge artifacts to GitHub is a deliberate, multi-stage release process. Under the User's Non-Negotiable Directives and Constitutional Article VI:
1. **Direct Instruction Only:** No automated script or agent will push to a remote repository without explicit, direct user instructions.
2. **Zero Secret Leakage:** Access tokens, PATs, environment credentials, and internal temporary paths must never enter git commits or public repositories.
3. **Verified Publication:** An artifact is never reported as "published" merely because it was written to disk or committed locally. Publication is confirmed only when the remote commit is verified and the GitHub Pages workflow completes successfully.

---

## 2. The 10-Step Publishing Lifecycle

Every publishing cycle must execute the following ten sequential steps:

```
[ Local Markdown / Artifact Changes ]
                  │
                  ▼
1. Generate & Update Intended Markdown Files (knowledge/, web/, docs/)
                  │
                  ▼
2. Validate Structural Integrity (scripts/validate-integrity.js)
   - Verify internal relative links
   - Validate JSON schemas & node references
                  │
                  ▼
3. Scrutinize File Inclusions (Confirm only intended knowledge assets are staged)
                  │
                  ▼
4. Run Secret & Credential Scan (scripts/publish-check.js)
   - Scan for PAT tokens, API keys, private paths
                  │
                  ▼
5. Execute Test Suite (tests/run-all-tests.js)
   - Ensure 100% test pass with exit code 0
                  │
                  ▼
6. Review Local Git Diff (git diff --staged)
   - Confirm changes are minimal, precise, and expected
                  │
                  ▼
7. Create Meaningful Git Commit (git commit -m "...")
                  │
                  ▼
8. Await Direct User Authorization
   - Request explicit push command from human operator
                  │
                  ▼
9. Execute Push to Remote (git push origin main)
                  │
                  ▼
10. Verify Remote State & Webpage Deployment
   - Query GitHub API / Actions deployment status
   - Report verifiable publication outcome
```

---

## 3. GitHub Pages Web Presentation Architecture

Pushing markdown files alone does not guarantee web rendering. To ensure the knowledge artifacts are instantly viewable by the user in any browser:

1. **Web Portal Directory:** A lightweight, dependency-free web application resides in `web/` (including `index.html`, `styles.css`, `app.js`, and `manifest.json`).
2. **GitHub Pages Configuration:** 
   - Option A: GitHub Pages configured to serve directly from the `/docs` or root `/web` directory.
   - Option B: A GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) that automatically packages `web/` and `knowledge/` into the `gh-pages` branch.
3. **Client-Side Markdown Rendering:** The web application fetches markdown codices and renders them dynamically using a lightweight parser, complete with full-text search, graph exploration, and active-recall flashcard study modes.

---

## 4. Pre-Push Security Guardrails

The script `scripts/publish-check.js` scans staged git files against the following regex patterns before allowing a commit:
- GitHub PAT: `github_pat_[a-zA-Z0-9_]{82}`
- Classic GitHub Token: `ghp_[a-zA-Z0-9]{36}`
- Generic API Keys: `(api_key|secret_key|bearer)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]`
- Absolute Home Paths: `C:\\Users\\[a-zA-Z0-9_]+\\AppData`

Any match halts execution immediately with exit code `1`.
