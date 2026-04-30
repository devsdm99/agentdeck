import { NextResponse } from 'next/server';
import { runScanFromUrl } from '@/features/scans/actions';
import { scanFromUrlInputSchema } from '@/features/scans/schemas';
import { serverEnv } from '@/lib/env';
import {
  ExternalServiceError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/shared/errors';
import { getRepoById } from '@/features/repos/queries';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertBootstrapToken(request);

    const body = await request.json();
    const input = scanFromUrlInputSchema.parse(body);

    const repo = await getRepoById(input.repoId);
    if (!repo) throw new NotFoundError(`Repo not found: ${input.repoId}`);

    const result = await runScanFromUrl(input);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

function assertBootstrapToken(request: Request): void {
  const env = serverEnv();
  const expected = env.SCANNER_BOOTSTRAP_TOKEN;
  if (!expected) {
    throw new UnauthorizedError(
      'SCANNER_BOOTSTRAP_TOKEN not configured on server',
    );
  }
  const header = request.headers.get('authorization');
  if (header !== `Bearer ${expected}`) {
    throw new UnauthorizedError('Invalid bootstrap token');
  }
}

function errorResponse(err: unknown): NextResponse {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: err.message }, { status: 401 });
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
