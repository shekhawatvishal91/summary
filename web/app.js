/**
 * web/app.js
 * Client-side reader & knowledge explorer for AI Knowledge Brain OS
 */

let manifestData = null;

async function loadManifest() {
  try {
    // Attempt relative manifest load
    const manifestPath = window.location.pathname.endsWith('/web/') || window.location.pathname.endsWith('/web/index.html')
      ? './manifest.json'
      : './web/manifest.json';
    
    const res = await fetch(manifestPath);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    manifestData = await res.json();
    initApp();
  } catch (err) {
    console.error('Failed to load manifest.json:', err);
    document.getElementById('status-banner').innerHTML = `
      <div style="background:#da3633; color:#fff; padding:1rem; border-radius:6px; margin-bottom:1rem;">
        <strong>Error loading knowledge manifest:</strong> ${err.message}. Ensure web/manifest.json is compiled.
      </div>
    `;
  }
}

function initApp() {
  renderMetrics();
  renderSources();
  renderConcepts();
  renderDocs();
  setupNavigation();
}

function isFixtureSource(s) {
  if (!s) return false;
  return s.is_test_fixture === true || s.source_role === 'synthetic_benchmark_fixture' || (s.raw_path && (s.raw_path.includes('test') || s.raw_path.includes('fixture')));
}

function isFixtureConcept(c) {
  if (!c || !manifestData) return false;
  const fixtureSourceIds = manifestData.sources.filter(isFixtureSource).map(s => s.source_id);
  if (Array.isArray(c.sources_contributing) && c.sources_contributing.length > 0) {
    return c.sources_contributing.every(sId => fixtureSourceIds.includes(sId));
  }
  const claims = manifestData.claims.filter(cl => cl.associated_concept_ids && cl.associated_concept_ids.includes(c.node_id));
  if (claims.length > 0) {
    return claims.every(cl => fixtureSourceIds.includes(cl.evidence[0]?.source_id));
  }
  return false;
}

function isFixtureClaim(clm) {
  if (!clm || !manifestData) return false;
  const sId = clm.evidence[0] ? clm.evidence[0].source_id : null;
  const src = manifestData.sources.find(s => s.source_id === sId);
  return isFixtureSource(src);
}

function renderMetrics() {
  if (!manifestData || !manifestData.metrics) return;
  const m = manifestData.metrics;

  const fixtureSources = manifestData.sources.filter(isFixtureSource).map(s => s.source_id);
  const fixtureSourceCount = fixtureSources.length;
  const realSourceCount = Math.max(0, (m.total_sources || 0) - fixtureSourceCount);

  const fixtureConcepts = manifestData.concepts.filter(isFixtureConcept).length;
  const realConcepts = Math.max(0, (m.total_concepts || 0) - fixtureConcepts);

  const fixtureClaims = manifestData.claims.filter(isFixtureClaim).length;
  const realClaims = Math.max(0, (m.total_claims || 0) - fixtureClaims);

  const fixtureEdges = manifestData.edges.filter(e => e.edge_id === 'EDG-001').length;
  const realEdges = Math.max(0, (m.total_edges || 0) - fixtureEdges);

  document.getElementById('metric-sources').textContent = `${realSourceCount} (Benchmark: ${fixtureSourceCount})`;
  document.getElementById('metric-concepts').textContent = `${realConcepts} (Benchmark: ${fixtureConcepts})`;
  document.getElementById('metric-claims').textContent = `${realClaims} (Benchmark: ${fixtureClaims})`;
  document.getElementById('metric-edges').textContent = `${realEdges} (Benchmark: ${fixtureEdges})`;
  document.getElementById('metric-docs').textContent = m.total_docs || 0;
  document.getElementById('last-built').textContent = new Date(manifestData.built_at).toLocaleString();
}

function renderSources(filter = '') {
  const container = document.getElementById('sources-list');
  if (!container || !manifestData) return;

  const hideFixtures = document.getElementById('hide-fixture-sources')?.checked || false;

  let sources = manifestData.sources.filter(s =>
    s.title.toLowerCase().includes(filter.toLowerCase()) ||
    s.source_id.toLowerCase().includes(filter.toLowerCase()) ||
    s.author.toLowerCase().includes(filter.toLowerCase())
  );

  if (hideFixtures) {
    sources = sources.filter(s => !isFixtureSource(s));
  }

  if (sources.length === 0) {
    container.innerHTML = '<p style="color:var(--text-secondary);">No registered sources found matching filter.</p>';
    return;
  }

  container.innerHTML = sources.map(s => {
    const isFixture = isFixtureSource(s);
    return `
      <div class="item-card" style="${isFixture ? 'border-left: 4px solid #8b949e;' : ''}">
        <div class="item-header">
          <span class="item-title">${escapeHtml(s.title)}</span>
          <div>
            ${isFixture ? '<span class="badge" style="background:#484f58; color:#e6edf3; margin-right:0.35rem;">TEST FIXTURE BENCHMARK</span>' : ''}
            <span class="badge ${s.epistemic_tier === 'tier_1' ? 'badge-tier1' : 'badge-tier2'}">${s.epistemic_tier}</span>
          </div>
        </div>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.5rem;">
          <strong>ID:</strong> <code>${s.source_id}</code> | <strong>Author:</strong> ${escapeHtml(s.author)} (${s.published_year}) | <strong>Medium:</strong> ${s.medium === 'youtube' ? 'YouTube Video' : escapeHtml(s.medium)}
        </p>
        ${isFixture ? `
          <p style="font-size:0.8rem; color:#8b949e; margin-bottom:0.5rem; font-style:italic;">
            Note: This entry is an automated regression test fixture used to verify pipeline integrity, not a live user source.
          </p>
        ` : ''}
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.75rem;">
          <strong>Decoding Status:</strong> <span class="badge badge-scaffolded">${s.decoding_status}</span>
        </p>
        <div style="display:flex; gap:0.5rem;">
          <button onclick="viewCodex('${s.source_id}')" style="background:var(--accent-color); border:none; color:#0f141c; padding:0.4rem 0.8rem; border-radius:4px; font-weight:600; cursor:pointer;">
            Read Codex
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderConcepts(filter = '') {
  const container = document.getElementById('concepts-list');
  if (!container || !manifestData) return;

  const hideFixtures = document.getElementById('hide-fixture-concepts')?.checked || false;

  let concepts = manifestData.concepts.filter(c =>
    c.canonical_name.toLowerCase().includes(filter.toLowerCase()) ||
    (c.aliases && c.aliases.some(a => a.toLowerCase().includes(filter.toLowerCase()))) ||
    (c.definition && c.definition.toLowerCase().includes(filter.toLowerCase()))
  );

  if (hideFixtures) {
    concepts = concepts.filter(c => !isFixtureConcept(c));
  }

  if (concepts.length === 0) {
    container.innerHTML = '<p style="color:var(--text-secondary);">No concepts found matching filter.</p>';
    return;
  }

  container.innerHTML = concepts.map(c => {
    const isFixture = isFixtureConcept(c);
    // Find associated claims
    const claims = manifestData.claims.filter(cl =>
      cl.associated_concept_ids && cl.associated_concept_ids.includes(c.node_id)
    );
    // Find edges
    const edges = manifestData.edges.filter(e =>
      e.source_node_id === c.node_id || e.target_node_id === c.node_id
    );

    return `
      <div class="item-card" style="${isFixture ? 'border-left: 4px solid #8b949e;' : ''}">
        <div class="item-header">
          <span class="item-title">${escapeHtml(c.canonical_name)}</span>
          <div>
            ${isFixture ? '<span class="badge" style="background:#484f58; color:#e6edf3; margin-right:0.35rem;">TEST FIXTURE BENCHMARK</span>' : ''}
            <span class="badge badge-tier1"><code>${c.node_id}</code></span>
          </div>
        </div>
        <p style="font-size:0.9rem; margin-bottom:0.5rem;">
          ${escapeHtml(c.definition || 'No canonical definition recorded.')}
        </p>
        ${isFixture ? `
          <p style="font-size:0.8rem; color:#8b949e; margin-bottom:0.5rem; font-style:italic;">
            Note: This concept is derived from an automated regression test fixture for OS pipeline verification, not empirical scientific consensus.
          </p>
        ` : ''}
        ${c.aliases && c.aliases.length > 0 ? `
          <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.5rem;">
            <strong>Aliases:</strong> ${c.aliases.map(a => `<code>${escapeHtml(a)}</code>`).join(', ')}
          </p>
        ` : ''}
        ${claims.length > 0 ? `
          <div style="background:var(--bg-primary); padding:0.75rem; border-radius:6px; margin-top:0.75rem;">
            <strong style="font-size:0.85rem; color:var(--accent-color);">Anchored Claims (${claims.length}):</strong>
            <ul style="margin-left:1.25rem; font-size:0.85rem; margin-top:0.25rem;">
              ${claims.map(clm => {
                const claimFixture = isFixtureClaim(clm);
                return `
                <li style="margin-bottom:0.35rem;">
                  ${claimFixture ? '<span class="badge" style="background:#484f58; color:#e6edf3; font-size:0.75rem; padding:0.1rem 0.4rem; margin-right:0.35rem;">BENCHMARK CLAIM</span>' : ''}"${escapeHtml(clm.statement)}"
                  <br><span style="color:var(--text-muted); font-size:0.8rem;">
                    Locator: <code>${clm.evidence[0] ? clm.evidence[0].locator : 'n/a'}</code> (Source: <code>${clm.evidence[0] ? clm.evidence[0].source_id : 'n/a'}</code>${claimFixture ? ' <em>[Synthetic Fixture]</em>' : ''})
                  </span>
                </li>
              `;
              }).join('')}
            </ul>
          </div>
        ` : ''}
        ${edges.length > 0 ? `
          <div style="margin-top:0.5rem; font-size:0.85rem; color:var(--text-secondary);">
            <strong>Graph Relations:</strong>
            ${edges.map(e => `
              <span class="badge badge-tier2" style="margin-right:0.25rem;">
                ${e.source_node_id === c.node_id ? `-[${e.relation_type}]-> ${e.target_node_id}` : `<-[${e.relation_type}]- ${e.source_node_id}`}
              </span>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function renderDocs() {
  const container = document.getElementById('docs-list');
  if (!container || !manifestData) return;

  container.innerHTML = manifestData.documentation.map(d => `
    <div class="item-card">
      <div class="item-header">
        <span class="item-title">${escapeHtml(d.title)}</span>
        <code>${d.filename}</code>
      </div>
      <p style="font-size:0.85rem; color:var(--text-secondary);">
        <a href="../${d.path}" target="_blank" style="color:var(--accent-color); text-decoration:none;">
          View Markdown Source &rarr;
        </a>
      </p>
    </div>
  `).join('');
}

function viewCodex(sourceId) {
  const source = manifestData.sources.find(s => s.source_id === sourceId);
  if (!source) return;

  const isFixture = isFixtureSource(source);

  switchTab('codex-reader');
  document.getElementById('codex-title').textContent = source.title;
  document.getElementById('codex-meta').innerHTML = `
    <strong>ID:</strong> <code>${source.source_id}</code> | <strong>Author:</strong> ${escapeHtml(source.author)} |
    <strong>Tier:</strong> ${source.epistemic_tier} | <strong>Status:</strong> ${source.decoding_status}
    ${isFixture ? '<span class="badge" style="background:#484f58; color:#e6edf3; margin-left:0.5rem;">TEST FIXTURE BENCHMARK</span>' : ''}
  `;

  // Fetch codex markdown text
  const codexUrl = `../knowledge/sources/${sourceId}/codex.md`;
  fetch(codexUrl)
    .then(r => r.text())
    .then(txt => {
      const banner = isFixture ? `> [!WARNING]
> **TEST FIXTURE BENCHMARK ADVISORY**
> This analytical codex is generated from an automated regression test fixture for OS pipeline verification.
> Its claims, mechanisms, and models are synthetic test artifacts, not verified scientific literature.

` : '';
      document.getElementById('codex-content').textContent = banner + txt;
    })
    .catch(err => {
      document.getElementById('codex-content').textContent = `Failed to fetch codex at ${codexUrl}: ${err.message}`;
    });
}

function setupNavigation() {
  document.querySelectorAll('nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.getAttribute('data-view');
      switchTab(targetView);
    });
  });

  const sourceSearch = document.getElementById('source-search');
  if (sourceSearch) {
    sourceSearch.addEventListener('input', e => renderSources(e.target.value));
  }
  const hideFixtureSources = document.getElementById('hide-fixture-sources');
  if (hideFixtureSources) {
    hideFixtureSources.addEventListener('change', () => renderSources(sourceSearch ? sourceSearch.value : ''));
  }

  const conceptSearch = document.getElementById('concept-search');
  if (conceptSearch) {
    conceptSearch.addEventListener('input', e => renderConcepts(e.target.value));
  }
  const hideFixtureConcepts = document.getElementById('hide-fixture-concepts');
  if (hideFixtureConcepts) {
    hideFixtureConcepts.addEventListener('change', () => renderConcepts(conceptSearch ? conceptSearch.value : ''));
  }
}

function switchTab(viewId) {
  document.querySelectorAll('nav button').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-view') === viewId);
  });
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.toggle('active', sec.id === viewId);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[m]);
}

window.addEventListener('DOMContentLoaded', loadManifest);
