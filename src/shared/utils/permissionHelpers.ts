export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface PermissionMatrix {
  canManageTeam: boolean;
  canManageMembers: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canUpdateMemberRoles: boolean;
  canEditContent: boolean;
  canViewContent: boolean;
  canDeleteContent: boolean;
  canManageSettings: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
}

export const getPermissionMatrix = (role: TeamRole): PermissionMatrix => {
  const basePermissions: PermissionMatrix = {
    canManageTeam: false,
    canManageMembers: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canUpdateMemberRoles: false,
    canEditContent: false,
    canViewContent: false,
    canDeleteContent: false,
    canManageSettings: false,
    canViewAnalytics: false,
    canExportData: false,
  };

  switch (role) {
    case 'owner':
      return {
        ...basePermissions,
        canManageTeam: true,
        canManageMembers: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canUpdateMemberRoles: true,
        canEditContent: true,
        canViewContent: true,
        canDeleteContent: true,
        canManageSettings: true,
        canViewAnalytics: true,
        canExportData: true,
      };
    
    case 'admin':
      return {
        ...basePermissions,
        canManageMembers: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canEditContent: true,
        canViewContent: true,
        canDeleteContent: true,
        canViewAnalytics: true,
        canExportData: true,
      };
    
    case 'editor':
      return {
        ...basePermissions,
        canEditContent: true,
        canViewContent: true,
        canViewAnalytics: true,
      };
    
    case 'viewer':
      return {
        ...basePermissions,
        canViewContent: true,
      };
    
    default:
      return basePermissions;
  }
};

export const canUserPerformAction = (
  userRole: TeamRole,
  action: keyof PermissionMatrix
): boolean => {
  const permissions = getPermissionMatrix(userRole);
  return permissions[action];
};

export const canManageUser = (
  currentUserRole: TeamRole,
  targetUserRole: TeamRole
): boolean => {
  // Owners can manage everyone except other owners
  if (currentUserRole === 'owner') {
    return targetUserRole !== 'owner';
  }
  
  // Admins can manage editors and viewers
  if (currentUserRole === 'admin') {
    return ['editor', 'viewer'].includes(targetUserRole);
  }
  
  // Editors and viewers cannot manage anyone
  return false;
};

export const getAvailableRoles = (currentUserRole: TeamRole): TeamRole[] => {
  switch (currentUserRole) {
    case 'owner':
      return ['admin', 'editor', 'viewer'];
    case 'admin':
      return ['editor', 'viewer'];
    default:
      return [];
  }
};

export const getRoleHierarchy = (): TeamRole[] => {
  return ['owner', 'admin', 'editor', 'viewer'];
};

export const getRoleDisplayName = (role: TeamRole): string => {
  const roleNames = {
    owner: 'Team Owner',
    admin: 'Administrator',
    editor: 'Editor',
    viewer: 'Viewer'
  };
  return roleNames[role];
};

export const getRoleDescription = (role: TeamRole): string => {
  const descriptions = {
    owner: 'Full control over team settings, members, and content. Can delete the team.',
    admin: 'Can manage team members and content. Cannot change team ownership or delete team.',
    editor: 'Can create, edit, and view team content. Cannot manage team members.',
    viewer: 'Can view team content only. Cannot edit or manage anything.'
  };
  return descriptions[role];
};

export const validateRoleChange = (
  currentUserRole: TeamRole,
  targetUserRole: TeamRole,
  newRole: TeamRole
): { valid: boolean; reason?: string } => {
  if (!canManageUser(currentUserRole, targetUserRole)) {
    return {
      valid: false,
      reason: 'You do not have permission to manage this user'
    };
  }

  if (!getAvailableRoles(currentUserRole).includes(newRole)) {
    return {
      valid: false,
      reason: 'You cannot assign this role'
    };
  }

  if (targetUserRole === newRole) {
    return {
      valid: false,
      reason: 'User already has this role'
    };
  }

  return { valid: true };
};