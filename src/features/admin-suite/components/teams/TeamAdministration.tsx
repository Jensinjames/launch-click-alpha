import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const TeamAdministration = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Team Administration</h1>
        <p className="text-muted-foreground mt-2">
          Manage teams, members, and team settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>Enhanced team administration will be implemented in Phase 3</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};