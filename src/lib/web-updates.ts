import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import strings from '@json/src/lib/web-updates.json';

export type WebUpdateItem = {
  sha: string;
  shortSha: string;
  message: string;
  date: string;
};

type GithubCommit = {
  sha: string;
  commit?: {
    message?: string;
    author?: { date?: string } | null;
    committer?: { date?: string } | null;
  };
};

type ChangelogFile = {
  updates?: WebUpdateItem[];
  latestAt?: string | null;
  source?: string;
};

const SKIP_MESSAGE_RE =
  /^(merge\b|merged\b|wip\b|tmp\b|temp\b|chore:\s*bump|bump version)/i;

function cleanCommitMessage(raw: string): string | null {
  const firstLine = raw.split(/\r?\n/)[0]?.trim() ?? '';
  if (!firstLine) return null;
  if (SKIP_MESSAGE_RE.test(firstLine)) return null;
  const cleaned = firstLine.replace(
    /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]*\))?:\s*/i,
    ''
  );
  return cleaned.trim() || firstLine;
}

async function readStaticChangelog(): Promise<WebUpdateItem[]> {
  try {
    const path = join(process.cwd(), 'public', 'web-changelog.json');
    const raw = await readFile(path, 'utf8');
    const data = JSON.parse(raw) as ChangelogFile;
    return Array.isArray(data.updates) ? data.updates : [];
  } catch {
    return [];
  }
}

async function fetchGithubUpdates(limit: number): Promise<WebUpdateItem[] | null> {
  const token =
    process.env.GITHUB_WEB_UPDATES_TOKEN?.trim() ||
    process.env.GITHUB_TOKEN?.trim() ||
    process.env.GH_TOKEN?.trim() ||
    '';
  if (!token) return null;

  const repo = process.env.GITHUB_REPO?.trim() || 'arjenxyz/personel';
  const branch = process.env.GITHUB_UPDATES_BRANCH?.trim() || 'main';

  const res = await fetch(
    `https://api.github.com/repos/${repo}/commits?sha=${encodeURIComponent(branch)}&per_page=${Math.min(
      Math.max(limit, 1),
      50
    )}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'CrewLedger-WebUpdates',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(strings.authFailed);
    }
    if (res.status === 404) {
      throw new Error(strings.repoNotFound);
    }
    throw new Error(strings.fetchFailed);
  }

  const commits = (await res.json()) as GithubCommit[];
  const items: WebUpdateItem[] = [];
  for (const commit of commits) {
    const message = cleanCommitMessage(commit.commit?.message ?? '');
    if (!message) continue;
    const date =
      commit.commit?.author?.date ||
      commit.commit?.committer?.date ||
      new Date().toISOString();
    items.push({
      sha: commit.sha,
      shortSha: commit.sha.slice(0, 7),
      message,
      date,
    });
  }
  return items;
}

export async function fetchWebUpdates(limit = 30): Promise<{
  updates: WebUpdateItem[];
  source: 'github' | 'git';
}> {
  try {
    const live = await fetchGithubUpdates(limit);
    if (live && live.length > 0) {
      return { updates: live, source: 'github' };
    }
  } catch (err) {
    // Fall back to build-time changelog when live GitHub is unavailable.
    console.warn('[web-updates]', err instanceof Error ? err.message : err);
  }

  const staticUpdates = await readStaticChangelog();
  return { updates: staticUpdates.slice(0, limit), source: 'git' };
}
