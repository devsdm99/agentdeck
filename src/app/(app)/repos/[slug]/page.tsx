import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/features/auth/queries';
import {
  getPrimarySourceForRepo,
  getRepoBySlug,
} from '@/features/repos/queries';
import { listScansByRepo, type ScanWithStats } from '@/features/scans/queries';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RescanButton } from '@/components/features/repos/rescan-button';

type Params = Promise<{ slug: string }>;

export default async function RepoDetailPage({
  params,
}: {
  params: Params;
}): Promise<React.ReactElement> {
  const user = await requireUser();
  const { slug } = await params;

  const repo = await getRepoBySlug(user.id, slug);
  if (!repo) notFound();

  const [scans, primarySource] = await Promise.all([
    listScansByRepo(repo.id),
    getPrimarySourceForRepo(repo.id),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-10 sm:px-10">
      <header className="flex flex-col gap-3">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver al dashboard
        </Link>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Repositorio
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {repo.name}
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            {repo.slug}
          </p>
        </div>
        {repo.description ? (
          <p className="max-w-xl text-sm text-muted-foreground">
            {repo.description}
          </p>
        ) : null}
        {primarySource ? <SourceLine source={primarySource} /> : null}
      </header>

      <section className="flex flex-col gap-4">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Scans</h2>
            <p className="text-sm text-muted-foreground">
              Cada scan es un snapshot inmutable.{' '}
              {scans.length}{' '}
              {scans.length === 1 ? 'scan' : 'scans'} registrado
              {scans.length === 1 ? '' : 's'}.
            </p>
          </div>
          {primarySource &&
          primarySource.kind === 'url_public' &&
          primarySource.url ? (
            <RescanButton slug={repo.slug} />
          ) : null}
        </header>

        {scans.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">
                Aún no hay scans para este repo
              </CardTitle>
              <CardDescription>
                Cuando ejecutemos el primer escaneo, aparecerá aquí.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {scans.map((scan) => (
              <ScanRow key={scan.id} scan={scan} repoSlug={slug} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function SourceLine({
  source,
}: {
  source: { kind: string; url: string | null; defaultBranch: string | null };
}): React.ReactElement {
  if (source.kind === 'url_public' && source.url) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-border bg-card px-2 py-0.5 font-medium uppercase tracking-wider">
          URL pública
        </span>
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-foreground underline-offset-4 hover:underline"
        >
          {source.url.replace(/^https?:\/\//, '')}
        </a>
        {source.defaultBranch ? (
          <span className="font-mono">· {source.defaultBranch}</span>
        ) : null}
      </div>
    );
  }
  if (source.kind === 'zip_upload') {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-border bg-card px-2 py-0.5 font-medium uppercase tracking-wider">
          Zip upload
        </span>
        <span>Subido manualmente</span>
      </div>
    );
  }
  return (
    <div className="text-xs text-muted-foreground">
      Origen: <span className="font-mono">{source.kind}</span>
    </div>
  );
}

function ScanRow({
  scan,
  repoSlug,
}: {
  scan: ScanWithStats;
  repoSlug: string;
}): React.ReactElement {
  const isEmpty =
    scan.status === 'success' &&
    scan.totalFiles === 0 &&
    scan.agentsCount === 0 &&
    scan.skillsCount === 0 &&
    scan.hooksCount === 0;

  return (
    <Link
      href={`/repos/${repoSlug}/scans/${scan.id}`}
      className="group block focus:outline-none"
    >
      <Card className="border-border/70 transition-colors group-hover:border-primary/40 group-focus-visible:border-primary/60 group-focus-visible:ring-3 group-focus-visible:ring-ring/30">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusDot status={scan.status} />
              <span className="text-sm font-medium">
                {formatDate(scan.startedAt)}
              </span>
              {scan.branch ? (
                <span className="font-mono text-xs text-muted-foreground">
                  · {scan.branch}
                </span>
              ) : null}
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                · {scan.trigger}
              </span>
            </div>
            {scan.errorMessage ? (
              <p className="truncate text-xs text-destructive">
                {scan.errorMessage}
              </p>
            ) : isEmpty ? (
              <p className="text-xs text-muted-foreground">
                Este repo no tiene un directorio{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono">
                  .claude/
                </code>{' '}
                en {scan.branch ?? 'la rama por defecto'}, o está vacío.
              </p>
            ) : null}
          </div>

          {!isEmpty ? (
            <div className="flex flex-shrink-0 items-center gap-4 text-xs text-muted-foreground">
              <Stat label="agents" value={scan.agentsCount} />
              <Stat label="skills" value={scan.skillsCount} />
              <Stat label="hooks" value={scan.hooksCount} />
              <Stat label="files" value={scan.totalFiles} />
            </div>
          ) : (
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Sin contenido
            </span>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}): React.ReactElement {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-base font-semibold text-foreground tabular-nums">
        {value}
      </span>
      <span>{label}</span>
    </div>
  );
}

function StatusDot({
  status,
}: {
  status: ScanWithStats['status'];
}): React.ReactElement {
  const map: Record<ScanWithStats['status'], string> = {
    success: 'bg-primary',
    failed: 'bg-destructive',
    running: 'bg-amber-500 animate-pulse',
    pending: 'bg-muted-foreground/40',
    cancelled: 'bg-muted-foreground/40',
  };
  return (
    <span
      aria-label={status}
      className={`inline-block size-2 rounded-full ${map[status]}`}
    />
  );
}

function formatDate(date: Date): string {
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
