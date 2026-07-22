/**
 * Generates public/web-changelog.json from recent git commits.
 * Runs on Vercel build (prebuild) so settings "Güncelleme Notları" stay in sync after each deploy.
 */
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outPath = join(root, 'public', 'web-changelog.json');

const SKIP_RE = /^(merge\b|merged\b|wip\b|tmp\b|temp\b|chore:\s*bump|bump version)/i;

function cleanMessage(raw) {
  const firstLine = String(raw || '').split(/\r?\n/)[0]?.trim() ?? '';
  if (!firstLine || SKIP_RE.test(firstLine)) return null;
  const cleaned = firstLine.replace(
    /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]*\))?:\s*/i,
    ''
  );
  return cleaned.trim() || firstLine;
}

function readGitLog(limit = 40) {
  try {
    const raw = execSync(`git log -n ${limit} --pretty=format:%H%x09%cI%x09%s`, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [sha, date, ...rest] = line.split('\t');
        return { sha, date, message: rest.join('\t') };
      });
  } catch {
    return [];
  }
}

const updates = [];
for (const row of readGitLog(40)) {
  const message = cleanMessage(row.message);
  if (!message || !row.sha) continue;
  updates.push({
    sha: row.sha,
    shortSha: row.sha.slice(0, 7),
    message,
    date: row.date || new Date().toISOString(),
  });
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(
  outPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      updates,
      latestAt: updates[0]?.date ?? null,
      source: 'git',
    },
    null,
    2
  )}\n`,
  'utf8'
);

console.log(`[web-changelog] wrote ${updates.length} updates → public/web-changelog.json`);
