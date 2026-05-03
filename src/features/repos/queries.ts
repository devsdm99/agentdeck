import 'server-only';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { repos, repoSources } from '@/lib/db/schema';
import type { Repo, RepoSource } from '@/lib/db/schema';

export async function getRepoById(id: string): Promise<Repo | null> {
  const rows = await db.select().from(repos).where(eq(repos.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getRepoBySlug(
  userId: string,
  slug: string,
): Promise<Repo | null> {
  const rows = await db
    .select()
    .from(repos)
    .where(and(eq(repos.userId, userId), eq(repos.slug, slug)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listReposByUser(userId: string): Promise<Repo[]> {
  return db
    .select()
    .from(repos)
    .where(eq(repos.userId, userId))
    .orderBy(repos.createdAt);
}

export async function getPrimarySourceForRepo(
  repoId: string,
): Promise<RepoSource | null> {
  const rows = await db
    .select()
    .from(repoSources)
    .where(eq(repoSources.repoId, repoId))
    .orderBy(desc(repoSources.lastUsedAt), desc(repoSources.createdAt))
    .limit(1);
  return rows[0] ?? null;
}
