
// Teams feature barrel exports
export { default as TeamsPage } from '@/pages/Teams';
export { OptimizedTeamMembersList as TeamMembersList } from './components/OptimizedTeamMembersList';
export { TeamAnalytics } from './components/TeamAnalytics';
export { useTeamMembersWithCredits } from '@/hooks/useTeamMembersWithCredits';
export { useTeamMutations } from '@/hooks/useTeamMutations';

// Team hooks - local feature hooks
export { useCreateTeam } from './hooks/useCreateTeam';
export { useUpdateTeam } from './hooks/useUpdateTeam';
export { useDeleteTeam } from './hooks/useDeleteTeam';
export { useInviteMembers } from './hooks/useInviteMembers';
export { useUpdateMemberRole } from './hooks/useUpdateMemberRole';
export { useRemoveMember } from './hooks/useRemoveMember';
export { useTransferOwnership } from './hooks/useTransferOwnership';
export { useTeamSelection } from './hooks/useTeamSelection';

// Team feature components
export { TeamMetrics } from './components/TeamMetrics';
export { TeamAnalyticsChart } from './components/TeamAnalyticsChart';
export { TeamCard } from './components/TeamCard';
export { MemberAvatar } from './components/MemberAvatar';
export { InvitationBadge } from './components/InvitationBadge';
export { TeamNotificationCard } from './components/TeamNotification';
export { InvitationNotification } from './components/InvitationNotification';

// Team hooks
export { useTeamAnalytics } from './hooks/useTeamAnalytics';
export { useTeamNotifications } from './hooks/useTeamNotifications';
export { useTeamAnalyticsCache, useTeamNotificationsCache, useTeamSettingsCache, useTeamCacheUtils } from './hooks/useTeamCache';
export { useTeamWebSocket } from './hooks/useTeamWebSocket';

// Team services
export { TeamService } from './services/teamService';
export { InvitationService } from './services/invitationService';

// Team types
export type * from './types';

// Cross-feature types (keep in original location)
export type { 
  TeamMember, 
  TeamMemberWithCredits, 
  TeamAdminData, 
  Team 
} from '@/types/team';
