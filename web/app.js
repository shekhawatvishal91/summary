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
  filterReaderCategory('all');
  initHubInteractions();
  if (typeof window !== 'undefined' && window.location && window.document) {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && (hash.startsWith('SRC-') || hash.startsWith('MASTER-') || hash.startsWith('CHAPTER-'))) {
      viewCodex(hash, false);
    } else {
      navigateHome();
    }
  }
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

    // Fenced Code Block handling
    if (line.startsWith('```')) {
      if (inList) { html.push('</ul>'); inList = false; }
      let codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      html.push(`<pre class="codex-code-block"><code>${codeLines.join('\n')}</code></pre>`);
      continue;
    }

    // Compact Cycle Flow Card (Horizontal Loop Diagram)
    if (line.includes('→') && (line.includes('**') || line.includes('↺') || line.includes('('))) {
      if (inList) { html.push('</ul>'); inList = false; }
      const rawParts = line.split('→').map(p => p.trim());
      let stepsHtml = [];
      rawParts.forEach((part, idx) => {
        const isLast = (idx === rawParts.length - 1);
        if (isLast && (part.includes('↺') || part.includes('('))) {
          const splitIdx = part.search(/↺|\(/);
          const stepRaw = part.slice(0, splitIdx).trim();
          const loopRaw = part.slice(splitIdx).replace(/[↺()]/g, '').trim();
          if (stepRaw) {
            stepsHtml.push(`<span class="cycle-step"><span class="step-num">${idx + 1}</span> ${formatInline(stepRaw)}</span>`);
          }
          if (loopRaw) {
            stepsHtml.push(`<span class="cycle-arrow loop-arrow">&#x21ba;</span>`);
            const loopClean = loopRaw.replace(/^\*+|\*+$/g, '').trim();
            stepsHtml.push(`<span class="cycle-loop-tag"><span class="loop-icon">&#x21ba;</span> ${escapeHtml(loopClean)}</span>`);
          }
        } else {
          stepsHtml.push(`<span class="cycle-step"><span class="step-num">${idx + 1}</span> ${formatInline(part)}</span>`);
          if (!isLast) {
            stepsHtml.push(`<span class="cycle-arrow">&rarr;</span>`);
          }
        }
      });
      html.push(`<div class="cycle-flow-card">${stepsHtml.join('')}</div>`);
      continue;
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

    // Practical steps block (for toggling between Essay and Field Guide modes)
    if (line.startsWith('**Practical steps') || line.startsWith('### Practical steps')) {
      if (inList) { html.push('</ul>'); inList = false; }
      const headerTitle = line.startsWith('### ') ? line.slice(4) : line;
      let stepHtml = `<div class="practical-steps-block"><h4 class="codex-h3" style="margin-top:0; border-bottom:none; font-size:1rem; color:var(--accent-color);">${formatInline(headerTitle)}</h4><ul class="codex-list">`;
      i++;
      while (i < lines.length) {
        let stepLine = lines[i];
        if ((stepLine.startsWith('### ') && !stepLine.startsWith('### Practical steps')) || stepLine.startsWith('## ') || stepLine.startsWith('# ') || stepLine.trim() === '---') {
          i--;
          break;
        }
        const bulletMatch = stepLine.match(/^(\s*)[*-]\s+(.*)$/);
        const numMatch = stepLine.match(/^(\s*)\d+\.\s+(.*)$/);
        if (bulletMatch) {
          stepHtml += `<li>${formatInline(bulletMatch[2])}</li>`;
        } else if (numMatch) {
          stepHtml += `<li>${formatInline(numMatch[2])}</li>`;
        } else if (stepLine.startsWith('*') && stepLine.endsWith('*')) {
          stepHtml += `</ul><p style="margin-top:0.6rem; font-style:italic; color:var(--text-secondary);">${formatInline(stepLine)}</p>`;
          break;
        } else if (stepLine.trim().length > 0) {
          stepHtml += `<p class="codex-p">${formatInline(stepLine)}</p>`;
        }
        i++;
      }
      if (!stepHtml.includes('</ul>')) stepHtml += '</ul>';
      stepHtml += '</div>';
      html.push(stepHtml);
      continue;
    }

    // Daily practice block (for toggling between Essay and Field Guide modes)
    if (line.startsWith('## A Simple Daily Practice') || line.startsWith('## The Emotional Reset') || line.startsWith('## A Sustainable Seven-Day Practice')) {
      if (inList) { html.push('</ul>'); inList = false; }
      let practiceHtml = `<div class="daily-practice-block"><h2 class="codex-h2" style="margin-top:0; border-bottom:none;">${formatInline(line.slice(3))}</h2>`;
      i++;
      while (i < lines.length) {
        let pLine = lines[i];
        if ((pLine.startsWith('## ') && !pLine.startsWith('## The Emotional Reset') && !pLine.startsWith('## A Sustainable')) || pLine.startsWith('# ') || pLine.trim() === '---') {
          i--;
          break;
        }
        if (pLine.match(/^(\s*)[*-]\s+(.*)$/)) {
          practiceHtml += `<p style="margin-left:1rem; margin-bottom:0.4rem;">&bull; ${formatInline(pLine.replace(/^(\s*)[*-]\s+/, ''))}</p>`;
        } else if (pLine.match(/^\d+\.\s+(.*)$/)) {
          practiceHtml += `<p style="margin-left:1rem; margin-bottom:0.4rem;">${formatInline(pLine)}</p>`;
        } else if (pLine.trim().length > 0) {
          practiceHtml += `<p class="codex-p">${formatInline(pLine)}</p>`;
        }
        i++;
      }
      practiceHtml += '</div>';
      html.push(practiceHtml);
      continue;
    }

    // Source Provenance & Verification Audit (Collapsible & Closed by Default)
    if (line.startsWith('## Source Provenance') || (line.startsWith('## ') && line.includes('Provenance & Verification'))) {
      if (inList) { html.push('</ul>'); inList = false; }
      const headerTitle = line.slice(3).trim();
      let provHtml = `<details class="provenance-details-box"><summary class="provenance-summary"><span class="provenance-summary-title">🛡️ ${formatInline(headerTitle)}</span><span class="provenance-summary-hint">Click to inspect audit &amp; verification &darr;</span></summary><div class="provenance-content">`;
      i++;
      let provInList = false;
      while (i < lines.length) {
        let pLine = lines[i];
        if (pLine.startsWith('## ') || pLine.startsWith('# ') || pLine.trim() === '---') {
          i--;
          break;
        }

        // Table inside provenance
        if (pLine.trim().startsWith('|') && pLine.trim().endsWith('|')) {
          if (provInList) { provHtml += '</ul>'; provInList = false; }
          let tableRows = [];
          let isHeader = true;
          while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
            let tLine = lines[i].trim();
            if (tLine.match(/^\|(\s*:?-+:?\s*\|)+$/)) {
              isHeader = false;
              i++;
              continue;
            }
            const cells = tLine.slice(1, -1).split('|').map(c => c.trim());
            if (isHeader) {
              tableRows.push(`<tr>${cells.map(c => `<th>${formatInline(c)}</th>`).join('')}</tr>`);
              isHeader = false;
            } else {
              tableRows.push(`<tr>${cells.map(c => `<td>${formatInline(c)}</td>`).join('')}</tr>`);
            }
            i++;
          }
          i--;
          provHtml += `<div class="table-container" style="margin-top:0.5rem;"><table class="codex-table">${tableRows.join('')}</table></div>`;
          i++;
          continue;
        }

        const bulletMatch = pLine.match(/^(\s*)[*-]\s+(.*)$/);
        if (bulletMatch) {
          if (!provInList) { provHtml += '<ul class="codex-list">'; provInList = true; }
          provHtml += `<li>${formatInline(bulletMatch[2])}</li>`;
        } else {
          if (provInList && pLine.trim() === '') {
            provHtml += '</ul>';
            provInList = false;
          }
          if (pLine.trim().length > 0) {
            provHtml += `<p class="codex-p">${formatInline(pLine)}</p>`;
          }
        }
        i++;
      }
      if (provInList) provHtml += '</ul>';
      provHtml += '</div></details>';
      html.push(provHtml);
      continue;
    }

    // Markdown Table handling
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (inList) { html.push('</ul>'); inList = false; }
      let tableRows = [];
      let isHeader = true;
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        let tLine = lines[i].trim();
        if (tLine.match(/^\|(\s*:?-+:?\s*\|)+$/)) {
          isHeader = false;
          i++;
          continue;
        }
        const cells = tLine.slice(1, -1).split('|').map(c => c.trim());
        if (isHeader) {
          tableRows.push(`<tr>${cells.map(c => `<th>${formatInline(c)}</th>`).join('')}</tr>`);
          isHeader = false;
        } else {
          tableRows.push(`<tr>${cells.map(c => `<td>${formatInline(c)}</td>`).join('')}</tr>`);
        }
        i++;
      }
      i--;
      html.push(`<div class="table-container"><table class="codex-table">${tableRows.join('')}</table></div>`);
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
function setReadingMode() {}
function applyReadingMode() {}
function setReaderSection() {}
function syncReaderSectionUI() {}

function toggleSidebar(forceState) {
  const sidebar = document.getElementById('reader-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  if (!sidebar) return;

  const isMobile = window.innerWidth <= 1024;
  if (isMobile) {
    const shouldOpen = typeof forceState === 'boolean' ? forceState : !sidebar.classList.contains('mobile-open');
    sidebar.classList.toggle('mobile-open', shouldOpen);
    if (backdrop) backdrop.classList.toggle('active', shouldOpen);
    if (toggleBtn) toggleBtn.classList.toggle('active', shouldOpen);
  } else {
    const shouldCollapse = typeof forceState === 'boolean' ? !forceState : !sidebar.classList.contains('collapsed');
    sidebar.classList.toggle('collapsed', shouldCollapse);
    if (toggleBtn) toggleBtn.classList.toggle('active', !shouldCollapse);
  }
}


function filterReaderCategory(cat) {
  // Ensure codex-reader view is active
  const readerSec = document.getElementById('codex-reader');
  if (readerSec && !readerSec.classList.contains('active')) {
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === 'codex-reader');
    });
  }
  const subnav = document.getElementById('reader-subnav-individual');
  if (subnav) subnav.style.display = 'block';

  // Clear quick search filter when category changes
  const searchInput = document.getElementById('reader-search-input');
  if (searchInput && searchInput.value) {
    searchInput.value = '';
    handleReaderSearch('');
  }

  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  const activePill = document.getElementById(`pill-cat-${cat}`);
  if (activePill) activePill.classList.add('active');

  const aspirantGroup = document.getElementById('cat-group-aspirant');
  const relGroup = document.getElementById('cat-group-relationships');
  const cogGroup = document.getElementById('cat-group-cognitive');
  const philGroup = document.getElementById('cat-group-philosophy');

  if (cat === 'all') {
    if (aspirantGroup) aspirantGroup.style.display = 'block';
    if (relGroup) relGroup.style.display = 'block';
    if (cogGroup) cogGroup.style.display = 'block';
    if (philGroup) philGroup.style.display = 'block';
  } else if (cat === 'aspirant') {
    if (aspirantGroup) aspirantGroup.style.display = 'block';
    if (relGroup) relGroup.style.display = 'none';
    if (cogGroup) cogGroup.style.display = 'none';
    if (philGroup) philGroup.style.display = 'none';
  } else if (cat === 'relationships') {
    if (aspirantGroup) aspirantGroup.style.display = 'none';
    if (relGroup) relGroup.style.display = 'block';
    if (cogGroup) cogGroup.style.display = 'none';
    if (philGroup) philGroup.style.display = 'none';
  } else if (cat === 'cognitive') {
    if (aspirantGroup) aspirantGroup.style.display = 'none';
    if (relGroup) relGroup.style.display = 'none';
    if (cogGroup) cogGroup.style.display = 'block';
    if (philGroup) philGroup.style.display = 'none';
  } else if (cat === 'philosophy') {
    if (aspirantGroup) aspirantGroup.style.display = 'none';
    if (relGroup) relGroup.style.display = 'none';
    if (cogGroup) cogGroup.style.display = 'none';
    if (philGroup) philGroup.style.display = 'block';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleReaderSearch(query) {
  const q = (query || '').toLowerCase().trim();
  const items = document.querySelectorAll('.channel-video-item, .source-card-compact');
  items.forEach(item => {
    const title = (item.querySelector('.video-item-title') || item.querySelector('.source-card-title'))?.textContent.toLowerCase() || '';
    const channelBox = item.closest('.channel-card-box');
    const channel = (channelBox?.querySelector('.channel-name') || item.querySelector('.source-card-channel'))?.textContent.toLowerCase() || '';
    const matches = !q || title.includes(q) || channel.includes(q);
    item.style.display = matches ? 'flex' : 'none';
  });

  // Check if channel boxes have visible items
  document.querySelectorAll('.channel-card-box').forEach(box => {
    const visibleItems = box.querySelectorAll('.channel-video-item:not([style*="display: none"])');
    box.style.display = visibleItems.length > 0 ? 'block' : 'none';
  });

  // Check if category groups have visible boxes
  document.querySelectorAll('.reader-category-group').forEach(group => {
    const visibleBoxes = group.querySelectorAll('.channel-card-box:not([style*="display: none"]), .source-card-compact:not([style*="display: none"])');
    group.style.display = visibleBoxes.length > 0 ? 'block' : 'none';
  });
}

function viewCodex(sourceId, shouldScroll = true) {
  const dash = document.getElementById('dashboard-view');
  const appLayout = document.querySelector('.app-layout-container');
  const btnHub = document.getElementById('btn-mode-hub');
  const btnReader = document.getElementById('btn-mode-reader');

  if (dash) dash.style.display = 'none';
  if (appLayout) appLayout.style.display = 'flex';
  if (btnHub) btnHub.classList.remove('active');
  if (btnReader) btnReader.classList.add('active');

  if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
    const sidebar = document.getElementById('reader-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
    if (toggleBtn) toggleBtn.classList.remove('active');
  }

  if (sourceId === 'MASTER-ASPIRANT-DECISION') {
    currentActiveCodexId = sourceId;
    switchTab('codex-reader');
    const headerBar = document.getElementById('reader-mode-header-bar');
    if (headerBar) headerBar.style.display = 'none';
    const subnav = document.getElementById('reader-subnav-individual');
    if (subnav) subnav.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('codex-title').innerHTML = `
      <div style="margin-bottom:0.75rem;">
        <button class="btn-read" style="background:var(--bg-subtle); color:var(--text-secondary); border:1px solid var(--border-color); padding:0.3rem 0.75rem; font-size:0.78rem; border-radius:var(--radius-sm); cursor:pointer;" onclick="navigateHome()">&larr; Back to Master Notes Library</button>
      </div>
      <span>Competitive Exam Aspirant Psychology &amp; Decision Architecture: Unified Master Synthesis</span>
    `;
    document.getElementById('codex-meta').innerHTML = `
      <span class="badge badge-accent" style="margin-right:0.4rem; background:#1f883d; color:#fff;">CROSS-SOURCE MASTER SYNTHESIS</span>
      <strong>Topic:</strong> Aspirant Psychology &amp; Behavioral Decision Theory &bull;
      <strong>Sources Unified:</strong> <code>SRC-YT-2026-002</code> &bull; <code>SRC-YT-2026-001</code> &bull; <code>SRC-YT-2026-009</code> &bull;
      <strong>Status:</strong> DEDUPLICATED &amp; VERIFIED
    `;

    document.querySelectorAll('.switcher-btn').forEach(btn => btn.classList.remove('active'));
    const activeSwitcherBtn = document.getElementById(`btn-switch-${sourceId}`);
    if (activeSwitcherBtn) activeSwitcherBtn.classList.add('active');

    const masterUrl = `../knowledge/master/aspirant_psychology_and_decision_architecture.md`;
    fetch(masterUrl)
      .then(r => r.text())
      .then(txt => {
        // Strip top # Title line so content starts directly with the first section
        const contentTxt = txt.replace(/^#[^\n]+\n+/, '');
        document.getElementById('codex-content').innerHTML = renderMarkdown(contentTxt);
      })
      .catch(err => {
        document.getElementById('codex-content').innerHTML = `<p style="color:var(--text-secondary);">Failed to fetch master synthesis at ${masterUrl}: ${err.message}</p>`;
      });
    return;
  }

  if (sourceId === 'MASTER-RELATIONSHIP-DYNAMICS') {
    currentActiveCodexId = sourceId;
    switchTab('codex-reader');
    const headerBar = document.getElementById('reader-mode-header-bar');
    if (headerBar) headerBar.style.display = 'none';
    const subnav = document.getElementById('reader-subnav-individual');
    if (subnav) subnav.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('codex-title').innerHTML = `
      <div style="margin-bottom:0.75rem;">
        <button class="btn-read" style="background:var(--bg-subtle); color:var(--text-secondary); border:1px solid var(--border-color); padding:0.3rem 0.75rem; font-size:0.78rem; border-radius:var(--radius-sm); cursor:pointer;" onclick="navigateHome()">&larr; Back to Master Notes Library</button>
      </div>
      <span>Love Without Losing Yourself</span>
    `;
    document.getElementById('codex-meta').innerHTML = `
      <span class="badge badge-accent" style="margin-right:0.4rem; background:#bf3989; color:#fff;">CROSS-SOURCE MASTER TREATISE</span>
      <strong>Theme:</strong> Emotional Triggers, Relationship Patterns &amp; Genuine Love &bull;
      <strong>Sources Unified:</strong> <code>SRC-YT-2026-003</code> &bull; <code>SRC-YT-2026-004</code> &bull; <code>SRC-YT-2026-005</code> &bull; <code>SRC-YT-2026-006</code> &bull; <code>SRC-YT-2026-007</code> &bull; <code>SRC-YT-2026-008</code> &bull;
      <strong>Status:</strong> MASTER TOPIC TREATISE (4 PARTS &bull; 21 DYNAMICS &bull; 3 CAUSAL LOOPS)
    `;

    document.querySelectorAll('.switcher-btn').forEach(btn => btn.classList.remove('active'));
    const activeSwitcherBtn = document.getElementById(`btn-switch-${sourceId}`);
    if (activeSwitcherBtn) activeSwitcherBtn.classList.add('active');

    const masterUrl = `../knowledge/master/relationship_dynamics_and_attachment_psychology.md`;
    fetch(masterUrl)
      .then(r => r.text())
      .then(txt => {
        // Strip top # Title and subtitle so content starts directly with the treatise
        const contentTxt = txt.replace(/^#[^\n]+\n+(?:##[^\n]+\n+)?/, '');
        document.getElementById('codex-content').innerHTML = renderMarkdown(contentTxt);
      })
      .catch(err => {
        document.getElementById('codex-content').innerHTML = `<p style="color:var(--text-secondary);">Failed to fetch topic synthesis at ${masterUrl}: ${err.message}</p>`;
      });
    return;
  }

  if (sourceId === 'CHAPTER-TCT-RELATIONAL-AUTONOMY') {
    currentActiveCodexId = sourceId;
    switchTab('codex-reader');
    const headerBar = document.getElementById('reader-mode-header-bar');
    if (headerBar) headerBar.style.display = 'flex';
    const subnav = document.getElementById('reader-subnav-individual');
    if (subnav) subnav.style.display = 'block';

    document.querySelectorAll('.switcher-btn').forEach(btn => btn.classList.remove('active'));
    const activeSwitcherBtn = document.getElementById(`btn-switch-${sourceId}`);
    if (activeSwitcherBtn) activeSwitcherBtn.classList.add('active');

    document.getElementById('codex-title').textContent = 'Relational Autonomy, Toxic Dynamics & Emotional Self-Mastery (Unified Master Chapter)';
    document.getElementById('codex-meta').innerHTML = `
      <span class="badge badge-accent" style="margin-right:0.4rem; background:#bf3989; color:#fff;">CHANNEL MASTER CHAPTER</span>
      <strong>Channel:</strong> The Cool Therapist &bull; <strong>Structure:</strong> 4 Acts &bull; 6 Sequential Sections &bull;
      <strong>Reading Time:</strong> 23m 35s &bull; <strong>Originality:</strong> 100% Verbatim Spoken Delivery
    `;

    const chapterUrl = `../knowledge/chapters/the_cool_therapist_relational_autonomy.md`;
    fetch(chapterUrl)
      .then(r => r.text())
      .then(txt => {
        // Strip top # Title line so content starts directly with the act overview
        const contentTxt = txt.replace(/^#[^\n]+\n+(?:##[^\n]+\n+)?/, '');
        document.getElementById('codex-content').innerHTML = renderMarkdown(contentTxt);

        if (shouldScroll) {
          const headerCard = document.getElementById('codex-header-card');
          if (headerCard) {
            const topPos = headerCard.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top: Math.max(0, topPos), behavior: 'smooth' });
          }
        }
      })
      .catch(err => {
        document.getElementById('codex-content').innerHTML = `<p style="color:var(--text-secondary);">Failed to fetch chapter at ${chapterUrl}: ${err.message}</p>`;
      });
    return;
  }

  if (sourceId === 'CHAPTER-ABRAIN-ASPIRANT-PSYCHOLOGY') {
    currentActiveCodexId = sourceId;
    switchTab('codex-reader');
    const headerBar = document.getElementById('reader-mode-header-bar');
    if (headerBar) headerBar.style.display = 'flex';
    const subnav = document.getElementById('reader-subnav-individual');
    if (subnav) subnav.style.display = 'block';

    document.querySelectorAll('.switcher-btn').forEach(btn => btn.classList.remove('active'));
    const activeSwitcherBtn = document.getElementById(`btn-switch-${sourceId}`);
    if (activeSwitcherBtn) activeSwitcherBtn.classList.add('active');

    document.getElementById('codex-title').textContent = 'The Aspirant’s Cage: Sunk Cost Trap & Autonomous Identity (Unified Master Chapter)';
    document.getElementById('codex-meta').innerHTML = `
      <span class="badge badge-accent" style="margin-right:0.4rem; background:#1f883d; color:#fff;">CHANNEL MASTER CHAPTER</span>
      <strong>Channel:</strong> ABrainOConscious &bull; <strong>Structure:</strong> 2 Parts &bull; Diagnosis to Architecture &bull;
      <strong>Reading Time:</strong> 61m 11s &bull; <strong>Originality:</strong> 100% Verbatim Spoken Delivery
    `;

    const chapterUrl = `../knowledge/chapters/abrainoconscious_aspirant_psychology.md`;
    fetch(chapterUrl)
      .then(r => r.text())
      .then(txt => {
        // Strip top # Title line so content starts directly with the act overview
        const contentTxt = txt.replace(/^#[^\n]+\n+(?:##[^\n]+\n+)?/, '');
        document.getElementById('codex-content').innerHTML = renderMarkdown(contentTxt);

        if (shouldScroll) {
          const headerCard = document.getElementById('codex-header-card');
          if (headerCard) {
            const topPos = headerCard.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top: Math.max(0, topPos), behavior: 'smooth' });
          }
        }
      })
      .catch(err => {
        document.getElementById('codex-content').innerHTML = `<p style="color:var(--text-secondary);">Failed to fetch chapter at ${chapterUrl}: ${err.message}</p>`;
      });
    return;
  }

  if (sourceId === 'CHAPTER-VIKAS-BUDDHA-CANON') {
    currentActiveCodexId = sourceId;
    switchTab('codex-reader');
    const headerBar = document.getElementById('reader-mode-header-bar');
    if (headerBar) headerBar.style.display = 'flex';
    const subnav = document.getElementById('reader-subnav-individual');
    if (subnav) subnav.style.display = 'block';

    document.querySelectorAll('.switcher-btn').forEach(btn => btn.classList.remove('active'));
    const activeSwitcherBtn = document.getElementById(`btn-switch-${sourceId}`);
    if (activeSwitcherBtn) activeSwitcherBtn.classList.add('active');

    document.getElementById('codex-title').textContent = 'The Complete Buddhist Canon: Life, Historical Context & Core Philosophy (Unified Master Chapter)';
    document.getElementById('codex-meta').innerHTML = `
      <span class="badge badge-accent" style="margin-right:0.4rem; background:#d97706; color:#fff;">CHANNEL MASTER CHAPTER</span>
      <strong>Channel:</strong> Vikas Divyakirti &bull; <strong>Structure:</strong> 2 Volumes &bull; 38 Acts &bull;
      <strong>Reading Time:</strong> 11h 08m 50s &bull; <strong>Originality:</strong> 100% Verbatim Spoken Delivery
    `;

    const chapterUrl = `../knowledge/chapters/vikas_divyakirti_buddha_canon.md`;
    fetch(chapterUrl)
      .then(r => r.text())
      .then(txt => {
        // Strip top # Title line so content starts directly with the act overview
        const contentTxt = txt.replace(/^#[^\n]+\n+(?:##[^\n]+\n+)?/, '');
        document.getElementById('codex-content').innerHTML = renderMarkdown(contentTxt);

        if (shouldScroll) {
          const headerCard = document.getElementById('codex-header-card');
          if (headerCard) {
            const topPos = headerCard.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top: Math.max(0, topPos), behavior: 'smooth' });
          }
        }
      })
      .catch(err => {
        document.getElementById('codex-content').innerHTML = `<p style="color:var(--text-secondary);">Failed to fetch chapter at ${chapterUrl}: ${err.message}</p>`;
      });
    return;
  }

  if (!manifestData || !manifestData.sources) return;
  const source = manifestData.sources.find(s => s.source_id === sourceId);
  if (!source) return;

  currentActiveCodexId = sourceId;
  const isFixture = isFixtureSource(source);
  switchTab('codex-reader');
  const headerBar = document.getElementById('reader-mode-header-bar');
  if (headerBar) headerBar.style.display = 'flex';
  const subnav = document.getElementById('reader-subnav-individual');
  if (subnav) subnav.style.display = 'block';
  // Update switcher button active state
  document.querySelectorAll('.switcher-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeSwitcherBtn = document.getElementById(`btn-switch-${sourceId}`);
  if (activeSwitcherBtn) {
    activeSwitcherBtn.classList.add('active');
  }

  // Set initial title and loading state
  document.getElementById('codex-title').textContent = source.title;
  document.getElementById('codex-meta').innerHTML = `
    <strong>ID:</strong> <code>${source.source_id}</code> &bull; <strong>Author:</strong> ${escapeHtml(source.author)} &bull;
    <strong>Tier:</strong> ${source.epistemic_tier} &bull; <strong>Status:</strong> ${source.decoding_status}
    ${isFixture ? '<span class="badge badge-fixture" style="margin-left:0.5rem;">TEST FIXTURE BENCHMARK</span>' : ''}
  `;

  // Fetch codex markdown text
  const codexUrl = `../knowledge/sources/${sourceId}/codex.md`;
  fetch(codexUrl)
    .then(r => r.text())
    .then(txt => {
      // 1. Extract video metadata from codex markdown if present
      const titleMatch = txt.match(/^#\s+(.+)$/m);
      const cleanTitle = titleMatch ? titleMatch[1].trim() : source.title;

      const speakerMatch = txt.match(/\*\*Speaker(?:\s*\/\s*Channel)?:\*\*\s*([^|\n]+)/i);
      const speaker = speakerMatch ? speakerMatch[1].trim() : (source.author || 'Unknown');

      const durationMatch = txt.match(/\*\*Duration:\*\*\s*([^|\n]+)/i);
      const duration = durationMatch ? durationMatch[1].trim() : (source.duration || '');

      const urlMatch = txt.match(/\*\*URL:\*\*\s*(?:\[([^\]]+)\]\(([^)]+)\)|([^\s|\n]+))/i);
      const videoUrl = urlMatch ? (urlMatch[2] || urlMatch[1] || urlMatch[3]) : (source.video_id ? `https://www.youtube.com/watch?v=${source.video_id}` : (source.url || ''));

      const tierMatch = txt.match(/\*\*Epistemic Tier:\*\*\s*([^|\n]+)/i);
      const tier = tierMatch ? tierMatch[1].trim() : (source.epistemic_tier || 'tier_3');

      // Update Upper Box: Title + Full Video Info
      document.getElementById('codex-title').textContent = cleanTitle;
      if (source.medium === 'youtube' || videoUrl || duration) {
        document.getElementById('codex-meta').innerHTML = `
          <div class="video-meta-bar">
            <span class="video-meta-item"><strong>Speaker / Channel:</strong> ${escapeHtml(speaker)}</span>
            ${duration ? `<span>&bull;</span><span class="video-duration-pill">⏱️ ${escapeHtml(duration)}</span>` : ''}
            <span>&bull;</span>
            <span class="video-meta-item"><strong>Source ID:</strong> <code>${source.source_id}</code></span>
            ${videoUrl ? `<span>&bull;</span><a href="${videoUrl}" target="_blank" rel="noopener noreferrer" class="video-url-pill">▶ Watch on YouTube ↗</a>` : ''}
            <span>&bull;</span>
            <span class="video-meta-item"><strong>Tier:</strong> ${escapeHtml(tier)}</span>
            <span>&bull;</span>
            <span class="badge badge-tier1" style="font-size:0.75rem;">${source.decoding_status || 'VERIFIED'}</span>
            ${isFixture ? '<span class="badge badge-fixture" style="margin-left:0.5rem;">TEST FIXTURE BENCHMARK</span>' : ''}
          </div>
        `;
      }

      // 2. Prepare Lower Box: starts directly with the content i.e (The Speaker's Spoken Delivery)
      let contentTxt = txt;
      const deliveryIndex = txt.search(/^##\s+(?:(?:\d+\.\s*)?The Speaker's Spoken Delivery|Spoken Delivery)/m);
      if (deliveryIndex !== -1) {
        contentTxt = txt.slice(deliveryIndex);
      } else {
        // Fallback for non-speech codices: start at the first markdown section (##)
        const firstSectionIndex = txt.search(/^##\s+/m);
        if (firstSectionIndex !== -1) {
          contentTxt = txt.slice(firstSectionIndex);
        }
      }

      const banner = isFixture ? `> [!WARNING]
> **TEST FIXTURE BENCHMARK ADVISORY**
> This analytical codex is generated from an automated regression test fixture for OS pipeline verification.
> Its claims, mechanisms, and models are synthetic test artifacts, not verified scientific literature.

` : '';
      const renderedHtml = renderMarkdown(banner + contentTxt);
      document.getElementById('codex-content').innerHTML = renderedHtml;

      // Scroll directly to the note header card with margin for sticky navbar
      if (shouldScroll) {
        const headerCard = document.getElementById('codex-header-card');
        if (headerCard) {
          const topPos = headerCard.getBoundingClientRect().top + window.pageYOffset - 80;
          window.scrollTo({ top: Math.max(0, topPos), behavior: 'smooth' });
        }
      }
    })
    .catch(err => {
      document.getElementById('codex-content').innerHTML = `<p style="color:var(--text-secondary);">Failed to fetch codex at ${codexUrl}: ${err.message}</p>`;
    });
}

function navigateHome() {
  const dash = document.getElementById('dashboard-view');
  const appLayout = document.querySelector('.app-layout-container');
  const btnHub = document.getElementById('btn-mode-hub');
  const btnReader = document.getElementById('btn-mode-reader');

  if (dash) dash.style.display = 'block';
  if (appLayout) appLayout.style.display = 'none';
  if (btnHub) btnHub.classList.add('active');
  if (btnReader) btnReader.classList.remove('active');

  filterReaderCategory('all');
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function openReaderMode(sourceId) {
  const dash = document.getElementById('dashboard-view');
  const appLayout = document.querySelector('.app-layout-container');
  const btnHub = document.getElementById('btn-mode-hub');
  const btnReader = document.getElementById('btn-mode-reader');

  if (dash) dash.style.display = 'none';
  if (appLayout) appLayout.style.display = 'flex';
  if (btnHub) btnHub.classList.remove('active');
  if (btnReader) btnReader.classList.add('active');

  if (sourceId) {
    viewCodex(sourceId);
  } else if (!currentActiveCodexId) {
    viewCodex('MASTER-ASPIRANT-DECISION');
  }
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/* ============================================================== */
/* GREEN STUDY HUB INTERACTIVE FEATURES */
/* ============================================================== */

const WISDOM_QUOTES = [
  { quote: "“~ Learn from failure ~”", author: "Philosophical Axiom • Resilient Growth Mindset" },
  { quote: "“The mark of an autonomous mind is the courage to walk away from a sunk cost.”", author: "Aspirant Psychology • Decision Architecture" },
  { quote: "“Pratityasamutpada: When this exists, that comes to be; with the arising of this, that arises.”", author: "Gautam Buddha • The Complete Buddhist Canon" },
  { quote: "“A true guru does not create a clone under their shadow; they nurture an independent banyan tree.”", author: "Prof. Rameshwar Rai & Dr. Vikas Divyakirti" },
  { quote: "“In love, over-pursuit breeds avoidance; sovereignty and emotional self-regulation restore equilibrium.”", author: "The Cool Therapist • Love Without Losing Yourself" },
  { quote: "“Decouple economic utility from intellectual identity: do your work with discipline, but keep your mind free.”", author: "Classical Pedagogy & Practical Ethics" },
  { quote: "“Stand a little out of my sunlight.”", author: "Diogenes to Alexander the Great • Supreme Intellectual Autonomy" },
  { quote: "“Literature serves as emotional hygiene: it prevents technocratic dehumanization.”", author: "Hindi Literature & Critical Consciousness" }
];
let currentWisdomIdx = 0;

function shuffleWisdom() {
  currentWisdomIdx = (currentWisdomIdx + 1) % WISDOM_QUOTES.length;
  const q = WISDOM_QUOTES[currentWisdomIdx];
  const disp = document.getElementById('hub-quote-display');
  const auth = document.getElementById('hub-quote-author');
  if (disp) disp.textContent = q.quote;
  if (auth) auth.textContent = q.author;
}

const HUB_FLASHCARDS = [
  {
    dim: "Mentorship Dynamics & Epistemic Timing",
    q: "How does Dr. Vikas Divyakirti deconstruct Prof. Rameshwar Rai’s 'Watering the Banyan Tree' metaphor?",
    a: "When a tree is in its initial vulnerable seed and sapling stage, timely water and intellectual nutrients dictate whether it withers or expands into a massive canopy."
  },
  {
    dim: "Decision Architecture & Sunk Cost",
    q: "What is the psychological trap that keeps multi-year aspirants locked in diminishing returns?",
    a: "The Sunk Cost Fallacy: conflating past non-recoverable time and identity investments with rational assessment of future marginal utility."
  },
  {
    dim: "Attachment Dynamics & Relational Autonomy",
    q: "What is the critical intervention for breaking the anxious-avoidant pursuit loop?",
    a: "Halting over-pursuit, self-soothing emotional panic somatic triggers, and establishing autonomous emotional sovereignty."
  },
  {
    dim: "Buddhist Epistemology & Causality",
    q: "What is the core philosophical implication of Pratityasamutpada (Dependent Origination)?",
    a: "Nothing possesses svabhava (inherent, independent existence); all phenomena arise, persist, and dissolve strictly through interdependent conditions."
  },
  {
    dim: "Intellectual Autonomy & Ethical Stance",
    q: "How is the Diogenes stance applied to modern intellectual and professional life?",
    a: "Refusing to sacrifice internal dignity, truth, and critical freedom for institutional accolades or worldly patronization."
  },
  {
    dim: "Pedagogy of Humility",
    q: "What is the true benchmark of a great mentor articulated by Prof. Rameshwar Rai?",
    a: "Cultivating independent disciples who expand beyond the mentor's own intellectual and institutional boundaries."
  }
];
let currentCardIdx = 0;

function updateCardDisplay() {
  const card = HUB_FLASHCARDS[currentCardIdx];
  const dim = document.getElementById('flashcard-dimension');
  const q = document.getElementById('flashcard-question');
  const a = document.getElementById('flashcard-answer');
  const counter = document.getElementById('flashcard-counter');
  const btn = document.getElementById('flashcard-toggle-btn');

  if (dim) dim.textContent = card.dim;
  if (q) q.textContent = card.q;
  if (a) {
    a.textContent = card.a;
    a.classList.remove('visible');
  }
  if (btn) btn.textContent = 'Show Answer';
  if (counter) counter.textContent = `Card ${currentCardIdx + 1} / ${HUB_FLASHCARDS.length}`;
}

function toggleFlashcardAnswer() {
  const a = document.getElementById('flashcard-answer');
  const btn = document.getElementById('flashcard-toggle-btn');
  if (a) {
    const isVis = a.classList.toggle('visible');
    if (btn) btn.textContent = isVis ? 'Hide Answer' : 'Show Answer';
  }
}

function nextFlashcard() {
  currentCardIdx = (currentCardIdx + 1) % HUB_FLASHCARDS.length;
  updateCardDisplay();
}

function prevFlashcard() {
  currentCardIdx = (currentCardIdx - 1 + HUB_FLASHCARDS.length) % HUB_FLASHCARDS.length;
  updateCardDisplay();
}

function toggleTodo(idx) {
  const item = document.getElementById(`todo-item-${idx}`);
  const chk = document.getElementById(`todo-chk-${idx}`);
  if (item && chk) {
    if (chk.checked) {
      item.classList.add('completed');
    } else {
      item.classList.remove('completed');
    }
    saveTodos();
  }
}

function saveTodos() {
  if (typeof localStorage === 'undefined') return;
  const states = {};
  for (let i = 1; i <= 5; i++) {
    const chk = document.getElementById(`todo-chk-${i}`);
    if (chk) states[i] = chk.checked;
  }
  localStorage.setItem('hub_todos_state', JSON.stringify(states));
}

function loadTodos() {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem('hub_todos_state');
    if (!raw) return;
    const states = JSON.parse(raw);
    for (let i = 1; i <= 5; i++) {
      if (states[i]) {
        const chk = document.getElementById(`todo-chk-${i}`);
        const item = document.getElementById(`todo-item-${i}`);
        if (chk) chk.checked = true;
        if (item) item.classList.add('completed');
      }
    }
  } catch (e) {}
}

function resetTodos() {
  for (let i = 1; i <= 5; i++) {
    const chk = document.getElementById(`todo-chk-${i}`);
    const item = document.getElementById(`todo-item-${i}`);
    if (chk) chk.checked = false;
    if (item) item.classList.remove('completed');
  }
  saveTodos();
}

function saveScratchpad(val) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('hub_scratchpad_content', val);
  const st = document.getElementById('scratchpad-status');
  if (st) {
    st.textContent = 'Saved';
    setTimeout(() => { if (st) st.textContent = 'Saved'; }, 1000);
  }
}

function loadScratchpad() {
  if (typeof localStorage === 'undefined') return;
  const saved = localStorage.getItem('hub_scratchpad_content');
  const sp = document.getElementById('hub-scratchpad');
  if (sp && saved) sp.value = saved;
}

function clearScratchpad() {
  const sp = document.getElementById('hub-scratchpad');
  if (sp) sp.value = '';
  if (typeof localStorage !== 'undefined') localStorage.removeItem('hub_scratchpad_content');
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function initHubInteractions() {
  loadTodos();
  loadScratchpad();
  updateCardDisplay();
}

function setupNavigation() {
  const logoBtn = document.querySelector('.logo-area');
  if (logoBtn) {
    logoBtn.addEventListener('click', navigateHome);
    logoBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateHome();
      }
    });
  }
  document.querySelectorAll('nav button[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.getAttribute('data-view');
      if (targetView) {
        switchTab(targetView, true);
      }
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

function switchTab(viewId, isNavClick = false) {
  if (!viewId) return;
  if (viewId === 'dashboard-view' || viewId === 'docs-view') {
    viewId = 'codex-reader';
  }
  document.querySelectorAll('nav button[data-view]').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-view') === viewId);
  });
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.toggle('active', sec.id === viewId);
  });

  // If opening Reader Mode tab directly from navbar or with no active note, default to first individual note
  if (viewId === 'codex-reader') {
    if (!currentActiveCodexId || (isNavClick && currentActiveCodexId.startsWith('MASTER-'))) {
      viewCodex('SRC-YT-2026-003');
    }
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

if (typeof window !== 'undefined') {
  window.setReadingMode = setReadingMode;
  window.applyReadingMode = applyReadingMode;
  window.setReaderSection = setReaderSection;
  window.syncReaderSectionUI = syncReaderSectionUI;
  window.viewCodex = viewCodex;
  window.filterReaderCategory = filterReaderCategory;
  window.navigateHome = navigateHome;
  window.openReaderMode = openReaderMode;
  window.shuffleWisdom = shuffleWisdom;
  window.toggleTodo = toggleTodo;
  window.resetTodos = resetTodos;
  window.saveScratchpad = saveScratchpad;
  window.clearScratchpad = clearScratchpad;
  window.nextFlashcard = nextFlashcard;
  window.prevFlashcard = prevFlashcard;
  window.toggleFlashcardAnswer = toggleFlashcardAnswer;
  window.scrollToSection = scrollToSection;
  window.handleReaderSearch = handleReaderSearch;
  window.switchTab = switchTab;
  window.navigateHome = navigateHome;
  window.toggleSidebar = toggleSidebar;
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
    setReadingMode,
    applyReadingMode,
    renderMarkdown,
    setManifestData: (data) => { manifestData = data; }
  };
}
