
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamsManagement } from "@/components/admin/TeamsManagement";
import { CreditsManagement } from "@/components/admin/CreditsManagement";
import { AuditLogs } from "@/components/admin/AuditLogs";
import { AdminSecurityWrapper } from "@/components/admin/AdminSecurityWrapper";
import { Shield, Users, CreditCard, Activity } from "lucide-react";

const Admin = () => {
  return (
    <AdminSecurityWrapper 
      requireRecentAuth={true} 
      requireFreshSession={true}
      maxSessionAge={30}
      sensitiveOperation="admin_panel_access"
    >
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600">Manage system resources and monitor activities</p>
          </div>
        </div>

        <Tabs defaultValue="teams" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="teams" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Teams</span>
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Credits</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Audit Logs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teams">
            <TeamsManagement />
          </TabsContent>

          <TabsContent value="credits">
            <CreditsManagement />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogs />
          </TabsContent>
        </Tabs>
      </div>
    </AdminSecurityWrapper>
  );
};

export default Admin;
