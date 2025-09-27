import { createClient } from '@supabase/supabase-js';

const BUCKET = 'problem-uploads';

export function createServiceStorage() {
  // SERVICE ROLE KEY – server only!
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!, // never expose to client
    { auth: { persistSession: false } }
  );
  return { supabase, BUCKET };
}
