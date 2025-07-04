
import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users } from 'lucide-react';

export const TeamsManagementHeader = React.memo(() => (
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Teams Management</span>
        </CardTitle>
        <CardDescription>
          Manage all teams and their members across the platform
        </CardDescription>
      </div>
    </div>
  </CardHeader>
));

TeamsManagementHeader.displayName = 'TeamsManagementHeader';
