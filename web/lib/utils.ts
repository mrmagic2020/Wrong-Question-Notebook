import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ENV_VARS } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Validate required environment variables
export const hasEnvVars =
  process.env[ENV_VARS.SUPABASE_URL] && process.env[ENV_VARS.SUPABASE_ANON_KEY];
