#!/usr/bin/env node
/**
 * Codemod: replace static @json/src imports with registry-based useRegistryStrings hook.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_ROOT = path.join(ROOT, 'src');

const IMPORT_RE = /^import strings from '@json\/src\/(.+\.json)';$/gm;
const HOOK_IMPORT = "import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';";

function walkTsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'lib' && dir.endsWith('src')) {
        // still walk lib except generated registry consumers handled individually
      }
      files.push(...walkTsFiles(full));
    } else if (/\.(tsx?|ts)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function isClientFile(content) {
  return content.includes("'use client'") || content.includes('"use client"');
}

function transformClientFile(content, filePath) {
  const matches = [...content.matchAll(IMPORT_RE)];
  if (matches.length === 0) return null;

  let next = content.replace(IMPORT_RE, '');
  const keys = matches.map((m) => m[1].replace(/\.json$/, ''));

  if (!next.includes(HOOK_IMPORT)) {
    const lines = next.split('\n');
    let insertAt = 0;
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i].startsWith('import ')) insertAt = i + 1;
      else if (lines[i].trim() && !lines[i].startsWith("'use client") && !lines[i].startsWith('"use client')) break;
    }
    lines.splice(insertAt, 0, HOOK_IMPORT);
    next = lines.join('\n');
  }

  for (const key of keys) {
    const varName = key.includes('/') ? `strings_${key.replace(/[^a-zA-Z0-9]/g, '_')}` : 'strings';
    const hookLine = `  const ${varName} = useRegistryStrings('${key}');`;
    if (next.includes(hookLine.trim())) continue;

    // Insert hook at start of first function body after exports
    const fnMatch = next.match(/(export (?:async )?function [A-Za-z0-9_]+\([^)]*\)\s*\{)/);
    if (fnMatch) {
      next = next.replace(fnMatch[1], `${fnMatch[1]}\n${hookLine}`);
    } else {
      const compMatch = next.match(/(export (?:default )?function [A-Za-z0-9_]+\([^)]*\)\s*\{)/);
      if (compMatch) {
        next = next.replace(compMatch[1], `${compMatch[1]}\n${hookLine}`);
      }
    }

    if (varName === 'strings') {
      // already uses strings name
    } else {
      next = next.replace(/\bstrings\b/g, varName);
    }
  }

  return next;
}

function transformServerFile(content) {
  const matches = [...content.matchAll(IMPORT_RE)];
  if (matches.length === 0) return null;

  let next = content.replace(
    IMPORT_RE,
    (_full, jsonPath) => {
      const key = jsonPath.replace(/\.json$/, '');
      return `import { getRegistryStrings } from '@/lib/i18n/strings-registry';\n// registry key: ${key}`;
    }
  );

  // Too invasive for server/API without manual locale wiring — skip auto transform
  return null;
}

function main() {
  const files = walkTsFiles(SRC_ROOT);
  let changed = 0;

  for (const file of files) {
    if (file.includes('strings-registry.ts') || file.includes('useRegistryStrings.ts')) continue;
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes("@json/src/")) continue;

    const transformed = isClientFile(content)
      ? transformClientFile(content, file)
      : transformServerFile(content);

    if (transformed && transformed !== content) {
      fs.writeFileSync(file, transformed);
      changed += 1;
      console.log(`Updated ${path.relative(ROOT, file)}`);
    }
  }

  console.log(`Codemod complete. changed=${changed}`);
}

main();
