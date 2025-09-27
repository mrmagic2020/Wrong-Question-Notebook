/**
 * Edge Runtime compatible utilities
 * These functions work in the Edge Runtime environment
 */

/**
 * Update user's last login timestamp using Supabase client
 * This version is compatible with Edge Runtime
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
      console.warn('Failed to update last login:', response.status);
    }
  } catch (error) {
    // Silently fail - don't block the request for login tracking
    console.warn('Error updating last login:', error);
  }
}

/**
 * Check if user is admin using Edge Runtime compatible approach
 */
export async function isUserAdminEdge(
  userId: string,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}&select=user_role`,
      {
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
      }
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const userProfile = data?.[0];

    return (
      userProfile?.user_role === 'admin' ||
      userProfile?.user_role === 'super_admin'
    );
  } catch (error) {
    console.warn('Error checking admin status:', error);
    return false;
  }
}
