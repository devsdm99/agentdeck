const CLAUDE_DIR_PREFIX = '.claude/';
const ROOT_CLAUDE_MD = /(^|\/)CLAUDE\.md$/i;
const ROOT_AGENTS_MD = /(^|\/)AGENTS\.md$/i;

const ALWAYS_SKIPPED_BASENAMES = new Set([
  'readme.md',
  'changelog.md',
  'license.md',
  'contributing.md',
  'security.md',
  'code_of_conduct.md',
]);

const SKIPPED_TOP_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'out',
  '.cache',
  'coverage',
]);

const MARKDOWN_EXT_RE = /\.(md|mdx|markdown)$/i;

export function isInterestingClaudePath(path: string): boolean {
  if (path.includes(CLAUDE_DIR_PREFIX)) return true;
  if (ROOT_CLAUDE_MD.test(path)) return true;
  if (ROOT_AGENTS_MD.test(path)) return true;
  return isPotentialAlternativeAgentFile(path);
}

export function isPotentialAlternativeAgentFile(path: string): boolean {
  if (!MARKDOWN_EXT_RE.test(path)) return false;
  if (isInsideSkippedDir(path)) return false;
  const base = basename(path).toLowerCase();
  if (ALWAYS_SKIPPED_BASENAMES.has(base)) return false;
  if (path.split('/').length < 2) return false;
  return true;
}

function isInsideSkippedDir(path: string): boolean {
  const parts = path.split('/');
  for (const part of parts) {
    if (SKIPPED_TOP_DIRS.has(part)) return true;
  }
  return false;
}

function basename(path: string): string {
  const idx = path.lastIndexOf('/');
  return idx === -1 ? path : path.slice(idx + 1);
}
