import 'server-only';
import JSZip from 'jszip';
import type { VirtualFile } from '@/shared/types';
import { ValidationError } from '@/shared/errors';

export const MAX_ZIP_BYTES = 10 * 1024 * 1024;
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
const TEXT_EXTENSIONS = new Set([
  'md',
  'json',
  'yml',
  'yaml',
  'txt',
  'toml',
  'sh',
  'mjs',
  'js',
  'ts',
]);

export async function virtualFilesFromZip(buffer: ArrayBuffer): Promise<VirtualFile[]> {
  if (buffer.byteLength > MAX_ZIP_BYTES) {
    throw new ValidationError(
      `Zip excede el tamaño máximo (${MAX_ZIP_BYTES} bytes)`,
    );
  }

  const zip = await JSZip.loadAsync(buffer);
  const files: VirtualFile[] = [];

  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    if (!isInterestingPath(entry.name)) continue;

    const bytes = await entry.async('uint8array');
    if (bytes.byteLength > MAX_FILE_BYTES) continue;

    files.push({ path: stripTopLevelDir(entry.name), bytes });
  }

  return files;
}

function isInterestingPath(path: string): boolean {
  const normalized = stripTopLevelDir(path);
  if (normalized.includes('.claude/')) return true;
  if (/(^|\/)CLAUDE\.md$/i.test(normalized)) return true;
  if (/(^|\/)AGENTS\.md$/i.test(normalized)) return true;
  return false;
}

function stripTopLevelDir(path: string): string {
  const slashIdx = path.indexOf('/');
  if (slashIdx === -1) return path;
  return path.slice(slashIdx + 1);
}

export function isLikelyTextFile(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return TEXT_EXTENSIONS.has(ext);
}
