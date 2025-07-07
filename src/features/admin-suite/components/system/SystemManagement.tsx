import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const SystemManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">System Management</h1>
        <p className="text-muted-foreground mt-2">
          Monitor system health, configuration, and maintenance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>System management features will be implemented in Phase 3</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};