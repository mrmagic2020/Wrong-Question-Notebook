import { createClient } from '@supabase/supabase-js';

const BUCKET = 'problem-uploads';

export function createServiceStorage() {
  // SERVICE ROLE KEY – server only!
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // never expose to client
    { auth: { persistSession: false } }
  );
  return { supabase, BUCKET };
}
