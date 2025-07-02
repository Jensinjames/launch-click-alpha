// Utility functions for team management
export const formatTeamRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    owner: 'Owner',
    admin: 'Administrator',
    editor: 'Editor',
    viewer: 'Viewer'
  };
  return roleMap[role] || role;
};

export const calculateTeamUtilization = (used: number, available: number): number => {
  if (available === 0) return 0;
  return Math.round((used / available) * 100);
};

export const getTeamActivityLevel = (score: number): { level: string; color: string } => {
  if (score >= 80) return { level: 'High', color: 'text-success' };
  if (score >= 50) return { level: 'Medium', color: 'text-warning' };
  return { level: 'Low', color: 'text-error' };
};