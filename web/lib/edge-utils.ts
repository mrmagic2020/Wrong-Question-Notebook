/**
 * Edge Runtime compatible utilities
 * These functions work in the Edge Runtime environment
 */

import { logger } from './logger';

/**
 * Update user's last login timestamp using Supabase client
 * This version is compatible with Edge Runtime
 * 
 * Uses direct REST API calls instead of Supabase client to:
 * - Reduce bundle size in Edge Runtime
 * - Avoid potential compatibility issues
 * - Provide better control over the request
 * 
 * @param userId - The UUID of the user to update
 * @param supabaseUrl - The Supabase project URL
 * @param supabaseAnonKey - The Supabase anonymous key
 * @param userToken - Optional JWT token for authentication
 * 
 * @remarks
 * This function fails silently to avoid blocking user requests
 * Last login tracking is considered non-critical functionality
 */
export async function updateLastLoginEdge(
  userId: string,
  supabaseUrl: string,
  supabaseAnonKey: string,
  userToken?: string
): Promise<void> {
  try {
    // Skip if no user token is provided
    if (!userToken) {
      return;
    }

    // Create a minimal fetch request to update last login
    const response = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
          apikey: supabaseAnonKey,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          last_login_at: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      logger.warn('Failed to update last login', {
        component: 'EdgeUtils',
        action: 'updateLastLoginEdge',
        status: response.status,
        userId,
      });
    }
  } catch (error) {
    // Silently fail - don't block the request for login tracking
    logger.warn('Error updating last login', {
      component: 'EdgeUtils',
      action: 'updateLastLoginEdge',
      userId,
    });
  }
}
