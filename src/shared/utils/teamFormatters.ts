import { formatDistanceToNow, format, parseISO, isValid } from 'date-fns';

// Date formatting utilities
export const formatTeamDate = (dateString: string, formatType: 'short' | 'long' | 'relative' = 'short'): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Invalid date';

    switch (formatType) {
      case 'short':
        return format(date, 'MMM d, yyyy');
      case 'long':
        return format(date, 'MMMM d, yyyy \'at\' h:mm a');
      case 'relative':
        return formatDistanceToNow(date, { addSuffix: true });
      default:
        return format(date, 'MMM d, yyyy');
    }
  } catch (error) {
    return 'Invalid date';
  }
};

// Role formatting utilities
export const formatTeamRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    owner: 'Owner',
    admin: 'Administrator',
    editor: 'Editor',
    viewer: 'Viewer'
  };
  return roleMap[role] || role;
};

export const formatRoleBadgeColor = (role: string): string => {
  switch (role) {
    case 'owner':
      return 'default';
    case 'admin':
      return 'secondary';
    case 'editor':
      return 'outline';
    case 'viewer':
      return 'outline';
    default:
      return 'outline';
  }
};

// Status formatting utilities
export const formatMemberStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: 'Active',
    pending: 'Pending',
    inactive: 'Inactive',
    invited: 'Invited'
  };
  return statusMap[status] || status;
};

export const formatInvitationStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    declined: 'Declined',
    expired: 'Expired'
  };
  return statusMap[status] || status;
};

// Number formatting utilities
export const formatMemberCount = (count: number): string => {
  if (count === 1) return '1 member';
  return `${count.toLocaleString()} members`;
};

export const formatCredits = (credits: number): string => {
  if (credits >= 1000000) {
    return `${(credits / 1000000).toFixed(1)}M`;
  }
  if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}K`;
  }
  return credits.toLocaleString();
};

export const formatCreditsUsage = (used: number, total: number): string => {
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
  return `${formatCredits(used)} / ${formatCredits(total)} (${percentage}%)`;
};

// Utility calculations
export const calculateTeamUtilization = (used: number, available: number): number => {
  if (available === 0) return 0;
  return Math.round((used / available) * 100);
};

export const getTeamActivityLevel = (score: number): { level: string; color: string; description: string } => {
  if (score >= 80) {
    return { 
      level: 'High', 
      color: 'text-success', 
      description: 'Very active team with regular collaboration' 
    };
  }
  if (score >= 50) {
    return { 
      level: 'Medium', 
      color: 'text-warning', 
      description: 'Moderately active team with regular activity' 
    };
  }
  return { 
    level: 'Low', 
    color: 'text-muted-foreground', 
    description: 'Limited team activity, may need engagement' 
  };
};

// Team size and limits
export const formatTeamSize = (current: number, limit: number): string => {
  return `${current} / ${limit} members`;
};

export const getTeamSizeStatus = (current: number, limit: number): { 
  status: 'safe' | 'warning' | 'limit'; 
  color: string; 
  message: string;
} => {
  const percentage = (current / limit) * 100;
  
  if (percentage >= 100) {
    return {
      status: 'limit',
      color: 'text-destructive',
      message: 'Team is at capacity'
    };
  }
  if (percentage >= 90) {
    return {
      status: 'warning',
      color: 'text-warning',
      message: 'Team is near capacity'
    };
  }
  return {
    status: 'safe',
    color: 'text-success',
    message: 'Team has available space'
  };
};

// Email and name formatting
export const formatDisplayName = (fullName?: string, email?: string): string => {
  if (fullName && fullName.trim()) {
    return fullName.trim();
  }
  if (email) {
    return email.split('@')[0];
  }
  return 'Unknown User';
};

export const formatInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const formatTeamDescription = (description?: string, maxLength: number = 100): string => {
  if (!description || !description.trim()) {
    return 'No description provided';
  }
  
  const trimmed = description.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  
  return trimmed.slice(0, maxLength).trim() + '...';
};

// Notification formatting
export const formatNotificationMessage = (type: string, data: any): string => {
  switch (type) {
    case 'member_invited':
      return `${data.inviterName} invited ${data.email} to join the team`;
    case 'member_joined':
      return `${data.memberName} joined the team`;
    case 'member_left':
      return `${data.memberName} left the team`;
    case 'member_role_changed':
      return `${data.memberName}'s role was changed to ${formatTeamRole(data.newRole)}`;
    case 'team_settings_updated':
      return 'Team settings were updated';
    case 'credits_updated':
      return `Credit limits were updated for ${data.memberCount} member(s)`;
    default:
      return 'Team activity occurred';
  }
};

// Activity score formatting
export const formatActivityScore = (score: number): string => {
  return `${Math.round(score)}%`;
};

export const getActivityTrend = (current: number, previous: number): {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  color: string;
} => {
  const diff = current - previous;
  const percentage = previous > 0 ? Math.abs((diff / previous) * 100) : 0;
  
  if (Math.abs(diff) < 1) {
    return { direction: 'stable', percentage: 0, color: 'text-muted-foreground' };
  }
  
  return {
    direction: diff > 0 ? 'up' : 'down',
    percentage: Math.round(percentage),
    color: diff > 0 ? 'text-success' : 'text-destructive'
  };
};