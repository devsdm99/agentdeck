import { NextResponse } from 'next/server';
import { runScanFromUrl } from '@/features/scans/actions';
import { scanFromUrlInputSchema } from '@/features/scans/schemas';
import {
  ExternalServiceError,
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
    const body = await request.json();
    const input = scanFromUrlInputSchema.parse(body);

    const repo = await getRepoById(input.repoId);
    if (!repo) throw new NotFoundError(`Repo not found: ${input.repoId}`);
    if (repo.userId !== user.id) {
      throw new ForbiddenError('No autorizado a escanear este repo');
    }

    const result = await runScanFromUrl(input);
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
  if (err instanceof ExternalServiceError) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
  if (err instanceof Error && err.name === 'ZodError') {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  console.error('[scan/from-url] unexpected error:', err);
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}
