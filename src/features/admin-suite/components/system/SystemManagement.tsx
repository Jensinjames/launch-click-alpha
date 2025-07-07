import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataExportImport } from "./DataExportImport";
import { Database, Monitor, Settings } from "lucide-react";

export const SystemManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">System Management</h1>
        <p className="text-muted-foreground mt-2">
          System monitoring, data management, and administrative tools
        </p>
      </div>

      <Tabs defaultValue="data-management" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="data-management" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Data Management</span>
          </TabsTrigger>
          <TabsTrigger value="system-monitoring" className="flex items-center space-x-2">
            <Monitor className="h-4 w-4" />
            <span>System Monitoring</span>
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Configuration</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data-management">
          <DataExportImport />
        </TabsContent>

        <TabsContent value="system-monitoring">
          <div className="text-center text-muted-foreground py-8">
            <Monitor className="h-12 w-12 mx-auto mb-4" />
            <p>Real-time system monitoring dashboard coming in Phase 4</p>
          </div>
        </TabsContent>

        <TabsContent value="configuration">
          <div className="text-center text-muted-foreground py-8">
            <Settings className="h-12 w-12 mx-auto mb-4" />
            <p>System configuration panel coming in Phase 5</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};