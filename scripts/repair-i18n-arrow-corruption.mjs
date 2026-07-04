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

const re =
  /(const ([A-Za-z0-9_]+) = async \([^)]*\) => \{)\s+const \2 = async \([^)]*\) =>\s+const strings = useRegistryStrings\('[^']+'\);/g;

const re2 =
  /(const ([A-Za-z0-9_]+) = \([^)]*\) => \{)\s+const \2 = \([^)]*\) =>\s+const strings = useRegistryStrings\('[^']+'\);/g;

let fixed = 0;
for (const file of walk(SRC)) {
  let content = fs.readFileSync(file, 'utf8');
  let next = content.replace(re, '$1').replace(re2, '$1');
  if (next !== content) {
    fs.writeFileSync(file, next);
    fixed += 1;
    console.log(path.relative(ROOT, file));
  }
}
console.log(`Repaired ${fixed} files.`);
