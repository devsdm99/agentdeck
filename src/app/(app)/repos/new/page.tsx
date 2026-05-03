import Link from 'next/link';
import { requireUser } from '@/features/auth/queries';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AddRepoForm } from '@/components/features/repos/add-repo-form';

export default async function NewRepoPage(): Promise<React.ReactElement> {
  await requireUser();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10">
      <header className="flex flex-col gap-2">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver al dashboard
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Conectar un repo
        </h1>
        <p className="text-sm text-muted-foreground">
          Pega la URL pública de un repositorio de GitHub. agentdeck lo
          escaneará en el momento y te mostrará los agentes, skills y hooks
          que encuentre dentro de `.claude/`.
        </p>
      </header>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Datos del repo</CardTitle>
          <CardDescription>
            Rellenamos el nombre y el slug a partir de la URL. Puedes
            cambiarlos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddRepoForm />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        El upload por `.zip` y la conexión con repos privados llegan en
        próximas semanas.
      </p>
    </main>
  );
}
