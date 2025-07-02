import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '../services/notificationService';
import { TeamNotification } from '../types/teamWorkflow';

export interface TeamPresence {
  user_id: string;
  user_name: string;
  avatar_url?: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
}

export interface UseTeamWebSocketOptions {
  teamId: string;
  userId: string;
  onNotification?: (notification: TeamNotification) => void;
  onMemberJoin?: (member: TeamPresence) => void;
  onMemberLeave?: (member: TeamPresence) => void;
  onTeamUpdate?: (update: any) => void;
}

export const useTeamWebSocket = ({
  teamId,
  userId,
  onNotification,
  onMemberJoin,
  onMemberLeave,
  onTeamUpdate
}: UseTeamWebSocketOptions) => {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [presenceState, setPresenceState] = useState<Record<string, TeamPresence>>({});
  const channelRef = useRef<any>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!teamId || !userId) return;

    const channel = supabase.channel(`team-${teamId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    // Handle presence sync
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const presenceData: Record<string, TeamPresence> = {};
        
        Object.entries(newState).forEach(([key, presence]: [string, any]) => {
          if (presence && presence[0]) {
            presenceData[key] = presence[0] as unknown as TeamPresence;
          }
        });
        
        setPresenceState(presenceData);
        setIsConnected(true);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (newPresences && newPresences[0] && onMemberJoin) {
          onMemberJoin(newPresences[0] as unknown as TeamPresence);
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (leftPresences && leftPresences[0] && onMemberLeave) {
          onMemberLeave(leftPresences[0] as unknown as TeamPresence);
        }
      });

    // Handle real-time notifications
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'team_notifications',
        filter: `team_id=eq.${teamId}`
      },
      (payload) => {
        const notification = payload.new as TeamNotification;
        
        // Invalidate notification queries
        queryClient.invalidateQueries({ queryKey: ['team-notifications', teamId] });
        
        // Call callback if provided
        if (onNotification) {
          onNotification(notification);
        }
      }
    );

    // Handle team member changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'team_members',
        filter: `team_id=eq.${teamId}`
      },
      (payload) => {
        // Invalidate team member queries
        queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
        queryClient.invalidateQueries({ queryKey: ['user-teams'] });
        
        if (onTeamUpdate) {
          onTeamUpdate({
            type: 'member_change',
            event: payload.eventType,
            data: payload.new || payload.old
          });
        }
      }
    );

    // Handle team updates
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'teams',
        filter: `id=eq.${teamId}`
      },
      (payload) => {
        // Invalidate team queries
        queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
        queryClient.invalidateQueries({ queryKey: ['user-teams'] });
        
        if (onTeamUpdate) {
          onTeamUpdate({
            type: 'team_update',
            event: payload.eventType,
            data: payload.new
          });
        }
      }
    );

    // Subscribe to the channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track user presence
        await channel.track({
          user_id: userId,
          status: 'online',
          last_seen: new Date().toISOString(),
        });
        setIsConnected(true);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnected(false);
      }
    });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [teamId, userId, queryClient, onNotification, onMemberJoin, onMemberLeave, onTeamUpdate]);

  // Update user status
  const updateStatus = useCallback(async (status: 'online' | 'away' | 'offline') => {
    if (channelRef.current && isConnected) {
      await channelRef.current.track({
        user_id: userId,
        status,
        last_seen: new Date().toISOString(),
      });
    }
  }, [userId, isConnected]);

  // Send typing indicator
  const sendTyping = useCallback((isTyping: boolean) => {
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: userId,
          is_typing: isTyping,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }, [userId, isConnected]);

  // Send custom team event
  const sendTeamEvent = useCallback((eventType: string, data: any) => {
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: eventType,
        payload: {
          user_id: userId,
          data,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }, [userId, isConnected]);

  // Get online members
  const getOnlineMembers = useCallback((): TeamPresence[] => {
    return Object.values(presenceState).filter(
      member => member.status === 'online'
    );
  }, [presenceState]);

  // Check if user is online
  const isUserOnline = useCallback((checkUserId: string): boolean => {
    return presenceState[checkUserId]?.status === 'online';
  }, [presenceState]);

  return {
    isConnected,
    presenceState,
    updateStatus,
    sendTyping,
    sendTeamEvent,
    getOnlineMembers,
    isUserOnline,
    onlineCount: getOnlineMembers().length,
  };
};

// Hook for team notifications with real-time updates
export const useRealTimeTeamNotifications = (teamId: string) => {
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<TeamNotification[]>([]);

  useEffect(() => {
    if (!teamId) return;

    // Subscribe to notifications
    const channel = NotificationService.subscribeToTeamNotifications(
      teamId,
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotifications(prev => [payload.new, ...prev]);
          queryClient.invalidateQueries({ queryKey: ['team-notifications', teamId] });
        } else if (payload.eventType === 'UPDATE') {
          setNotifications(prev => 
            prev.map(n => n.id === payload.new.id ? payload.new : n)
          );
        } else if (payload.eventType === 'DELETE') {
          setNotifications(prev => 
            prev.filter(n => n.id !== payload.old.id)
          );
        }
      }
    );

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, queryClient]);

  return { notifications };
};