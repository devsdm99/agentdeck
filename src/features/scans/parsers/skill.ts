import { sha256Hex } from '@/utils/hash';
import type { ParsedSkill, VirtualFile } from '@/shared/types';
import { asString, asStringArray, parseFrontmatter } from './frontmatter';

const SKILL_PATH_RE =
  /(^|\/)\.claude\/skills\/([^/]+)(?:\/SKILL\.md|\.md)$/i;

export function isSkillFile(file: VirtualFile): boolean {
  return SKILL_PATH_RE.test(file.path);
}

export function parseSkill(file: VirtualFile): ParsedSkill | null {
  const match = file.path.match(SKILL_PATH_RE);
  if (!match) return null;

  const rawContent = new TextDecoder().decode(file.bytes);
  const { frontmatter, body } = parseFrontmatter(rawContent);

  const fallbackName = match[2];
  const name = asString(frontmatter['name']) ?? fallbackName;
  const description = asString(frontmatter['description']);
  const triggers = parseSkillTriggers(frontmatter);

  return {
    path: file.path,
    name,
    description,
    triggers,
    frontmatter,
    bodyMd: body,
    rawContent,
    sizeBytes: file.bytes.byteLength,
    sha256: sha256Hex(file.bytes),
  };
}

function parseSkillTriggers(frontmatter: Record<string, unknown>): string[] {
  const direct = asStringArray(frontmatter['triggers']);
  if (direct.length > 0) return direct;

  const aliases = ['trigger', 'when', 'use_when', 'invoke_when'];
  for (const key of aliases) {
    const candidate = frontmatter[key];
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return [candidate];
    }
    const arr = asStringArray(candidate);
    if (arr.length > 0) return arr;
  }
  return [];
}
