import { sha256Hex } from '@/utils/hash';
import type { ParsedAgent, VirtualFile } from '@/shared/types';
import { asString, asStringArray, parseFrontmatter } from './frontmatter';

const CANONICAL_AGENT_PATH_RE = /(^|\/)\.claude\/agents\/([^/]+)\.md$/i;
const SKILL_PATH_RE =
  /(^|\/)\.claude\/skills\/([^/]+)(?:\/SKILL\.md|\.md)$/i;
const SETTINGS_PATH_RE = /(^|\/)\.claude\/settings(?:\.local)?\.json$/i;
const MARKDOWN_EXT_RE = /\.(md|mdx|markdown)$/i;

export function isAgentFile(file: VirtualFile): boolean {
  if (CANONICAL_AGENT_PATH_RE.test(file.path)) return true;
  if (!isAlternativeCandidate(file.path)) return false;
  return hasStrictAgentFrontmatter(file);
}

export function parseAgent(file: VirtualFile): ParsedAgent | null {
  const canonical = file.path.match(CANONICAL_AGENT_PATH_RE);

  const rawContent = new TextDecoder().decode(file.bytes);
  const { frontmatter, body } = parseFrontmatter(rawContent);

  if (!canonical && !looksLikeStrictAgentFrontmatter(frontmatter)) {
    return null;
  }

  const fallbackName = canonical
    ? canonical[2]
    : basenameNoExt(file.path);
  const name = asString(frontmatter['name']) ?? fallbackName;
  const description = asString(frontmatter['description']);
  const model = asString(frontmatter['model']);
  const tools = parseAgentTools(frontmatter['tools']);

  return {
    path: file.path,
    name,
    description,
    model,
    tools,
    frontmatter,
    bodyMd: body,
    rawContent,
    sizeBytes: file.bytes.byteLength,
    sha256: sha256Hex(file.bytes),
  };
}

function parseAgentTools(value: unknown): string[] {
  if (Array.isArray(value)) {
    return asStringArray(value);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }
  return [];
}

function hasStrictAgentFrontmatter(file: VirtualFile): boolean {
  const rawContent = new TextDecoder().decode(file.bytes);
  const { frontmatter } = parseFrontmatter(rawContent);
  return looksLikeStrictAgentFrontmatter(frontmatter);
}

function looksLikeStrictAgentFrontmatter(
  frontmatter: Record<string, unknown>,
): boolean {
  const name = asString(frontmatter['name']);
  const description = asString(frontmatter['description']);
  return name !== null && description !== null;
}

function isAlternativeCandidate(path: string): boolean {
  if (path.includes('.claude/')) return false;
  if (!MARKDOWN_EXT_RE.test(path)) return false;
  if (SKILL_PATH_RE.test(path)) return false;
  if (SETTINGS_PATH_RE.test(path)) return false;
  return true;
}

function basenameNoExt(path: string): string {
  const file = path.slice(path.lastIndexOf('/') + 1);
  return file.replace(MARKDOWN_EXT_RE, '');
}
