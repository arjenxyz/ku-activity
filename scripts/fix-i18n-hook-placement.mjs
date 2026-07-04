#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function getErrorFiles() {
  try {
    execSync('npx tsc --noEmit', { cwd: ROOT, stdio: 'pipe' });
    return [];
  } catch (e) {
    const output = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    const files = new Set();
    for (const line of output.split('\n')) {
      const m = line.match(/^(src\/[^(]+\.tsx?)\(/);
      if (m) files.add(path.join(ROOT, m[1].replace(/\//g, path.sep)));
    }
    return [...files];
  }
}

function findFunctionRanges(content) {
  const ranges = [];
  const patterns = [
    /(?:export\s+default\s+)?(?:export\s+)?function\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*\{/g,
    /(?:export\s+default\s+)?(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{/g,
  ];

  for (const re of patterns) {
    let match;
    while ((match = re.exec(content)) !== null) {
      const open = match.index + match[0].length - 1;
      let depth = 0;
      for (let i = open; i < content.length; i += 1) {
        if (content[i] === '{') depth += 1;
        else if (content[i] === '}') {
          depth -= 1;
          if (depth === 0) {
            ranges.push({ name: match[1], start: open + 1, end: i, openBrace: open });
            break;
          }
        }
      }
    }
  }
  return ranges;
}

function getRegistryKey(content) {
  const m = content.match(/useRegistryStrings\('([^']+)'\)/);
  return m?.[1] ?? null;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const key = getRegistryKey(content);
  if (!key || !content.includes('useRegistryStrings')) return false;

  if (!content.includes("import { useRegistryStrings }")) {
    content = content.replace(/^('use client';?\s*\n)/, `$1\nimport { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';\n`);
  }

  const ranges = findFunctionRanges(content);
  let changed = false;

  for (const range of ranges) {
    const body = content.slice(range.start, range.end);
    if (!/\bstrings\./.test(body)) continue;
    if (/useRegistryStrings\(/.test(body)) continue;

    const lineStart = content.lastIndexOf('\n', range.openBrace) + 1;
    const indent = content.slice(lineStart, range.openBrace).replace(/\{$/, '') + '  ';
    const insertion = `${indent}const strings = useRegistryStrings('${key}');\n`;
    content = content.slice(0, range.start) + insertion + content.slice(range.start);
    changed = true;

    const offset = insertion.length;
    for (const r of ranges) {
      if (r.start >= range.start) {
        r.start += offset;
        r.end += offset;
        if (r.openBrace >= range.start) r.openBrace += offset;
      }
    }
  }

  if (changed) fs.writeFileSync(filePath, content);
  return changed;
}

const files = getErrorFiles();
let fixed = 0;
for (const file of files) {
  if (fixFile(file)) {
    fixed += 1;
    console.log('Fixed', path.relative(ROOT, file));
  }
}
console.log(`Done. fixed=${fixed}/${files.length}`);
