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

function renderMetrics() {
  if (!manifestData || !manifestData.metrics) return;
  const m = manifestData.metrics;
  document.getElementById('metric-sources').textContent = m.total_sources || 0;
  document.getElementById('metric-concepts').textContent = m.total_concepts || 0;
  document.getElementById('metric-claims').textContent = m.total_claims || 0;
  document.getElementById('metric-edges').textContent = m.total_edges || 0;
  document.getElementById('metric-docs').textContent = m.total_docs || 0;
  document.getElementById('last-built').textContent = new Date(manifestData.built_at).toLocaleString();
}

function renderSources(filter = '') {
  const container = document.getElementById('sources-list');
  if (!container || !manifestData) return;

  const sources = manifestData.sources.filter(s =>
    s.title.toLowerCase().includes(filter.toLowerCase()) ||
    s.source_id.toLowerCase().includes(filter.toLowerCase()) ||
    s.author.toLowerCase().includes(filter.toLowerCase())
  );

  if (sources.length === 0) {
    container.innerHTML = '<p style="color:var(--text-secondary);">No registered sources found matching filter.</p>';
    return;
  }

  container.innerHTML = sources.map(s => `
    <div class="item-card">
      <div class="item-header">
        <span class="item-title">${escapeHtml(s.title)}</span>
        <span class="badge ${s.epistemic_tier === 'tier_1' ? 'badge-tier1' : 'badge-tier2'}">${s.epistemic_tier}</span>
      </div>
      <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.5rem;">
        <strong>ID:</strong> <code>${s.source_id}</code> | <strong>Author:</strong> ${escapeHtml(s.author)} (${s.published_year}) | <strong>Medium:</strong> ${s.medium}
      </p>
      <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.75rem;">
        <strong>Status:</strong> <span class="badge badge-scaffolded">${s.decoding_status}</span>
      </p>
      <div style="display:flex; gap:0.5rem;">
        <button onclick="viewCodex('${s.source_id}')" style="background:var(--accent-color); border:none; color:#0f141c; padding:0.4rem 0.8rem; border-radius:4px; font-weight:600; cursor:pointer;">
          Read Codex
        </button>
      </div>
    </div>
  `).join('');
}

function renderConcepts(filter = '') {
  const container = document.getElementById('concepts-list');
  if (!container || !manifestData) return;

  const concepts = manifestData.concepts.filter(c =>
    c.canonical_name.toLowerCase().includes(filter.toLowerCase()) ||
    (c.aliases && c.aliases.some(a => a.toLowerCase().includes(filter.toLowerCase()))) ||
    (c.definition && c.definition.toLowerCase().includes(filter.toLowerCase()))
  );

  if (concepts.length === 0) {
    container.innerHTML = '<p style="color:var(--text-secondary);">No concepts found matching filter.</p>';
    return;
  }

  container.innerHTML = concepts.map(c => {
    // Find associated claims
    const claims = manifestData.claims.filter(cl =>
      cl.associated_concept_ids && cl.associated_concept_ids.includes(c.node_id)
    );
    // Find edges
    const edges = manifestData.edges.filter(e =>
      e.source_node_id === c.node_id || e.target_node_id === c.node_id
    );

    return `
      <div class="item-card">
        <div class="item-header">
          <span class="item-title">${escapeHtml(c.canonical_name)}</span>
          <span class="badge badge-tier1"><code>${c.node_id}</code></span>
        </div>
        <p style="font-size:0.9rem; margin-bottom:0.5rem;">
          ${escapeHtml(c.definition || 'No canonical definition recorded.')}
        </p>
        ${c.aliases && c.aliases.length > 0 ? `
          <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.5rem;">
            <strong>Aliases:</strong> ${c.aliases.map(a => `<code>${escapeHtml(a)}</code>`).join(', ')}
          </p>
        ` : ''}
        ${claims.length > 0 ? `
          <div style="background:var(--bg-primary); padding:0.75rem; border-radius:6px; margin-top:0.75rem;">
            <strong style="font-size:0.85rem; color:var(--accent-color);">Anchored Claims (${claims.length}):</strong>
            <ul style="margin-left:1.25rem; font-size:0.85rem; margin-top:0.25rem;">
              ${claims.map(clm => `
                <li style="margin-bottom:0.25rem;">
                  "${escapeHtml(clm.statement)}"
                  <br><span style="color:var(--text-muted); font-size:0.8rem;">
                    Locator: <code>${clm.evidence[0] ? clm.evidence[0].locator : 'n/a'}</code> (Source: <code>${clm.evidence[0] ? clm.evidence[0].source_id : 'n/a'}</code>)
                  </span>
                </li>
              `).join('')}
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

  switchTab('codex-reader');
  document.getElementById('codex-title').textContent = source.title;
  document.getElementById('codex-meta').innerHTML = `
    <strong>ID:</strong> <code>${source.source_id}</code> | <strong>Author:</strong> ${source.author} |
    <strong>Tier:</strong> ${source.epistemic_tier} | <strong>Status:</strong> ${source.decoding_status}
  `;

  // Fetch codex markdown text
  const codexUrl = `../knowledge/sources/${sourceId}/codex.md`;
  fetch(codexUrl)
    .then(r => r.text())
    .then(txt => {
      document.getElementById('codex-content').textContent = txt;
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

  const conceptSearch = document.getElementById('concept-search');
  if (conceptSearch) {
    conceptSearch.addEventListener('input', e => renderConcepts(e.target.value));
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
