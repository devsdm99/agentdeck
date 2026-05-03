'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { repos } from '@/lib/db/schema';
import type { Repo } from '@/lib/db/schema';
import {
  createRepoInputSchema,
  type CreateRepoInput,
  addRepoFromUrlInputSchema,
} from './schemas';
import { getRepoBySlug } from './queries';
import { runScanFromUrl } from '@/features/scans/actions';
import { requireUser } from '@/features/auth/queries';
import {
  ConflictError,
  ExternalServiceError,
  ValidationError,
} from '@/shared/errors';
import { parseGithubRepoUrl } from './service';

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

export type AddRepoFromUrlState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<
    Record<'url' | 'name' | 'slug' | 'description', string>
  >;
};

export async function addRepoFromUrlAction(
  _prev: AddRepoFromUrlState | undefined,
  formData: FormData,
): Promise<AddRepoFromUrlState> {
  const user = await requireUser();

  const raw = {
    url: formData.get('url'),
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') ?? undefined,
  };

  const parsed = addRepoFromUrlInputSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: AddRepoFromUrlState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (
        key === 'url' ||
        key === 'name' ||
        key === 'slug' ||
        key === 'description'
      ) {
        fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, fieldErrors };
  }

  let github;
  try {
    github = parseGithubRepoUrl(parsed.data.url);
  } catch (err) {
    return {
      ok: false,
      fieldErrors: {
        url: err instanceof Error ? err.message : 'URL inválida',
      },
    };
  }

  const existing = await getRepoBySlug(user.id, parsed.data.slug);
  if (existing) {
    return {
      ok: false,
      fieldErrors: {
        slug: 'Ya tienes un repo con este slug. Elige otro.',
      },
    };
  }

  let createdRepo: Repo;
  try {
    createdRepo = await createRepo({
      userId: user.id,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
    });
  } catch (err) {
    if (err instanceof ConflictError) {
      return {
        ok: false,
        fieldErrors: { slug: 'Ya tienes un repo con este slug.' },
      };
    }
    throw err;
  }

  try {
    await runScanFromUrl({
      repoId: createdRepo.id,
      url: github.canonicalUrl,
    });
  } catch (err) {
    const message =
      err instanceof ExternalServiceError || err instanceof ValidationError
        ? err.message
        : 'No se pudo escanear el repo. Inténtalo de nuevo en unos segundos.';
    return { ok: false, error: message };
  }

  revalidatePath('/dashboard');
  revalidatePath(`/repos/${createdRepo.slug}`);
  redirect(`/repos/${createdRepo.slug}`);
}
