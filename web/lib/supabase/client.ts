import { createBrowserClient } from '@supabase/ssr';
import { ENV_VARS } from '../constants';

export function createClient() {
  return createBrowserClient(
    process.env[ENV_VARS.SUPABASE_URL]!,
    process.env[ENV_VARS.SUPABASE_ANON_KEY]!
  );
}
