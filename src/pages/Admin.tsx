
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamsManagement } from "@/features/admin/components/TeamsManagement";
import { CreditsManagement } from "@/features/admin/components/CreditsManagement";
import { AuditLogs } from "@/features/admin/components/AuditLogs";
import { AdminSecurityWrapper } from "@/features/admin/components/AdminSecurityWrapper";
import { Shield, Users, CreditCard, Activity } from "lucide-react";

const Admin = () => {
  return (
    <AdminSecurityWrapper emergencyMode={true}>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-secondary">Manage system resources and monitor activities</p>
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
