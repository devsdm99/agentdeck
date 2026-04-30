import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { UnauthorizedError } from '@/shared/errors';
import type { User } from '@supabase/supabase-js';

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) {
    throw new UnauthorizedError('No authenticated user');
  }
  return user;
}
