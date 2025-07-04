import { supabase } from '@/integrations/supabase/client';

export class TeamService {
  static async createTeamWithTemplate(name: string, templateId?: string) {
    const { data, error } = await supabase.rpc('create_team_with_access_control', {
      p_team_name: name,
      p_description: null
    });
    
    if (error) throw error;
    return { data, error: null };
  }

  static async getTeamAnalytics(teamId: string, period: '7d' | '30d' | '90d' = '30d') {
    // Mock implementation for team analytics
    // In a real app, this would make an actual API call
    const mockAnalytics = {
      team_id: teamId,
      total_members: 5,
      active_members: 4,
      content_generated: 25,
      credits_used: 150,
      credits_available: 350,
      activity_score: 85.5,
      period_start: new Date(Date.now() - (parseInt(period.replace('d', '')) * 24 * 60 * 60 * 1000)).toISOString(),
      period_end: new Date().toISOString()
    };

    return { data: mockAnalytics, error: null };
  }

  static async getTeamNotifications(teamId: string, unreadOnly = false) {
    const query = supabase
      .from('team_notifications')
      .select('*')
      .eq('team_id', teamId);

    if (unreadOnly) {
      query.is('read_at', null);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    return { data: data || [], error };
  }

  static async markNotificationAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('team_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    return { data, error };
  }

  static async getTeamSettings(teamId: string) {
    const { data, error } = await supabase
      .from('team_settings')
      .select('*')
      .eq('team_id', teamId)
      .single();

    return { data, error };
  }

  static async updateTeamSettings(teamId: string, settings: any) {
    const { data, error } = await supabase
      .from('team_settings')
      .upsert({
        team_id: teamId,
        settings,
        updated_at: new Date().toISOString()
      })
      .eq('team_id', teamId);

    return { data, error };
  }
}