import { NextResponse } from 'next/server';
import { createClient } from './server';

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user ?? null;
  if (error || !user) {
    return { user: null, supabase, error: error ?? new Error('Unauthorised') };
  }
  return { user, supabase, error: null };
}

export function unauthorised() {
  return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
}
