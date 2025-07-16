import { TeamAdminData } from "@/hooks/useTeamMembersWithCredits";
import { 
  TeamRole, 
  canUserPerformAction, 
  canManageUser, 
  getAvailableRoles, 
  getRoleDisplayName, 
  getRoleDescription,
  validateRoleChange
} from "@/shared/utils/permissionHelpers";

export interface TeamAccessContext {
  userTeams: any[];
  selectedTeamId: string | null;
  userId: string;
}

export interface TeamAccessResult {
  canAccess: boolean;
  userRole: TeamRole;
  canViewTeamData: boolean;
  canManageTeam: boolean;
  teamIdForQuery: string | null;
  accessLevel: 'none' | 'restricted' | 'full';
}

export interface TeamValidationResult {
  isValid: boolean;
  errorType?: 'no_teams' | 'no_selection' | 'access_denied' | 'data_error';
  errorMessage?: string;
  shouldShowCreateTeam?: boolean;
}

export interface TeamPermissionSummary {
  canViewAnalytics: boolean;
  canManageMembers: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canUpdateMemberRoles: boolean;
  canViewContent: boolean;
  canManageSettings: boolean;
  canExportData: boolean;
}

export class TeamsBusinessLogicService {
  /**
   * Determines user's role in the selected team
   */
  static getUserRoleInTeam(
    selectedTeamId: string | null, 
    userTeams: any[]
  ): TeamRole {
    if (!selectedTeamId || !userTeams) return 'viewer';
    
    const selectedTeam = userTeams.find(team => team.id === selectedTeamId);
    return (selectedTeam?.role as TeamRole) || 'viewer';
  }

  /**
   * Calculates comprehensive team access permissions
   */
  static calculateTeamAccess(context: TeamAccessContext): TeamAccessResult {
    const { userTeams, selectedTeamId, userId } = context;
    
    const userRole = this.getUserRoleInTeam(selectedTeamId, userTeams);
    const canViewTeamData = canUserPerformAction(userRole, 'canViewContent');
    const canManageTeam = canUserPerformAction(userRole, 'canManageMembers');
    
    return {
      canAccess: !!selectedTeamId && canViewTeamData,
      userRole,
      canViewTeamData,
      canManageTeam,
      teamIdForQuery: canViewTeamData ? selectedTeamId : null,
      accessLevel: this.determineAccessLevel(userRole, canViewTeamData)
    };
  }

  /**
   * Validates team state and returns appropriate error information
   */
  static validateTeamState(
    hasTeams: boolean,
    selectedTeamId: string | null,
    teamData: TeamAdminData | null,
    error: any,
    accessResult: TeamAccessResult
  ): TeamValidationResult {
    // No teams at all
    if (!hasTeams) {
      return {
        isValid: false,
        errorType: 'no_teams',
        errorMessage: 'You\'re not a member of any teams yet. Create a new team or ask to be invited to an existing one.',
        shouldShowCreateTeam: true
      };
    }

    // Error occurred during data fetch
    if (error) {
      return {
        isValid: false,
        errorType: 'access_denied',
        errorMessage: error.message || 'You do not have permission to access this team\'s data.'
      };
    }

    // No team selected
    if (!selectedTeamId) {
      return {
        isValid: false,
        errorType: 'no_selection',
        errorMessage: 'Please select a team to manage.'
      };
    }

    // User doesn't have permission to view team data
    if (!accessResult.canViewTeamData) {
      return {
        isValid: false,
        errorType: 'access_denied',
        errorMessage: 'You don\'t have permission to view this team\'s information. Please contact your team administrator to request access.'
      };
    }

    // Data is not available (but should be)
    if (!teamData && accessResult.canViewTeamData) {
      return {
        isValid: false,
        errorType: 'data_error',
        errorMessage: 'Team data is not available at the moment. Please try again.'
      };
    }

    return { isValid: true };
  }

  /**
   * Gets comprehensive permission summary for a user role
   */
  static getPermissionSummary(role: TeamRole): TeamPermissionSummary {
    return {
      canViewAnalytics: canUserPerformAction(role, 'canViewAnalytics'),
      canManageMembers: canUserPerformAction(role, 'canManageMembers'),
      canInviteMembers: canUserPerformAction(role, 'canInviteMembers'),
      canRemoveMembers: canUserPerformAction(role, 'canRemoveMembers'),
      canUpdateMemberRoles: canUserPerformAction(role, 'canUpdateMemberRoles'),
      canViewContent: canUserPerformAction(role, 'canViewContent'),
      canManageSettings: canUserPerformAction(role, 'canManageSettings'),
      canExportData: canUserPerformAction(role, 'canExportData')
    };
  }

  /**
   * Validates if a user can perform a specific action on a target user
   */
  static canPerformActionOnUser(
    currentUserRole: TeamRole,
    targetUserRole: TeamRole,
    action: 'update_role' | 'remove' | 'invite'
  ): { allowed: boolean; reason?: string } {
    switch (action) {
      case 'update_role':
      case 'remove':
        if (!canManageUser(currentUserRole, targetUserRole)) {
          return {
            allowed: false,
            reason: 'You do not have permission to manage this user'
          };
        }
        break;
      
      case 'invite':
        if (!canUserPerformAction(currentUserRole, 'canInviteMembers')) {
          return {
            allowed: false,
            reason: 'You do not have permission to invite members'
          };
        }
        break;
    }

    return { allowed: true };
  }

  /**
   * Gets role management information for UI display
   */
  static getRoleManagementInfo(role: TeamRole) {
    return {
      displayName: getRoleDisplayName(role),
      description: getRoleDescription(role),
      availableRoles: getAvailableRoles(role),
      canManageRoles: getAvailableRoles(role).length > 0
    };
  }

  /**
   * Validates a role change operation
   */
  static validateRoleChangeRequest(
    currentUserRole: TeamRole,
    targetUserRole: TeamRole,
    newRole: TeamRole
  ) {
    return validateRoleChange(currentUserRole, targetUserRole, newRole);
  }

  /**
   * Determines access level based on permissions
   */
  private static determineAccessLevel(
    userRole: TeamRole, 
    canViewTeamData: boolean
  ): 'none' | 'restricted' | 'full' {
    if (!canViewTeamData) return 'none';
    
    if (userRole === 'owner' || userRole === 'admin') {
      return 'full';
    }
    
    return 'restricted';
  }

  /**
   * Generates user-friendly error messages based on context
   */
  static getContextualErrorMessage(
    errorType: string,
    userRole: TeamRole,
    context?: any
  ): string {
    const roleDisplay = getRoleDisplayName(userRole);
    
    switch (errorType) {
      case 'insufficient_permissions':
        return `Your role (${roleDisplay}) does not have sufficient permissions for this action.`;
      
      case 'team_not_found':
        return 'The selected team could not be found or you no longer have access to it.';
      
      case 'member_not_found':
        return 'The team member you are trying to manage could not be found.';
      
      case 'role_change_denied':
        return `You cannot change roles as a ${roleDisplay}. Contact your team owner for assistance.`;
      
      case 'invitation_failed':
        return 'Failed to send team invitation. Please check the email address and try again.';
      
      default:
        return 'An unexpected error occurred. Please try again or contact support.';
    }
  }

  /**
   * Calculates team health metrics for dashboard display
   */
  static calculateTeamHealthMetrics(teamData: TeamAdminData) {
    const { members, statistics } = teamData;
    
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.status === 'active').length;
    const pendingMembers = members.filter(m => m.status === 'pending').length;
    
    const membershipHealth = totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0;
    const creditsUtilization = statistics.total_credits_available > 0 
      ? (statistics.total_credits_used / statistics.total_credits_available) * 100 
      : 0;
    
    return {
      totalMembers,
      activeMembers,
      pendingMembers,
      membershipHealth: Math.round(membershipHealth),
      creditsUtilization: Math.round(creditsUtilization),
      healthStatus: this.determineHealthStatus(membershipHealth, creditsUtilization)
    };
  }

  /**
   * Determines overall team health status
   */
  private static determineHealthStatus(
    membershipHealth: number, 
    creditsUtilization: number
  ): 'excellent' | 'good' | 'warning' | 'critical' {
    if (membershipHealth >= 90 && creditsUtilization < 80) return 'excellent';
    if (membershipHealth >= 70 && creditsUtilization < 90) return 'good';
    if (membershipHealth >= 50 || creditsUtilization >= 90) return 'warning';
    return 'critical';
  }
}