#!/usr/bin/env node
// Bumps the plugin version in every per-agent manifest from one argument:
//   node scripts/bump-version.mjs 2.0.0

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
  console.error('Usage: node scripts/bump-version.mjs <semver>');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const manifests = [
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  '.cursor-plugin/plugin.json',
  '.cursor-plugin/marketplace.json',
  '.codex-plugin/plugin.json',
  '.agents/plugins/marketplace.json',
];

function bump(node) {
  if (Array.isArray(node)) {
    node.forEach(bump);
    return;
  }
  if (node && typeof node === 'object') {
    if (typeof node.version === 'string') node.version = version;
    Object.values(node).forEach(bump);
  }
}

for (const relPath of manifests) {
  const path = join(root, relPath);
  let json;
  try {
    json = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    console.warn(`skip ${relPath} (missing or invalid JSON)`);
    continue;
  }
  bump(json);
  writeFileSync(path, JSON.stringify(json, null, 2) + '\n');
  console.log(`bumped ${relPath} -> ${version}`);
}
