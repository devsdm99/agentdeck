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
    <main className="flex flex-1 flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Tus repos</h1>
        <p className="text-sm text-muted-foreground">
          Aquí verás los repositorios que has conectado a agentdeck.
        </p>
      </header>

      {repos.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aún no has conectado ningún repo</CardTitle>
            <CardDescription>
              Cuando el flujo de añadir repos esté disponible (próxima
              versión), tu primer escaneo aparecerá aquí.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => (
            <Card key={repo.id}>
              <CardHeader>
                <CardTitle>{repo.name}</CardTitle>
                <CardDescription>{repo.slug}</CardDescription>
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
      )}
    </main>
  );
}
