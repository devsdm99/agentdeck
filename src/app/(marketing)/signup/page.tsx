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
import { signupAction } from '@/features/auth/actions';
import { getUser } from '@/features/auth/queries';

type SearchParams = Promise<{ next?: string }>;

export default async function SignupPage({
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
    <div className="mx-auto flex w-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="space-y-1.5">
            <CardTitle className="text-xl">Crear cuenta en agentdeck</CardTitle>
            <CardDescription>
              Tu email + una contraseña. Sin spam, sin newsletters
              sorpresa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm
              action={signupAction}
              submitLabel="Crear cuenta"
              pendingLabel="Creando…"
              next={next}
            />
          </CardContent>
          <CardFooter className="border-t border-border/60 pt-4">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link
                href="/login"
                className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
              >
                Entra aquí
              </Link>
              .
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function pickNext(raw: string | undefined): string {
  if (!raw) return '/dashboard';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard';
  return raw;
}
