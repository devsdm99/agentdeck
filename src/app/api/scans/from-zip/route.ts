import { NextResponse } from 'next/server';
import { runScanFromZip } from '@/features/scans/actions';
import { scanFromZipMetaSchema } from '@/features/scans/schemas';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/shared/errors';
import { getRepoById } from '@/features/repos/queries';
import { requireUser } from '@/features/auth/queries';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const formData = await request.formData();
    const repoIdEntry = formData.get('repoId');
    const fileEntry = formData.get('file');

    if (typeof repoIdEntry !== 'string') {
      throw new ValidationError('Missing repoId field');
    }
    if (!(fileEntry instanceof File)) {
      throw new ValidationError('Missing file field');
    }

    const meta = scanFromZipMetaSchema.parse({ repoId: repoIdEntry });
    const repo = await getRepoById(meta.repoId);
    if (!repo) throw new NotFoundError(`Repo not found: ${meta.repoId}`);
    if (repo.userId !== user.id) {
      throw new ForbiddenError('No autorizado a escanear este repo');
    }

    const buffer = await fileEntry.arrayBuffer();
    const result = await runScanFromZip(meta, buffer);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

function errorResponse(err: unknown): NextResponse {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  if (err instanceof NotFoundError) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
  if (err instanceof ValidationError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  if (err instanceof Error && err.name === 'ZodError') {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  console.error('[scan/from-zip] unexpected error:', err);
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}
