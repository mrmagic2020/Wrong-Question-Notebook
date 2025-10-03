import { ENV_VARS } from './constants';

// Validate required environment variables
// This should only be used in server-side code (middleware, API routes, server components)
export const hasEnvVars =
  process.env[ENV_VARS.SUPABASE_URL] && process.env[ENV_VARS.SUPABASE_ANON_KEY];
