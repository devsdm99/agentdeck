import 'server-only';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { repoSources } from '@/lib/db/schema';
import { NotFoundError } from '@/shared/errors';
import { virtualFilesFromGithub, parseGithubUrl } from './ingest/from-url';
import { virtualFilesFromZip } from './ingest/from-zip';
import { parseClaudeDirectory } from './service';
import { persistScan } from './persist';
import type { ScanFromUrlInput, ScanFromZipMeta } from './schemas';

export type ScanActionResult = {
  scanId: string;
  agentsCount: number;
  skillsCount: number;
  hooksCount: number;
  totalFiles: number;
};

export async function runScanFromUrl(input: ScanFromUrlInput): Promise<ScanActionResult> {
  const ref = parseGithubUrl(input.url);
  const sourceId = await ensureUrlSource(input.repoId, input.url, ref.branch);

  const { files, resolvedBranch } = await virtualFilesFromGithub(ref);
  const parsed = parseClaudeDirectory(files);

  const { scanId } = await persistScan({
    repoId: input.repoId,
    sourceId,
    trigger: 'manual',
    branch: resolvedBranch,
    commitSha: null,
    parsed,
  });

  return {
    scanId,
    agentsCount: parsed.stats.agentsCount,
    skillsCount: parsed.stats.skillsCount,
    hooksCount: parsed.stats.hooksCount,
    totalFiles: parsed.stats.totalFiles,
  };
}

export async function runScanFromZip(
  meta: ScanFromZipMeta,
  zipBuffer: ArrayBuffer,
): Promise<ScanActionResult> {
  const sourceId = await ensureZipSource(meta.repoId);

  const files = await virtualFilesFromZip(zipBuffer);
  const parsed = parseClaudeDirectory(files);

  const { scanId } = await persistScan({
    repoId: meta.repoId,
    sourceId,
    trigger: 'manual',
    branch: null,
    commitSha: null,
    parsed,
  });

  return {
    scanId,
    agentsCount: parsed.stats.agentsCount,
    skillsCount: parsed.stats.skillsCount,
    hooksCount: parsed.stats.hooksCount,
    totalFiles: parsed.stats.totalFiles,
  };
}

async function ensureUrlSource(
  repoId: string,
  url: string,
  defaultBranch: string,
): Promise<string> {
  const existing = await db
    .select({ id: repoSources.id })
    .from(repoSources)
    .where(
      and(
        eq(repoSources.repoId, repoId),
        eq(repoSources.kind, 'url_public'),
        eq(repoSources.url, url),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(repoSources)
      .set({ lastUsedAt: new Date() })
      .where(eq(repoSources.id, existing[0].id));
    return existing[0].id;
  }

  const [created] = await db
    .insert(repoSources)
    .values({
      repoId,
      kind: 'url_public',
      url,
      defaultBranch,
      lastUsedAt: new Date(),
    })
    .returning({ id: repoSources.id });
  return created.id;
}

async function ensureZipSource(repoId: string): Promise<string> {
  const existing = await db
    .select({ id: repoSources.id })
    .from(repoSources)
    .where(
      and(eq(repoSources.repoId, repoId), eq(repoSources.kind, 'zip_upload')),
    )
    .orderBy(desc(repoSources.createdAt))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(repoSources)
      .set({ lastUsedAt: new Date() })
      .where(eq(repoSources.id, existing[0].id));
    return existing[0].id;
  }

  const [created] = await db
    .insert(repoSources)
    .values({ repoId, kind: 'zip_upload', lastUsedAt: new Date() })
    .returning({ id: repoSources.id });
  return created.id;
}

export async function assertRepoExists(repoId: string): Promise<void> {
  const existing = await db
    .select({ id: repoSources.repoId })
    .from(repoSources)
    .where(eq(repoSources.repoId, repoId))
    .limit(1);
  if (existing.length === 0) {
    // No source registered yet, but the repo row must exist — checked at API
    // route level via repos table to avoid coupling here.
    throw new NotFoundError(`Repo not found: ${repoId}`);
  }
}
