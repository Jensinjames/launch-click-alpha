import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditMonitoring } from "./CreditMonitoring";
import { OptimizedCreditsManagement } from "@/features/admin/components/OptimizedCreditsManagement";
import { Activity, CreditCard, DollarSign } from "lucide-react";

export const BillingManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Billing Management</h1>
        <p className="text-muted-foreground mt-2">
          Real-time credit monitoring, billing administration, and revenue analytics
        </p>
      </div>

      <Tabs defaultValue="credit-monitoring" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="credit-monitoring" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Credit Monitoring</span>
          </TabsTrigger>
          <TabsTrigger value="credit-management" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Credit Management</span>
          </TabsTrigger>
          <TabsTrigger value="revenue-analytics" className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span>Revenue Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="credit-monitoring">
          <CreditMonitoring />
        </TabsContent>

        <TabsContent value="credit-management">
          <OptimizedCreditsManagement />
        </TabsContent>

        <TabsContent value="revenue-analytics">
          <div className="text-center text-muted-foreground py-8">
            <DollarSign className="h-12 w-12 mx-auto mb-4" />
            <p>Revenue analytics and forecasting dashboard coming in Phase 4</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};