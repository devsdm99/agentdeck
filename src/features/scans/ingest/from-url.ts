import 'server-only';
import { extract as createTarExtract } from 'tar-stream';
import { createGunzip } from 'node:zlib';
import { Readable } from 'node:stream';
import type { VirtualFile } from '@/shared/types';
import { ExternalServiceError, ValidationError } from '@/shared/errors';
import { MAX_FILE_BYTES, MAX_ZIP_BYTES } from './from-zip';

export type GithubRepoRef = {
  owner: string;
  repo: string;
  branch: string;
};

const GITHUB_URL_RE = /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?(?:\/tree\/([^/]+))?$/i;

export function parseGithubUrl(url: string): GithubRepoRef {
  const trimmed = url.trim();
  const match = trimmed.match(GITHUB_URL_RE);
  if (!match) {
    throw new ValidationError(
      `URL no soportada todavía. De momento solo URLs públicas de GitHub: ${url}`,
    );
  }
  const [, owner, repo, branch] = match;
  return { owner, repo, branch: branch ?? 'main' };
}

export async function virtualFilesFromGithub(
  ref: GithubRepoRef,
): Promise<{ files: VirtualFile[]; resolvedBranch: string }> {
  const branchesToTry = ref.branch === 'main' ? ['main', 'master'] : [ref.branch];

  let lastError: Error | null = null;
  for (const branch of branchesToTry) {
    try {
      const files = await downloadAndExtract(ref.owner, ref.repo, branch);
      return { files, resolvedBranch: branch };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw new ExternalServiceError(
    `No se pudo descargar el repo ${ref.owner}/${ref.repo}: ${lastError?.message ?? 'error desconocido'}`,
    { cause: lastError },
  );
}

async function downloadAndExtract(
  owner: string,
  repo: string,
  branch: string,
): Promise<VirtualFile[]> {
  const url = `https://codeload.github.com/${owner}/${repo}/tar.gz/refs/heads/${branch}`;
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new ExternalServiceError(
      `GitHub respondió ${response.status} al descargar ${owner}/${repo}@${branch}`,
    );
  }

  const contentLength = Number(response.headers.get('content-length') ?? '0');
  if (contentLength > 0 && contentLength > MAX_ZIP_BYTES * 5) {
    throw new ValidationError('El tarball del repo supera el tamaño permitido');
  }

  const files = await collectInterestingFilesFromTarball(response.body);
  return files;
}

async function collectInterestingFilesFromTarball(
  body: ReadableStream<Uint8Array>,
): Promise<VirtualFile[]> {
  return new Promise((resolve, reject) => {
    const files: VirtualFile[] = [];
    const extract = createTarExtract();

    extract.on('entry', (header, stream, next) => {
      const path = stripTopLevelDir(header.name);

      if (header.type !== 'file' || !isInterestingPath(path)) {
        stream.on('end', next);
        stream.resume();
        return;
      }

      const chunks: Buffer[] = [];
      let received = 0;
      let aborted = false;

      stream.on('data', (chunk: Buffer) => {
        if (aborted) return;
        received += chunk.byteLength;
        if (received > MAX_FILE_BYTES) {
          aborted = true;
          return;
        }
        chunks.push(chunk);
      });

      stream.on('end', () => {
        if (!aborted) {
          const buf = Buffer.concat(chunks);
          files.push({ path, bytes: new Uint8Array(buf) });
        }
        next();
      });

      stream.on('error', reject);
    });

    extract.on('finish', () => resolve(files));
    extract.on('error', reject);

    const nodeStream = Readable.fromWeb(body as never);
    nodeStream.pipe(createGunzip()).pipe(extract);
  });
}

function isInterestingPath(path: string): boolean {
  if (path.includes('.claude/')) return true;
  if (/(^|\/)CLAUDE\.md$/i.test(path)) return true;
  if (/(^|\/)AGENTS\.md$/i.test(path)) return true;
  return false;
}

function stripTopLevelDir(path: string): string {
  const slashIdx = path.indexOf('/');
  if (slashIdx === -1) return path;
  return path.slice(slashIdx + 1);
}
