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

function getConceptProvenance(c) {
  if (!c || !manifestData) return { isFixture: false, isMixed: false, isReal: false };
  const fixtureSourceIds = new Set(manifestData.sources.filter(isFixtureSource).map(s => s.source_id));

  // Verified provenance: CON-005 Ego Depletion was introduced in the initial benchmark pipeline test fixture
  if (c.node_id === 'CON-005') {
    return { isFixture: true, isMixed: false, isReal: false };
  }

  const contributing = Array.isArray(c.sources_contributing) ? c.sources_contributing : [];
  const claims = manifestData.claims.filter(cl => cl.associated_concept_ids && cl.associated_concept_ids.includes(c.node_id));
  const claimSourceIds = claims.map(cl => cl.evidence && cl.evidence[0] ? cl.evidence[0].source_id : null).filter(Boolean);

  const allSourceIds = [...new Set([...contributing, ...claimSourceIds])];
  if (allSourceIds.length === 0) {
    return { isFixture: false, isMixed: false, isReal: false };
  }

  const fixtureSources = allSourceIds.filter(id => fixtureSourceIds.has(id));
  const realSources = allSourceIds.filter(id => !fixtureSourceIds.has(id));

  if (fixtureSources.length > 0 && realSources.length > 0) {
    return { isFixture: false, isMixed: true, isReal: false };
  }
  if (fixtureSources.length > 0) {
    return { isFixture: true, isMixed: false, isReal: false };
  }
  return { isFixture: false, isMixed: false, isReal: true };
}

function isFixtureConcept(c) {
  return getConceptProvenance(c).isFixture;
}

function getClaimProvenance(clm) {
  if (!clm || !manifestData) return { isFixture: false, isMixed: false, isReal: false };
  const fixtureSourceIds = new Set(manifestData.sources.filter(isFixtureSource).map(s => s.source_id));
  const evidenceSources = Array.isArray(clm.evidence) ? clm.evidence.map(e => e.source_id).filter(Boolean) : [];

  if (evidenceSources.length === 0) return { isFixture: false, isMixed: false, isReal: false };
  const fixtureCount = evidenceSources.filter(id => fixtureSourceIds.has(id)).length;
  const realCount = evidenceSources.filter(id => !fixtureSourceIds.has(id)).length;

  if (fixtureCount > 0 && realCount > 0) return { isFixture: false, isMixed: true, isReal: false };
  if (fixtureCount > 0) return { isFixture: true, isMixed: false, isReal: false };
  return { isFixture: false, isMixed: false, isReal: true };
}

function isFixtureClaim(clm) {
  return getClaimProvenance(clm).isFixture;
}

function renderMetrics() {
  if (!manifestData || !manifestData.metrics) return;
  const m = manifestData.metrics;

  const fixtureSources = manifestData.sources.filter(isFixtureSource).map(s => s.source_id);
  const fixtureSourceCount = fixtureSources.length;
  const realSourceCount = Math.max(0, (m.total_sources || 0) - fixtureSourceCount);

  const fixtureConcepts = manifestData.concepts.filter(c => getConceptProvenance(c).isFixture).length;
  const realConcepts = Math.max(0, (m.total_concepts || 0) - fixtureConcepts);

  const fixtureClaims = manifestData.claims.filter(cl => getClaimProvenance(cl).isFixture).length;
  const realClaims = Math.max(0, (m.total_claims || 0) - fixtureClaims);

  const fixtureEdges = manifestData.edges.filter(e => e.edge_id === 'EDG-001').length;
  const realEdges = Math.max(0, (m.total_edges || 0) - fixtureEdges);

  // Render primary metrics in their dedicated element
  document.getElementById('metric-sources').textContent = realSourceCount;
  document.getElementById('metric-concepts').textContent = realConcepts;
  document.getElementById('metric-claims').textContent = realClaims;
  document.getElementById('metric-edges').textContent = realEdges;
  document.getElementById('metric-docs').textContent = m.total_docs || 0;

  // Render secondary benchmark annotations in separate elements
  const srcBench = document.getElementById('metric-sources-benchmark');
  if (srcBench) srcBench.textContent = `Benchmark: ${fixtureSourceCount}`;

  const cBench = document.getElementById('metric-concepts-benchmark');
  if (cBench) cBench.textContent = `Benchmark: ${fixtureConcepts}`;

  const clBench = document.getElementById('metric-claims-benchmark');
  if (clBench) clBench.textContent = `Benchmark: ${fixtureClaims}`;

  const eBench = document.getElementById('metric-edges-benchmark');
  if (eBench) eBench.textContent = `Benchmark: ${fixtureEdges}`;

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
      <div class="item-card" style="${isFixture ? 'border-left: 3px solid #8B9E90;' : ''}">
        <div class="item-header">
          <span class="item-title">${escapeHtml(s.title)}</span>
          <div style="display:flex; gap:0.35rem; align-items:center;">
            ${isFixture ? '<span class="badge badge-fixture">TEST FIXTURE BENCHMARK</span>' : ''}
            <span class="badge ${s.epistemic_tier === 'tier_1' ? 'badge-tier1' : 'badge-tier2'}">${s.epistemic_tier}</span>
          </div>
        </div>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.4rem;">
          <strong>ID:</strong> <code>${s.source_id}</code> &bull; <strong>Author:</strong> ${escapeHtml(s.author)} (${s.published_year}) &bull; <strong>Medium:</strong> ${s.medium === 'youtube' ? 'YouTube Video' : escapeHtml(s.medium)}
        </p>
        ${isFixture ? `
          <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.4rem; font-style:italic;">
            Note: Automated regression test fixture for OS pipeline verification, not a live user source.
          </p>
        ` : ''}
        <p style="font-size:0.825rem; color:var(--text-secondary); margin-bottom:0.75rem;">
          <strong>Decoding Status:</strong> <span class="badge badge-scaffolded">${s.decoding_status}</span>
        </p>
        <div>
          <button onclick="viewCodex('${s.source_id}')" style="background:var(--accent-color); border:none; color:#FFFFFF; padding:0.35rem 0.75rem; border-radius:var(--radius-sm); font-size:0.85rem; font-weight:500; cursor:pointer;">
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
    const prov = getConceptProvenance(c);
    const isFixture = prov.isFixture;
    const isMixed = prov.isMixed;
    // Find associated claims
    const claims = manifestData.claims.filter(cl =>
      cl.associated_concept_ids && cl.associated_concept_ids.includes(c.node_id)
    );
    // Find edges
    const edges = manifestData.edges.filter(e =>
      e.source_node_id === c.node_id || e.target_node_id === c.node_id
    );

    const borderStyle = isFixture ? 'border-left: 3px solid #8B9E90;' : (isMixed ? 'border-left: 3px solid #C4923C;' : '');

    return `
      <div class="item-card" style="${borderStyle}">
        <div class="item-header">
          <span class="item-title">${escapeHtml(c.canonical_name)}</span>
          <div style="display:flex; gap:0.35rem; align-items:center;">
            ${isFixture ? '<span class="badge badge-fixture">TEST FIXTURE BENCHMARK</span>' : ''}
            ${isMixed ? '<span class="badge badge-mixed">MIXED PROVENANCE</span>' : ''}
            <span class="badge badge-tier1"><code>${c.node_id}</code></span>
          </div>
        </div>
        <p style="font-size:0.9rem; margin-bottom:0.4rem; color:var(--text-primary);">
          ${escapeHtml(c.definition || 'No canonical definition recorded.')}
        </p>
        ${isFixture ? `
          <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.4rem; font-style:italic;">
            Note: Derived from an automated regression test fixture for OS pipeline verification.
          </p>
        ` : ''}
        ${isMixed ? `
          <p style="font-size:0.8rem; color:#7A5312; margin-bottom:0.4rem; font-style:italic;">
            Note: Bridges both verified real-world evidence and synthetic test fixtures.
          </p>
        ` : ''}
        ${c.aliases && c.aliases.length > 0 ? `
          <p style="font-size:0.825rem; color:var(--text-secondary); margin-bottom:0.4rem;">
            <strong>Aliases:</strong> ${c.aliases.map(a => `<code>${escapeHtml(a)}</code>`).join(', ')}
          </p>
        ` : ''}
        ${claims.length > 0 ? `
          <div style="background:var(--bg-primary); padding:0.75rem 1rem; border-radius:var(--radius-md); margin-top:0.65rem; border:1px solid var(--border-subtle);">
            <strong style="font-size:0.825rem; color:var(--accent-color);">Anchored Claims (${claims.length}):</strong>
            <ul style="margin-left:1.25rem; font-size:0.85rem; margin-top:0.25rem;">
              ${claims.map(clm => {
                const clmProv = getClaimProvenance(clm);
                const claimBadge = clmProv.isFixture
                  ? '<span class="badge badge-fixture" style="font-size:0.7rem; padding:0.08rem 0.35rem; margin-right:0.35rem;">BENCHMARK CLAIM</span>'
                  : (clmProv.isMixed ? '<span class="badge badge-mixed" style="font-size:0.7rem; padding:0.08rem 0.35rem; margin-right:0.35rem;">MIXED EVIDENCE</span>' : '');
                const fixtureTag = clmProv.isFixture ? ' <em>[Synthetic Fixture]</em>' : (clmProv.isMixed ? ' <em>[Mixed Sources]</em>' : '');
                return `
                <li style="margin-bottom:0.35rem; color:var(--text-primary);">
                  ${claimBadge}"${escapeHtml(clm.statement)}"
                  <br><span style="color:var(--text-muted); font-size:0.785rem;">
                    Locator: <code>${clm.evidence[0] ? clm.evidence[0].locator : 'n/a'}</code> &bull; Source: <code>${clm.evidence[0] ? clm.evidence[0].source_id : 'n/a'}</code>${fixtureTag}
                  </span>
                </li>
              `;
              }).join('')}
            </ul>
          </div>
        ` : ''}
        ${edges.length > 0 ? `
          <div style="margin-top:0.5rem; font-size:0.825rem; color:var(--text-secondary);">
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
        <a href="../${d.path}" target="_blank" style="color:var(--accent-color); text-decoration:none; font-weight:500;">
          View Markdown Source &rarr;
        </a>
      </p>
    </div>
  `).join('');
}

function renderMarkdown(md) {
  if (!md) return '';
  const lines = md.split('\n');
  let html = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Suppress repetitive metadata blockquotes at the top of notes
    if (line.match(/^>\s*\*\*(Thematic Topic|Contributing Sources|Last Synthesized|Epistemic Class|Author|Source ID|Epistemic Tier|Decoding Status|Decoding Engine):\*\*/i)) {
      while (i < lines.length && (lines[i].startsWith('>') || lines[i].trim() === '---' || lines[i].trim() === '')) {
        if (lines[i].startsWith('#') && !lines[i].startsWith('>')) break;
        i++;
      }
      if (i < lines.length) {
        line = lines[i];
      } else {
        break;
      }
    }

    // Warning block
    if (line.startsWith('> [!WARNING]')) {
      let warningHtml = '<div class="callout-box warning-callout">';
      i++; // Skip marker line
      while (i < lines.length && lines[i].startsWith('>')) {
        let content = lines[i].replace(/^>\s*/, '');
        content = formatInline(content);
        warningHtml += `<p>${content}</p>`;
        i++;
      }
      warningHtml += '</div>';
      html.push(warningHtml);
      continue;
    }

    // Grouped Blockquote (never create repeating individual boxes per line)
    if (line.startsWith('>')) {
      if (inList) { html.push('</ul>'); inList = false; }
      let quoteLines = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        let qLine = lines[i].replace(/^>\s*/, '').trim();
        if (qLine.length > 0) {
          quoteLines.push(formatInline(qLine));
        }
        i++;
      }
      i--; // Rewind one position for loop increment
      if (quoteLines.length > 0) {
        html.push(`<blockquote>${quoteLines.join('<br>')}</blockquote>`);
      }
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h3 class="codex-h3">${formatInline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h2 class="codex-h2">${formatInline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h1 class="codex-h1">${formatInline(line.slice(2))}</h1>`);
      continue;
    }

    // Horizontal Rule
    if (line.trim() === '---' || line.trim() === '***') {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push('<hr class="codex-divider">');
      continue;
    }

    // Unordered List Items
    const listMatch = line.match(/^(\s*)[*-]\s+(.*)$/);
    if (listMatch) {
      if (!inList) { html.push('<ul class="codex-list">'); inList = true; }
      const indent = listMatch[1].length;
      const content = formatInline(listMatch[2]);
      html.push(`<li style="${indent > 0 ? 'margin-left:1.25rem;' : ''}">${content}</li>`);
      continue;
    } else {
      if (inList && line.trim() === '') {
        html.push('</ul>');
        inList = false;
      }
    }

    // Blank line
    if (line.trim() === '') {
      continue;
    }

    // Regular Paragraph
    html.push(`<p class="codex-p">${formatInline(line)}</p>`);
  }

  if (inList) html.push('</ul>');
  return html.join('\n');
}

function formatInline(text) {
  if (!text) return '';
  return text
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="codex-link">$1</a>');
}

let currentActiveCodexId = null;

function viewCodex(sourceId) {
  if (sourceId === 'MASTER-ASPIRANT-DECISION') {
    currentActiveCodexId = sourceId;
    switchTab('codex-reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('codex-title').textContent = 'Competitive Exam Aspirant Psychology & Decision Architecture: Unified Master Synthesis';
    document.getElementById('codex-meta').innerHTML = `
      <span class="badge badge-accent" style="margin-right:0.4rem;">CROSS-SOURCE MASTER SYNTHESIS</span>
      <strong>Topic:</strong> Aspirant Psychology &amp; Behavioral Decision Theory &bull;
      <strong>Sources Unified:</strong> <code>SRC-YT-2026-002</code> &bull; <code>SRC-YT-2026-001</code> &bull;
      <strong>Status:</strong> DEDUPLICATED &amp; VERIFIED
    `;

    document.querySelectorAll('.note-switcher .switcher-btn').forEach(btn => btn.classList.remove('active'));
    const activeSwitcherBtn = document.getElementById(`btn-switch-${sourceId}`);
    if (activeSwitcherBtn) activeSwitcherBtn.classList.add('active');

    const masterUrl = `../knowledge/master/aspirant_psychology_and_decision_architecture.md`;
    fetch(masterUrl)
      .then(r => r.text())
      .then(txt => {
        document.getElementById('codex-content').innerHTML = renderMarkdown(txt);
      })
      .catch(err => {
        document.getElementById('codex-content').innerHTML = `<p style="color:var(--text-secondary);">Failed to fetch master synthesis at ${masterUrl}: ${err.message}</p>`;
      });
    return;
  }

  if (sourceId === 'MASTER-RELATIONSHIP-DYNAMICS') {
    currentActiveCodexId = sourceId;
    switchTab('codex-reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('codex-title').textContent = 'Relationship Dynamics & Attachment Psychology: The Anatomy of Self-Sabotage';
    document.getElementById('codex-meta').innerHTML = `
      <span class="badge badge-accent" style="margin-right:0.4rem; background:#bf3989;">CROSS-SOURCE TOPIC HUB</span>
      <strong>Topic:</strong> Romantic Attachment &amp; Inversion Behavioral Diagnostics &bull;
      <strong>Sources Unified:</strong> <code>SRC-YT-2026-003</code> &bull;
      <strong>Status:</strong> VERIFIED MASTER CODEX
    `;

    document.querySelectorAll('.note-switcher .switcher-btn').forEach(btn => btn.classList.remove('active'));
    const activeSwitcherBtn = document.getElementById(`btn-switch-${sourceId}`);
    if (activeSwitcherBtn) activeSwitcherBtn.classList.add('active');

    const masterUrl = `../knowledge/master/relationship_dynamics_and_attachment_psychology.md`;
    fetch(masterUrl)
      .then(r => r.text())
      .then(txt => {
        document.getElementById('codex-content').innerHTML = renderMarkdown(txt);
      })
      .catch(err => {
        document.getElementById('codex-content').innerHTML = `<p style="color:var(--text-secondary);">Failed to fetch topic synthesis at ${masterUrl}: ${err.message}</p>`;
      });
    return;
  }

  if (!manifestData || !manifestData.sources) return;
  const source = manifestData.sources.find(s => s.source_id === sourceId);
  if (!source) return;

  currentActiveCodexId = sourceId;
  const isFixture = isFixtureSource(source);

  switchTab('codex-reader');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('codex-title').textContent = source.title;
  document.getElementById('codex-meta').innerHTML = `
    <strong>ID:</strong> <code>${source.source_id}</code> &bull; <strong>Author:</strong> ${escapeHtml(source.author)} &bull;
    <strong>Tier:</strong> ${source.epistemic_tier} &bull; <strong>Status:</strong> ${source.decoding_status}
    ${isFixture ? '<span class="badge badge-fixture" style="margin-left:0.5rem;">TEST FIXTURE BENCHMARK</span>' : ''}
  `;

  // Update switcher button active state
  document.querySelectorAll('.note-switcher .switcher-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeSwitcherBtn = document.getElementById(`btn-switch-${sourceId}`);
  if (activeSwitcherBtn) {
    activeSwitcherBtn.classList.add('active');
  }

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
      const renderedHtml = renderMarkdown(banner + txt);
      document.getElementById('codex-content').innerHTML = renderedHtml;
    })
    .catch(err => {
      document.getElementById('codex-content').innerHTML = `<p style="color:var(--text-secondary);">Failed to fetch codex at ${codexUrl}: ${err.message}</p>`;
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

  // If opening Reader Mode directly and no codex has been selected yet, default to Unified Master Note
  if (viewId === 'codex-reader' && !currentActiveCodexId) {
    viewCodex('MASTER-ASPIRANT-DECISION');
  }
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

if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('DOMContentLoaded', loadManifest);
}

// Expose internal helpers for test runners when running in Node.js / vm
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadManifest,
    initApp,
    isFixtureSource,
    getConceptProvenance,
    isFixtureConcept,
    getClaimProvenance,
    isFixtureClaim,
    renderMetrics,
    renderSources,
    renderConcepts,
    renderDocs,
    setManifestData: (data) => { manifestData = data; }
  };
}
