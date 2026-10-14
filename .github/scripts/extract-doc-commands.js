#!/usr/bin/env node
/*
 * Extracts documented shell commands straight from the installation guide so
 * CI runs exactly what the docs tell users to run (no hardcoded copies that can
 * drift). Commands are identified either by the stable id attached to their
 * fenced code block in Markdown, e.g.:
 *
 *     ```bash {#build-drasi-server}
 *     cargo install --path . --root . --locked
 *     ```
 *
 * ...or, for commands presented inside Docsy tab shortcodes (which have no code
 * fence to hang an id on), by the tab's `header`, e.g.:
 *
 *     {{< tab header="Linux (x64)" lang="bash" >}}
 *     mkdir -p bin
 *     curl -fsSL .../drasi-server-x86_64-linux-gnu -o bin/drasi-server
 *     {{< /tab >}}
 *
 * Usage:
 *   node .github/scripts/extract-doc-commands.js <target> <group>
 *     build-from-source: <linux|macos|windows> <prereqs|build>
 *     download-binary:   <download-*> <download|verify>
 *
 * Prints the concatenated command text (in documented order) to stdout.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

const PREREQS = 'docs/shared-content/installation/drasi-server/build-from-source-prereqs.md';
const BUILD = 'docs/content/drasi-server/how-to-guides/installation/build-from-source/_index.md';
const SSE = 'docs/content/drasi-server/how-to-guides/installation/install-sse-cli/_index.md';
const DOWNLOAD = 'docs/shared-content/installation/drasi-server/download-binary.md';

// The build/verify sequence is identical across platforms; only the native
// dependency step differs. Each entry is { file, id } (fenced code block) or
// { file, tab } (Docsy tab shortcode), in execution order.
const BUILD_SEQUENCE = [
  { file: BUILD, id: 'clone-drasi-server' },
  { file: BUILD, id: 'build-drasi-server' },
  { file: BUILD, id: 'verify-drasi-server' },
  { file: SSE, id: 'build-sse-cli' },
  { file: SSE, id: 'verify-sse-cli' },
];

const MANIFEST = {
  linux: {
    prereqs: [{ file: PREREQS, id: 'linux-native-deps' }, { file: PREREQS, id: 'linux-jq-lib-dir' }],
    build: BUILD_SEQUENCE,
  },
  macos: {
    prereqs: [{ file: PREREQS, id: 'macos-native-deps' }, { file: PREREQS, id: 'macos-jq-lib-dir' }],
    build: BUILD_SEQUENCE,
  },
  windows: {
    prereqs: [{ file: PREREQS, id: 'windows-native-deps' }],
    build: BUILD_SEQUENCE,
  },
};

// The Download Binary guide presents one command block per platform/arch inside
// Docsy tab shortcodes. Each variant maps to its tab header; the verify step is
// the same fenced block for every variant.
const DOWNLOAD_TABS = {
  'download-macos-apple-silicon': 'macOS (Apple Silicon)',
  'download-macos-intel': 'macOS (Intel)',
  'download-linux-x64': 'Linux (x64)',
  'download-linux-arm64': 'Linux (ARM64)',
  'download-linux-musl-x64': 'Linux musl (x64)',
  'download-linux-musl-arm64': 'Linux musl (ARM64)',
  'download-windows-x64': 'Windows (x64)',
};
for (const [target, header] of Object.entries(DOWNLOAD_TABS)) {
  MANIFEST[target] = {
    download: [{ file: DOWNLOAD, tab: header }],
    verify: [{ file: DOWNLOAD, id: 'verify-download' }],
  };
}

/**
 * Return the body of the fenced code block whose opening fence carries `{#id}`.
 * @param {string} file Repo-relative path to a Markdown file.
 * @param {string} id Snippet id declared as `{#id}` on the code fence.
 */
function extractSnippet(file, id) {
  const abs = path.join(REPO_ROOT, file);
  const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
  const escaped = id.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const openFence = new RegExp('^```.*\\{#' + escaped + '\\}');

  let i = lines.findIndex((line) => openFence.test(line));
  if (i === -1) {
    throw new Error(`Snippet #${id} not found in ${file}`);
  }

  const body = [];
  for (i += 1; i < lines.length; i++) {
    if (/^```\s*$/.test(lines[i])) {
      return body.join('\n');
    }
    body.push(lines[i]);
  }
  throw new Error(`Unterminated snippet #${id} in ${file}`);
}

/**
 * Return the body of a Docsy tab shortcode identified by its `header`.
 * @param {string} file Repo-relative path to a Markdown file.
 * @param {string} header The tab's `header="..."` value.
 */
function extractTab(file, header) {
  const abs = path.join(REPO_ROOT, file);
  const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
  const escaped = header.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const openTab = new RegExp('{{[<%]\\s*tab\\b[^}]*header="' + escaped + '"');
  const closeTab = /{{[<%]\s*\/tab\s*[%>]}}/;

  let i = lines.findIndex((line) => openTab.test(line));
  if (i === -1) {
    throw new Error(`Tab "${header}" not found in ${file}`);
  }

  const body = [];
  for (i += 1; i < lines.length; i++) {
    if (closeTab.test(lines[i])) {
      return body.join('\n');
    }
    body.push(lines[i]);
  }
  throw new Error(`Unterminated tab "${header}" in ${file}`);
}

/** Dispatch an entry to the right extractor based on whether it names an id or a tab. */
function extractEntry(entry) {
  return entry.tab ? extractTab(entry.file, entry.tab) : extractSnippet(entry.file, entry.id);
}

function main() {
  const [target, group] = process.argv.slice(2);
  const groups = MANIFEST[target];
  if (!groups || !groups[group]) {
    process.stderr.write(
      'Usage: node .github/scripts/extract-doc-commands.js <target> <group>\n' +
      '  build-from-source: <linux|macos|windows> <prereqs|build>\n' +
      '  download-binary:   <download-*> <download|verify>\n'
    );
    process.exit(2);
  }

  const script = groups[group].map(extractEntry).join('\n');
  process.stdout.write(script + '\n');
}

main();
