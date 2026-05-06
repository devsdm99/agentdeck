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
import { getPrimarySourceForRepo, getRepoBySlug } from './queries';
import { runScanFromUrl } from '@/features/scans/actions';
import { requireUser } from '@/features/auth/queries';
import {
  ConflictError,
  ExternalServiceError,
  ForbiddenError,
  NotFoundError,
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

export type RescanRepoState = {
  ok: boolean;
  error?: string;
};

export async function rescanRepoAction(
  _prev: RescanRepoState | undefined,
  formData: FormData,
): Promise<RescanRepoState> {
  const user = await requireUser();
  const slug = formData.get('slug');
  if (typeof slug !== 'string' || slug.length === 0) {
    return { ok: false, error: 'Slug del repo no recibido.' };
  }

  const repo = await getRepoBySlug(user.id, slug);
  if (!repo) {
    throw new NotFoundError(`Repo not found: ${slug}`);
  }
  if (repo.userId !== user.id) {
    throw new ForbiddenError('No autorizado a re-escanear este repo');
  }

  const primary = await getPrimarySourceForRepo(repo.id);
  if (!primary) {
    return {
      ok: false,
      error: 'Este repo no tiene ninguna fuente. Conecta una URL primero.',
    };
  }
  if (primary.kind !== 'url_public' || !primary.url) {
    return {
      ok: false,
      error:
        'De momento solo se puede re-escanear repos conectados por URL pública.',
    };
  }

  try {
    await runScanFromUrl({ repoId: repo.id, url: primary.url });
  } catch (err) {
    console.error('[rescanRepoAction] failed:', err);
    const message =
      err instanceof ExternalServiceError || err instanceof ValidationError
        ? err.message
        : err instanceof Error
          ? `Falló el re-escaneo: ${err.message}`
          : 'No se pudo re-escanear el repo. Inténtalo de nuevo en unos segundos.';
    return { ok: false, error: message };
  }

  revalidatePath(`/repos/${repo.slug}`);
  redirect(`/repos/${repo.slug}`);
}
