#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_ROOT = path.join(ROOT, 'src');

const IMPORT_RE = /^import strings from '@json\/src\/(.+)\.json';?\s*$/gm;
const HOOK_IMPORT = "import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';";

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(tsx|ts)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function findMatchingBrace(content, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < content.length; i += 1) {
    const ch = content[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function injectHookIntoFirstFunction(content, hookLine) {
  const patterns = [
    /export function ([A-Za-z0-9_]+)\([^)]*\)\s*\{/,
    /export default function ([A-Za-z0-9_]+)\([^)]*\)\s*\{/,
    /function ([A-Za-z0-9_]+)\([^)]*\)\s*\{/,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (!match || match.index === undefined) continue;
    const openBrace = match.index + match[0].length - 1;
    if (content.slice(openBrace + 1, openBrace + 1 + hookLine.length + 2).includes('useRegistryStrings')) {
      return content;
    }
    return `${content.slice(0, openBrace + 1)}\n${hookLine}${content.slice(openBrace + 1)}`;
  }
  return content;
}

function transform(content) {
  if (!IMPORT_RE.test(content)) return null;
  IMPORT_RE.lastIndex = 0;

  const keys = [...content.matchAll(/^import strings from '@json\/src\/(.+)\.json';?\s*$/gm)].map((m) => m[1]);
  if (keys.length !== 1) return null;

  const key = keys[0];
  let next = content.replace(/^import strings from '@json\/src\/(.+)\.json';?\s*$/gm, '');
  if (!next.includes(HOOK_IMPORT)) {
    const firstImport = next.search(/^import /m);
    const lineEnd = next.indexOf('\n', firstImport);
    next = `${next.slice(0, lineEnd + 1)}${HOOK_IMPORT}\n${next.slice(lineEnd + 1)}`;
  }

  const hookLine = `  const strings = useRegistryStrings('${key}');`;
  next = injectHookIntoFirstFunction(next, `\n${hookLine}`);

  // Move simple module-level const that only depends on strings.* into function if still broken
  return next;
}

function main() {
  let changed = 0;
  for (const file of walk(SRC_ROOT)) {
    if (file.includes('strings-registry.ts') || file.includes('useRegistryStrings.ts')) continue;
    const original = fs.readFileSync(file, 'utf8');
    if (!original.includes("'use client'") && !original.includes('"use client"')) continue;
    if (!original.includes("@json/src/")) continue;
    const next = transform(original);
    if (next && next !== original) {
      fs.writeFileSync(file, next);
      changed += 1;
      console.log(path.relative(ROOT, file));
    }
  }
  console.log(`Updated ${changed} client files.`);
}

main();
