#!/usr/bin/env node

/**
 * scripts/build-search-index.js
 * Compiles all sources, knowledge nodes, claims, relationships,
 * and documentation into web/manifest.json for the static web reader.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(REPO_ROOT, 'sources', 'registry.json');
const NODES_DIR = path.join(REPO_ROOT, 'knowledge', 'tree', 'nodes');
const EDGES_PATH = path.join(REPO_ROOT, 'knowledge', 'tree', 'edges', 'edges.jsonl');
const DOCS_DIR = path.join(REPO_ROOT, 'docs');
const MANIFEST_PATH = path.join(REPO_ROOT, 'web', 'manifest.json');

function buildSearchIndex() {
  console.log('[Index Builder] Compiling repository assets into web/manifest.json...');

  // 1. Sources
  let sources = [];
  if (fs.existsSync(REGISTRY_PATH)) {
    const reg = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
    sources = reg.sources || [];
  }

  // 2. Nodes & Claims
  const concepts = [];
  const claims = [];

  if (fs.existsSync(NODES_DIR)) {
    const nodeFiles = fs.readdirSync(NODES_DIR);
    nodeFiles.forEach(f => {
      if (f.endsWith('.json')) {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(NODES_DIR, f), 'utf-8'));
          if (data.node_type === 'concept') {
            concepts.push(data);
          } else if (data.node_type === 'claim') {
            claims.push(data);
          }
        } catch (e) {
          console.warn(`[WARN] Skipping malformed node file: ${f}`);
        }
      }
    });
  }

  // 3. Edges
  const edges = [];
  if (fs.existsSync(EDGES_PATH)) {
    const lines = fs.readFileSync(EDGES_PATH, 'utf-8').split('\n');
    lines.forEach(l => {
      if (l.trim()) {
        try {
          const edge = JSON.parse(l);
          if (edge.edge_id) edges.push(edge);
        } catch (e) {}
      }
    });
  }

  // 4. Documentation Index
  const docs = [];
  if (fs.existsSync(DOCS_DIR)) {
    const docFiles = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md')).sort();
    docFiles.forEach(f => {
      const content = fs.readFileSync(path.join(DOCS_DIR, f), 'utf-8');
      const firstLine = content.split('\n')[0].replace(/^#\s*/, '').trim();
      docs.push({
        filename: f,
        title: firstLine,
        path: `docs/${f}`
      });
    });
  }

  // 5. Construct Manifest Payload
  const manifest = {
    version: '1.0.0',
    built_at: new Date().toISOString(),
    metrics: {
      total_sources: sources.length,
      total_concepts: concepts.length,
      total_claims: claims.length,
      total_edges: edges.length,
      total_docs: docs.length
    },
    sources,
    concepts,
    claims,
    edges,
    documentation: docs
  };

  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`[Index Builder] Success: Indexed ${sources.length} sources, ${concepts.length} concepts, ${claims.length} claims, ${edges.length} edges, ${docs.length} docs.`);
  console.log(`[Index Builder] Written to ${path.relative(REPO_ROOT, MANIFEST_PATH)}`);
  return manifest;
}

if (require.main === module) {
  buildSearchIndex();
}

module.exports = {
  buildSearchIndex
};
