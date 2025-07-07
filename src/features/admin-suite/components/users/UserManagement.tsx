import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const UserManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage user accounts, plans, and permissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>User management features will be implemented in Phase 3</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};