import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserUpgradeWorkflows } from "./UserUpgradeWorkflows";
import { OptimizedCreditsManagement } from "@/features/admin/components/OptimizedCreditsManagement";
import { Users, TrendingUp, CreditCard } from "lucide-react";

export const UserManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive user administration, plan management, and upgrade workflows
        </p>
      </div>

      <Tabs defaultValue="upgrade-workflows" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upgrade-workflows" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Upgrade Workflows</span>
          </TabsTrigger>
          <TabsTrigger value="credit-management" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Credit Management</span>
          </TabsTrigger>
          <TabsTrigger value="user-admin" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>User Administration</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upgrade-workflows">
          <UserUpgradeWorkflows />
        </TabsContent>

        <TabsContent value="credit-management">
          <OptimizedCreditsManagement />
        </TabsContent>

        <TabsContent value="user-admin">
          <div className="text-center text-muted-foreground py-8">
            <Users className="h-12 w-12 mx-auto mb-4" />
            <p>Advanced user administration features coming in Phase 4</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};