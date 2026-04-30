import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AuthForm } from '@/components/features/auth/auth-form';
import { loginAction } from '@/features/auth/actions';
import { getUser } from '@/features/auth/queries';

type SearchParams = Promise<{ next?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<React.ReactElement> {
  const user = await getUser();
  const params = await searchParams;
  const next = pickNext(params.next);

  if (user) {
    redirect(next);
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar a agentdeck</CardTitle>
          <CardDescription>
            Accede con tu email y contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm
            action={loginAction}
            submitLabel="Entrar"
            pendingLabel="Entrando…"
            next={next}
          />
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            ¿Aún no tienes cuenta?{' '}
            <Link href="/signup" className="underline">
              Crea una
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

function pickNext(raw: string | undefined): string {
  if (!raw) return '/dashboard';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard';
  return raw;
}
