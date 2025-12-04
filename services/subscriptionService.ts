/**
 * Subscription Service
 * 
 * Manages paid access to premium content like Preproff papers.
 * Provides methods to check access, and for admins to grant/revoke access.
 */

import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  has_preproff_access: boolean;
  preproff_access_granted_at?: string;
  is_admin: boolean;
  is_banned: boolean;
  violation_count: number;
  ban_reason?: string;
  banned_at?: string;
  created_at?: string;
}

export interface AccessGrant {
  id: string;
  user_id: string;
  access_type: string;
  granted_by: string;
  granted_at: string;
  notes?: string;
  revoked_at?: string;
  revoked_by?: string;
}

class SubscriptionService {
  /**
   * Check if the current user has preproff access
   * NOTE: Currently providing FREE ACCESS to all users
   */
  async hasPreproffAccess(): Promise<boolean> {
    // FREE ACCESS FOR ALL USERS - return true always
    return true;
    
    /* Original code - uncomment to restore paid access:
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('profiles')
        .select('has_preproff_access')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data?.has_preproff_access || false;
    } catch (e) {
      console.error('Failed to check preproff access:', e);
      return false;
    }
    */
  }

  /**
   * Check if the current user is an admin
   */
  async isAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data?.is_admin || false;
    } catch (e) {
      console.error('Failed to check admin status:', e);
      return false;
    }
  }

  /**
   * Get the current user's profile with subscription info
   */
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, has_preproff_access, preproff_access_granted_at, is_admin, is_banned, violation_count')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as UserProfile;
    } catch (e) {
      console.error('Failed to get user profile:', e);
      return null;
    }
  }

  /**
   * Search for users by email (admin only)
   */
  async searchUsers(searchQuery: string): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, has_preproff_access, preproff_access_granted_at, is_admin, is_banned, violation_count')
        .ilike('email', `%${searchQuery}%`)
        .limit(20);

      if (error) throw error;
      return (data || []) as UserProfile[];
    } catch (e) {
      console.error('Failed to search users:', e);
      return [];
    }
  }

  /**
   * Get all users with preproff access (admin only)
   */
  async getUsersWithAccess(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, has_preproff_access, preproff_access_granted_at, is_admin, is_banned, violation_count')
        .eq('has_preproff_access', true)
        .order('preproff_access_granted_at', { ascending: false });

      if (error) throw error;
      return (data || []) as UserProfile[];
    } catch (e) {
      console.error('Failed to get users with access:', e);
      return [];
    }
  }

  /**
   * Grant preproff access to a user (admin only)
   */
  async grantPreproffAccess(userId: string, notes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Check if current user is admin
      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        return { success: false, error: 'Only admins can grant access' };
      }

      // Update profile directly
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          has_preproff_access: true,
          preproff_access_granted_at: new Date().toISOString(),
          preproff_access_granted_by: user.id
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log the grant
      const { error: logError } = await supabase
        .from('access_grants')
        .insert({
          user_id: userId,
          access_type: 'preproff',
          granted_by: user.id,
          notes: notes
        });

      if (logError) {
        console.error('Failed to log access grant:', logError);
        // Don't fail the operation, just log it
      }

      return { success: true };
    } catch (e: any) {
      console.error('Failed to grant access:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Revoke preproff access from a user (admin only)
   */
  async revokePreproffAccess(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        return { success: false, error: 'Only admins can revoke access' };
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          has_preproff_access: false,
          preproff_access_granted_at: null,
          preproff_access_granted_by: null
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Mark grant as revoked
      const { error: logError } = await supabase
        .from('access_grants')
        .update({
          revoked_at: new Date().toISOString(),
          revoked_by: user.id
        })
        .eq('user_id', userId)
        .eq('access_type', 'preproff')
        .is('revoked_at', null);

      if (logError) {
        console.error('Failed to log access revocation:', logError);
      }

      return { success: true };
    } catch (e: any) {
      console.error('Failed to revoke access:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Get access history for a user (admin only)
   */
  async getAccessHistory(userId: string): Promise<AccessGrant[]> {
    try {
      const { data, error } = await supabase
        .from('access_grants')
        .select('*')
        .eq('user_id', userId)
        .order('granted_at', { ascending: false });

      if (error) throw error;
      return (data || []) as AccessGrant[];
    } catch (e) {
      console.error('Failed to get access history:', e);
      return [];
    }
  }

  /**
   * Get statistics for admin dashboard
   */
  async getStats(): Promise<{
    totalUsers: number;
    usersWithAccess: number;
    bannedUsers: number;
  }> {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get users with preproff access
      const { count: usersWithAccess } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('has_preproff_access', true);

      // Get banned users
      const { count: bannedUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_banned', true);

      return {
        totalUsers: totalUsers || 0,
        usersWithAccess: usersWithAccess || 0,
        bannedUsers: bannedUsers || 0
      };
    } catch (e) {
      console.error('Failed to get stats:', e);
      return { totalUsers: 0, usersWithAccess: 0, bannedUsers: 0 };
    }
  }

  /**
   * Unban a user (admin only)
   */
  async unbanUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        return { success: false, error: 'Only admins can unban users' };
      }

      // Update profile to unban
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_banned: false,
          ban_reason: null,
          banned_at: null,
          violation_count: 0 // Reset violation count
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Also clear their device session to force re-login
      await supabase
        .from('device_sessions')
        .delete()
        .eq('user_id', userId);

      return { success: true };
    } catch (e: any) {
      console.error('Failed to unban user:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Ban a user (admin only)
   */
  async banUser(userId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        return { success: false, error: 'Only admins can ban users' };
      }

      // Update profile to ban
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_banned: true,
          ban_reason: reason || 'Banned by admin',
          banned_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Clear their device session to force logout
      await supabase
        .from('device_sessions')
        .delete()
        .eq('user_id', userId);

      return { success: true };
    } catch (e: any) {
      console.error('Failed to ban user:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Get all banned users (admin only)
   */
  async getBannedUsers(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, has_preproff_access, preproff_access_granted_at, is_admin, is_banned, violation_count, ban_reason, banned_at')
        .eq('is_banned', true)
        .order('banned_at', { ascending: false });

      if (error) throw error;
      return (data || []) as UserProfile[];
    } catch (e) {
      console.error('Failed to get banned users:', e);
      return [];
    }
  }
}

export const subscriptionService = new SubscriptionService();
