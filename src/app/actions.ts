'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

async function getOrigin() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (siteUrl) {
    return siteUrl.replace(/\/$/, '');
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get('origin');

  return origin ?? 'http://localhost:3000';
}

function getCredentials(formData: FormData, missingFieldsPath: string) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '').trim();

  if (!email || !password) {
    redirect(missingFieldsPath);
  }

  return { email, password };
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const origin = await getOrigin();
  const { email, password } = getCredentials(
    formData,
    '/?mode=signup&error=missing-fields',
  );

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/main`,
    },
  });

  if (error) {
    redirect('/?mode=signup&error=signup');
  }

  if (!data.session) {
    redirect('/?message=check-email');
  }

  redirect('/main');
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { email, password } = getCredentials(
    formData,
    '/?error=missing-fields',
  );

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect('/?error=signin');
  }

  redirect('/main');
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect('/');
}
