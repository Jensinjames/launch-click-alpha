import { supabase } from '@/integrations/supabase/client';
import { TeamTemplate, TeamSettings, TeamNotification } from '../types/teamWorkflow';

export class TeamService {
  static async createTeamWithTemplate(name: string, templateId?: string) {
    const { data, error } = await supabase.functions.invoke('create-team', {
      body: { name, templateId }
    });
    return { data, error };
  }

  static async getTeamTemplates(category?: string) {
    let query = supabase
      .from('team_templates')
      .select('*')
      .eq('is_public', true);
    
    if (category) {
      query = query.eq('category', category);
    }
    
    return query.order('usage_count', { ascending: false });
  }

  static async getTeamSettings(teamId: string) {
    return supabase
      .from('team_settings')
      .select('*')
      .eq('team_id', teamId)
      .single();
  }

  static async updateTeamSettings(teamId: string, settings: Partial<TeamSettings['settings']>) {
    return supabase
      .from('team_settings')
      .upsert({
        team_id: teamId,
        settings
      })
      .select()
      .single();
  }

  static async getTeamNotifications(teamId: string, unreadOnly = false) {
    let query = supabase
      .from('team_notifications')
      .select('*')
      .eq('team_id', teamId);
    
    if (unreadOnly) {
      query = query.is('read_at', null);
    }
    
    return query.order('created_at', { ascending: false });
  }

  static async markNotificationAsRead(notificationId: string) {
    return supabase
      .from('team_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);
  }

  static async getTeamAnalytics(teamId: string, period: '7d' | '30d' | '90d' = '30d') {
    const { data, error } = await supabase.functions.invoke('team-analytics', {
      body: { teamId, period }
    });
    return { data, error };
  }
}