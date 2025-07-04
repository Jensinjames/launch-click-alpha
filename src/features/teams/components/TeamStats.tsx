
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, Mail, CreditCard, TrendingUp } from "lucide-react";

interface Statistics {
  total_members: number;
  pending_invites: number;
  total_credits_used: number;
  total_credits_available: number;
  credits_utilization: string;
}

interface TeamStatsProps {
  statistics: Statistics;
}

export const TeamStats = ({ statistics }: TeamStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold">{statistics.total_members}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <Mail className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Pending Invites</p>
              <p className="text-2xl font-bold">{statistics.pending_invites}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Credits Used</p>
              <p className="text-2xl font-bold">{statistics.total_credits_used}</p>
              <p className="text-xs text-gray-500">of {statistics.total_credits_available}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Utilization</p>
              <p className="text-2xl font-bold">{statistics.credits_utilization}%</p>
              <Progress 
                value={parseFloat(statistics.credits_utilization)} 
                className="w-full mt-2 h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
