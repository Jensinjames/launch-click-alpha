// Shared types for consistency between client and server
export interface CreateTeamRequest {
  name: string;
  description?: string;
  templateId?: string;
}

export interface CreateTeamResponse {
  success: boolean;
  team?: {
    id: string;
    name: string;
  };
  usage?: {
    teams_used: number;
    teams_limit: number;
  };
  template_applied?: boolean;
  error?: string;
  upgrade_required?: boolean;
  limit_reached?: boolean;
}

export interface TeamValidationError {
  field: string;
  message: string;
}

export type PlanType = 'starter' | 'pro' | 'growth' | 'elite';
export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface UserPlanInfo {
  plan_type: PlanType;
  team_seats: number;
  can_manage_teams: boolean;
}