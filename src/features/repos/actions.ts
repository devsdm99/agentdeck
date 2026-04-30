import 'server-only';
import { db } from '@/lib/db';
import { repos } from '@/lib/db/schema';
import type { Repo } from '@/lib/db/schema';
import { createRepoInputSchema, type CreateRepoInput } from './schemas';
import { ValidationError } from '@/shared/errors';

export async function createRepo(input: CreateRepoInput): Promise<Repo> {
  const parsed = createRepoInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      `Invalid repo input: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    );
  }

  const [created] = await db
    .insert(repos)
    .values({
      userId: parsed.data.userId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
    })
    .returning();

  return created;
}
