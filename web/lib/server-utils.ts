import { ENV_VARS } from './constants';
import { logger } from './logger';

/**
 * Required environment variables for the application to function
 */
const REQUIRED_ENV_VARS = [
  ENV_VARS.SUPABASE_URL,
  ENV_VARS.SUPABASE_ANON_KEY,
] as const;

/**
 * Optional environment variables (used for enhanced functionality)
 */
const OPTIONAL_ENV_VARS = [ENV_VARS.SUPABASE_SERVICE_ROLE_KEY] as const;

/**
 * Validates that all required environment variables are set
 * Logs warnings for missing optional variables
 *
 * @returns true if all required variables are set, false otherwise
 */
export function validateEnvironmentVariables(): boolean {
  let allRequiredPresent = true;

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      logger.error(
        `Missing required environment variable: ${varName}`,
        undefined,
        {
          component: 'ServerUtils',
          action: 'validateEnvironmentVariables',
        }
      );
      allRequiredPresent = false;
    }
  }

  // Check optional variables (just warn)
  for (const varName of OPTIONAL_ENV_VARS) {
    if (!process.env[varName]) {
      logger.warn(`Missing optional environment variable: ${varName}`, {
        component: 'ServerUtils',
        action: 'validateEnvironmentVariables',
      });
    }
  }

  return allRequiredPresent;
}

/**
 * Quick check for required environment variables
 * This should only be used in server-side code (middleware, API routes, server components)
 */
export const hasEnvVars =
  process.env[ENV_VARS.SUPABASE_URL] && process.env[ENV_VARS.SUPABASE_ANON_KEY];

/**
 * Gets an environment variable value with runtime validation
 *
 * @param name - The name of the environment variable
 * @param required - Whether the variable is required (default: true)
 * @returns The environment variable value, or undefined if not required and not set
 * @throws Error if required variable is not set
 */
export function getEnvVar(name: string, required = true): string | undefined {
  const value = process.env[name];

  if (!value && required) {
    logger.error(`Required environment variable not set: ${name}`, undefined, {
      component: 'ServerUtils',
      action: 'getEnvVar',
    });
    throw new Error(`Required environment variable not set: ${name}`);
  }

  return value;
}

/**
 * Validates URL format for environment variables
 *
 * @param url - The URL string to validate
 * @param varName - The name of the environment variable (for error messages)
 * @returns true if valid, false otherwise
 */
export function validateEnvUrl(
  url: string | undefined,
  varName: string
): boolean {
  if (!url) {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    logger.error(`Invalid URL format for ${varName}: ${url}`, undefined, {
      component: 'ServerUtils',
      action: 'validateEnvUrl',
    });
    return false;
  }
}
