import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { repos } from '@/lib/db/schema';
import type { Repo } from '@/lib/db/schema';

export async function getRepoById(id: string): Promise<Repo | null> {
  const rows = await db.select().from(repos).where(eq(repos.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listReposByUser(userId: string): Promise<Repo[]> {
  return db
    .select()
    .from(repos)
    .where(eq(repos.userId, userId))
    .orderBy(repos.createdAt);
}
