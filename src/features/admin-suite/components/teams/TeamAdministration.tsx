import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamHealthMonitoring } from "./TeamHealthMonitoring";
import { EnhancedTeamsManagement } from "@/features/admin/components/EnhancedTeamsManagement";
import { Activity, Users, BarChart3 } from "lucide-react";

export const TeamAdministration = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Team Administration</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive team health monitoring, management, and analytics
        </p>
      </div>

      <Tabs defaultValue="health-monitoring" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="health-monitoring" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Health Monitoring</span>
          </TabsTrigger>
          <TabsTrigger value="team-management" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Team Management</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Team Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health-monitoring">
          <TeamHealthMonitoring />
        </TabsContent>

        <TabsContent value="team-management">
          <EnhancedTeamsManagement />
        </TabsContent>

        <TabsContent value="analytics">
          <div className="text-center text-muted-foreground py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4" />
            <p>Advanced team analytics dashboard coming in Phase 4</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};