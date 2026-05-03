import { ValidationError } from '@/shared/errors';

export type GithubRepoSummary = {
  owner: string;
  repo: string;
  branch: string | null;
  canonicalUrl: string;
  suggestedName: string;
  suggestedSlug: string;
};

const GITHUB_URL_RE =
  /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?(?:\/tree\/([^/]+))?$/i;

export function parseGithubRepoUrl(url: string): GithubRepoSummary {
  const trimmed = url.trim();
  const match = trimmed.match(GITHUB_URL_RE);
  if (!match) {
    throw new ValidationError(
      'URL no soportada. De momento solo URLs públicas de GitHub (https://github.com/owner/repo).',
    );
  }
  const [, ownerRaw, repoRaw, branchRaw] = match;
  const owner = ownerRaw.trim();
  const repo = repoRaw.trim();
  const branch = branchRaw && branchRaw.trim().length > 0 ? branchRaw.trim() : null;

  return {
    owner,
    repo,
    branch,
    canonicalUrl: `https://github.com/${owner}/${repo}`,
    suggestedName: repo,
    suggestedSlug: toSlug(`${owner}-${repo}`),
  };
}

const SLUG_INVALID_CHARS = /[^a-z0-9]+/g;
const SLUG_TRIM_DASHES = /^-+|-+$/g;

export function toSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(SLUG_INVALID_CHARS, '-')
    .replace(SLUG_TRIM_DASHES, '')
    .slice(0, 80);
}
