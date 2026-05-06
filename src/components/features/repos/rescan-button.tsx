'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import {
  rescanRepoAction,
  type RescanRepoState,
} from '@/features/repos/actions';

export function RescanButton({
  slug,
}: {
  slug: string;
}): React.ReactElement {
  const [state, formAction, pending] = useActionState<
    RescanRepoState | undefined,
    FormData
  >(rescanRepoAction, undefined);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="slug" value={slug} />
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? 'Escaneando…' : 'Re-escanear'}
      </Button>
      {state?.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
