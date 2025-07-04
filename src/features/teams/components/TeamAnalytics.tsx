
import React from "react";
import { TeamAdminData } from "@/types/team";
import { OptimizedTeamAnalytics } from "./OptimizedTeamAnalytics";

interface TeamAnalyticsProps {
  teamData: TeamAdminData;
  isLoading?: boolean;
}

export const TeamAnalytics = (props: TeamAnalyticsProps) => {
  return <OptimizedTeamAnalytics {...props} />;
};
