import { supabase } from '@/integrations/supabase/client';
import { TeamNotification } from '@/features/teams/types';

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  categories: {
    teamInvites: boolean;
    memberChanges: boolean;
    teamUpdates: boolean;
    mentions: boolean;
  };
}

export class NotificationService {
  // Team notifications
  static async getTeamNotifications(
    teamId: string, 
    unreadOnly = false
  ): Promise<{ data: TeamNotification[] | null; error: any }> {
    let query = supabase
      .from('team_notifications')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    return await query;
  }

  static async getUserNotifications(
    userId: string,
    unreadOnly = false
  ): Promise<{ data: TeamNotification[] | null; error: any }> {
    let query = supabase
      .from('team_notifications')
      .select(`
        *,
        team:teams(name, id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    return await query;
  }

  static async markAsRead(notificationId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('team_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    return { error };
  }

  static async markAllAsRead(teamId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('team_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('team_id', teamId)
      .is('read_at', null);

    return { error };
  }

  static async createNotification(
    teamId: string,
    type: string,
    title: string,
    message: string,
    userId?: string,
    notificationData?: Record<string, any>
  ): Promise<{ data: TeamNotification | null; error: any }> {
    const { data, error } = await supabase
      .from('team_notifications')
      .insert({
        team_id: teamId,
        user_id: userId,
        type,
        title,
        message,
        data: notificationData || {}
      })
      .select()
      .single();

    return { data, error };
  }

  static async deleteNotification(notificationId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('team_notifications')
      .delete()
      .eq('id', notificationId);

    return { error };
  }

  // Invitation notifications
  static async getInvitationNotifications(
    email: string
  ): Promise<{ data: any[] | null; error: any }> {
    const { data, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        team:teams(name, id),
        invited_by_profile:profiles!team_invitations_invited_by_fkey(full_name, avatar_url)
      `)
      .eq('email', email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    return { data, error };
  }

  // Notification preferences
  static async getNotificationPreferences(
    userId: string
  ): Promise<{ data: NotificationPreferences | null; error: any }> {
    // For now, return default preferences since the column doesn't exist yet
    return { 
      data: {
        email: true,
        push: true,
        inApp: true,
        categories: {
          teamInvites: true,
          memberChanges: true,
          teamUpdates: true,
          mentions: true,
        }
      }, 
      error: null 
    };
  }

  static async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<{ error: any }> {
    // For now, return no error since the column doesn't exist yet
    return { error: null };
  }

  // Real-time subscription helpers
  static subscribeToTeamNotifications(
    teamId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`team-notifications-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_notifications',
          filter: `team_id=eq.${teamId}`
        },
        callback
      )
      .subscribe();
  }

  static subscribeToUserNotifications(
    userId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  // Utility functions
  static getUnreadCount(notifications: TeamNotification[]): number {
    return notifications.filter(n => !n.read_at).length;
  }

  static groupNotificationsByDate(notifications: TeamNotification[]): Record<string, TeamNotification[]> {
    return notifications.reduce((groups, notification) => {
      const date = new Date(notification.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
      return groups;
    }, {} as Record<string, TeamNotification[]>);
  }

  static formatNotificationTime(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  }
}