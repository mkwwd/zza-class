import { redirect } from 'next/navigation';

import { createClient, hasSupabaseEnv } from '@/lib/supabase/server';

import { canManageCourses, type Role } from './access';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type Profile = {
  email: string | null;
  role: Role;
};

export async function requireUser() {
  if (!hasSupabaseEnv()) {
    redirect('/');
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return { supabase, user };
}

export async function getUserProfile(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<Profile> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, role')
    .eq('id', userId)
    .maybeSingle();

  return {
    email: profile?.email ?? null,
    role: profile?.role === 'admin' ? 'admin' : 'user',
  };
}

export async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const profile = await getUserProfile(supabase, user.id);

  if (!canManageCourses(profile.role)) {
    redirect('/main');
  }

  return { supabase, user, profile };
}
