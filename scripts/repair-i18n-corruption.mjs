#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const corruptRe =
  /function ([A-Za-z0-9_]+)\(((?:[^()"]|"[^"]*")*)\)\s*\{function \1\(\2\)\s+const strings = useRegistryStrings\('([^']+)'\);/g;

let fixed = 0;
for (const file of walk(SRC)) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('{function ')) continue;
  const next = content.replace(
    corruptRe,
    (_m, name, params, key) => `function ${name}(${params}) {\n  const strings = useRegistryStrings('${key}');`
  );
  if (next !== content) {
    fs.writeFileSync(file, next);
    fixed += 1;
    console.log(path.relative(ROOT, file));
  }
}
console.log(`Repaired ${fixed} files.`);
