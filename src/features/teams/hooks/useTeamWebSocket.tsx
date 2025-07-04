import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '@/shared/services/notificationService';
import { TeamNotification } from '../types';

export interface TeamPresence {
  user_id: string;
  user_name: string;
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

  // Memoized event handlers
  const handleNotificationReceived = useCallback((notification: TeamNotification) => {
    // Invalidate notifications cache
    queryClient.invalidateQueries({ queryKey: ['team-notifications', teamId] });
    
    // Call external handler
    onNotification?.(notification);
  }, [queryClient, teamId, onNotification]);

  const handleMemberPresenceUpdate = useCallback((presence: TeamPresence, action: 'join' | 'leave') => {
    setPresenceState(prev => {
      const updated = { ...prev };
      if (action === 'join') {
        updated[presence.user_id] = presence;
        onMemberJoin?.(presence);
      } else {
        delete updated[presence.user_id];
        onMemberLeave?.(presence);
      }
      return updated;
    });
  }, [onMemberJoin, onMemberLeave]);

  const handleTeamDataUpdate = useCallback((update: any) => {
    // Invalidate relevant team data caches
    queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
    queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    
    onTeamUpdate?.(update);
  }, [queryClient, teamId, onTeamUpdate]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!teamId || !userId) return;

    const initializeConnection = async () => {
      try {
        // Create a unique channel for this team
        const channelName = `team:${teamId}`;
        const channel = supabase.channel(channelName, {
          config: {
            presence: {
              key: userId,
            },
          },
        });

        // Track presence
        channel
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const presenceData: Record<string, TeamPresence> = {};
            
            Object.entries(state).forEach(([key, presences]) => {
              const presence = (presences as any[])[0];
              if (presence) {
                presenceData[key] = {
                  user_id: key,
                  user_name: presence.user_name || 'Anonymous',
                  status: presence.status || 'online',
                  last_seen: presence.last_seen || new Date().toISOString()
                };
              }
            });
            
            setPresenceState(presenceData);
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            const presence = newPresences[0];
            if (presence) {
              handleMemberPresenceUpdate({
                user_id: key,
                user_name: presence.user_name || 'Anonymous',
                status: presence.status || 'online',
                last_seen: new Date().toISOString()
              }, 'join');
            }
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            const presence = leftPresences[0];
            if (presence) {
              handleMemberPresenceUpdate({
                user_id: key,
                user_name: presence.user_name || 'Anonymous',
                status: 'offline',
                last_seen: new Date().toISOString()
              }, 'leave');
            }
          });

        // Listen for team-specific events
        channel
          .on('broadcast', { event: 'team_notification' }, ({ payload }) => {
            handleNotificationReceived(payload);
          })
          .on('broadcast', { event: 'team_update' }, ({ payload }) => {
            handleTeamDataUpdate(payload);
          })
          .on('broadcast', { event: 'member_update' }, ({ payload }) => {
            // Invalidate team members cache when member data changes
            queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
          });

        // Subscribe and track presence
        await channel.subscribe(async (status) => {
          setIsConnected(status === 'SUBSCRIBED');
          
          if (status === 'SUBSCRIBED') {
            // Send presence data
            await channel.track({
              user_name: 'Current User', // This should come from user profile
              status: 'online',
              last_seen: new Date().toISOString()
            });
          }
        });

        channelRef.current = channel;

        // Set up periodic presence updates
        const presenceInterval = setInterval(async () => {
          if (channelRef.current) {
            await channelRef.current.track({
              user_name: 'Current User',
              status: document.visibilityState === 'visible' ? 'online' : 'away',
              last_seen: new Date().toISOString()
            });
          }
        }, 30000); // Update every 30 seconds

        // Handle visibility changes
        const handleVisibilityChange = async () => {
          if (channelRef.current) {
            await channelRef.current.track({
              user_name: 'Current User',
              status: document.visibilityState === 'visible' ? 'online' : 'away',
              last_seen: new Date().toISOString()
            });
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup function
        return () => {
          clearInterval(presenceInterval);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          if (channelRef.current) {
            channelRef.current.unsubscribe();
            channelRef.current = null;
          }
          setIsConnected(false);
          setPresenceState({});
        };

      } catch (error) {
        console.error('Failed to initialize team WebSocket connection:', error);
        setIsConnected(false);
      }
    };

    const cleanup = initializeConnection();

    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [teamId, userId, handleNotificationReceived, handleMemberPresenceUpdate, handleTeamDataUpdate, queryClient]);

  // Broadcast a message to all team members
  const broadcastToTeam = useCallback(async (event: string, payload: any) => {
    if (channelRef.current && isConnected) {
      await channelRef.current.send({
        type: 'broadcast',
        event,
        payload
      });
    }
  }, [isConnected]);

  // Send a team notification
  const sendTeamNotification = useCallback(async (notification: Omit<TeamNotification, 'id' | 'created_at'>) => {
    if (isConnected) {
      await broadcastToTeam('team_notification', notification);
    }
  }, [isConnected, broadcastToTeam]);

  // Update presence status
  const updatePresenceStatus = useCallback(async (status: 'online' | 'away' | 'offline') => {
    if (channelRef.current) {
      await channelRef.current.track({
        user_name: 'Current User',
        status,
        last_seen: new Date().toISOString()
      });
    }
  }, []);

  // Get online members count
  const onlineMembersCount = Object.values(presenceState).filter(p => p.status === 'online').length;

  return {
    isConnected,
    presenceState,
    onlineMembersCount,
    broadcastToTeam,
    sendTeamNotification,
    updatePresenceStatus,
  };
};