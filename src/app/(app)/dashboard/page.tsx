import { listReposByUser } from '@/features/repos/queries';
import { requireUser } from '@/features/auth/queries';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function DashboardPage(): Promise<React.ReactElement> {
  const user = await requireUser();
  const repos = await listReposByUser(user.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-10 sm:px-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Repositorios
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Tus repos</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Aquí verás los repositorios que has conectado a agentdeck. Cada repo
          puede tener varios scans históricos.
        </p>
      </header>

      {repos.length === 0 ? <EmptyRepos /> : <ReposGrid repos={repos} />}
    </main>
  );
}

function EmptyRepos(): React.ReactElement {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background-image:radial-gradient(oklch(var(--primary)/0.08)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_30%,transparent_80%)]"
      />
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CodeIcon />
      </div>
      <h2 className="mt-5 text-lg font-semibold tracking-tight">
        Aún no has conectado ningún repo
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Cuando el flujo de añadir repos esté disponible (próxima versión), tu
        primer escaneo aparecerá aquí.
      </p>
    </div>
  );
}

function ReposGrid({
  repos,
}: {
  repos: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
  }>;
}): React.ReactElement {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {repos.map((repo) => (
        <Card
          key={repo.id}
          className="border-border/70 transition-colors hover:border-primary/40"
        >
          <CardHeader>
            <CardTitle className="text-base">{repo.name}</CardTitle>
            <CardDescription className="font-mono text-xs">
              {repo.slug}
            </CardDescription>
          </CardHeader>
          {repo.description ? (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {repo.description}
              </p>
            </CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

function CodeIcon(): React.ReactElement {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
