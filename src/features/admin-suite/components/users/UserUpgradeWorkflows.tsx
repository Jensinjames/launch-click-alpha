import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Users, Crown, ArrowUp, AlertTriangle } from "lucide-react";
import { useAdminMutations } from '@/features/admin/hooks/useAdminMutations';

interface UserUpgradeCandidate {
  user_id: string;
  full_name: string;
  email: string;
  current_plan: string;
  credits_used: number;
  monthly_limit: number;
  usage_percentage: number;
  team_count: number;
  content_generated: number;
  upgrade_score: number;
  recommended_plan: string;
  potential_revenue: number;
}

interface PlanComparison {
  plan_type: string;
  monthly_price: number;
  credits: number;
  team_seats: number;
  features: string[];
  popular?: boolean;
}

const planData: PlanComparison[] = [
  {
    plan_type: 'starter',
    monthly_price: 0,
    credits: 50,
    team_seats: 1,
    features: ['Basic templates', 'Email support']
  },
  {
    plan_type: 'pro',
    monthly_price: 29,
    credits: 200,
    team_seats: 3,
    features: ['Advanced templates', 'Analytics', 'Priority support'],
    popular: true
  },
  {
    plan_type: 'growth',
    monthly_price: 99,
    credits: 500,
    team_seats: 10,
    features: ['Team collaboration', 'Custom templates', 'API access']
  },
  {
    plan_type: 'elite',
    monthly_price: 299,
    credits: 999999,
    team_seats: 999,
    features: ['Unlimited everything', 'White-label', 'Priority phone support']
  }
];

export const UserUpgradeWorkflows = () => {
  const [selectedUser, setSelectedUser] = useState<UserUpgradeCandidate | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const { updateUserPlan } = useAdminMutations();

  const { data: upgradeCandidates, isLoading } = useQuery({
    queryKey: ['upgrade-candidates'],
    queryFn: async (): Promise<UserUpgradeCandidate[]> => {
      // Get users with their plans, credits, and usage data
      const { data, error } = await supabase
        .from('user_credits')
        .select(`
          user_id,
          monthly_limit,
          credits_used,
          profiles!fk_user_credits_profiles(
            full_name,
            email
          ),
          user_plans!fk_user_credits_user_plans(
            plan_type
          )
        `);

      if (error) throw error;

      // Calculate upgrade scores and recommendations
      const candidates = await Promise.all((data || []).map(async (user: any) => {
        const usage_percentage = (user.credits_used / user.monthly_limit) * 100;
        
        // Get additional metrics
        const { count: contentCount } = await supabase
          .from('generated_content')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.user_id);

        const { count: teamCount } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.user_id);

        // Calculate upgrade score based on multiple factors
        let upgrade_score = 0;
        
        // High credit usage indicates engagement
        if (usage_percentage > 80) upgrade_score += 40;
        else if (usage_percentage > 60) upgrade_score += 25;
        else if (usage_percentage > 40) upgrade_score += 10;

        // Content generation frequency
        const content_generated = contentCount || 0;
        if (content_generated > 50) upgrade_score += 30;
        else if (content_generated > 20) upgrade_score += 20;
        else if (content_generated > 10) upgrade_score += 10;

        // Team participation
        const team_count = teamCount || 0;
        if (team_count > 2) upgrade_score += 20;
        else if (team_count > 0) upgrade_score += 10;

        // Determine recommended plan
        const current_plan = user.user_plans?.plan_type || 'starter';
        let recommended_plan = current_plan;
        let potential_revenue = 0;

        if (current_plan === 'starter' && upgrade_score > 50) {
          recommended_plan = usage_percentage > 90 ? 'growth' : 'pro';
          potential_revenue = recommended_plan === 'pro' ? 29 : 99;
        } else if (current_plan === 'pro' && upgrade_score > 70) {
          recommended_plan = 'growth';
          potential_revenue = 70; // Difference between growth and pro
        } else if (current_plan === 'growth' && upgrade_score > 85) {
          recommended_plan = 'elite';
          potential_revenue = 200; // Difference between elite and growth
        }

        return {
          user_id: user.user_id,
          full_name: user.profiles?.full_name || 'Unknown',
          email: user.profiles?.email || '',
          current_plan,
          credits_used: user.credits_used,
          monthly_limit: user.monthly_limit,
          usage_percentage,
          team_count,
          content_generated,
          upgrade_score,
          recommended_plan,
          potential_revenue
        };
      }));

      // Filter and sort candidates
      return candidates
        .filter(c => c.upgrade_score > 30 && c.recommended_plan !== c.current_plan)
        .sort((a, b) => b.upgrade_score - a.upgrade_score);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const handleUpgradeUser = async () => {
    if (!selectedUser || !selectedPlan) return;

    try {
      await updateUserPlan.mutateAsync({
        userId: selectedUser.user_id,
        newPlan: selectedPlan as any
      });
      setSelectedUser(null);
      setSelectedPlan('');
    } catch (error) {
      console.error('Failed to upgrade user:', error);
    }
  };

  const totalRevenuePotential = useMemo(() => 
    upgradeCandidates?.reduce((sum, candidate) => sum + candidate.potential_revenue, 0) || 0
  , [upgradeCandidates]);

  const highPriorityCount = useMemo(() =>
    upgradeCandidates?.filter(c => c.upgrade_score > 70).length || 0
  , [upgradeCandidates]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-surface-secondary rounded w-1/4"></div>
              <div className="h-8 bg-surface-secondary rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-success-subtle rounded-lg">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-secondary">Upgrade Candidates</p>
                <p className="text-2xl font-bold text-primary">{upgradeCandidates?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-warning-subtle rounded-lg">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-secondary">High Priority</p>
                <p className="text-2xl font-bold text-primary">{highPriorityCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-success-subtle rounded-lg">
                <Crown className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-secondary">Revenue Potential</p>
                <p className="text-2xl font-bold text-primary">${totalRevenuePotential}/mo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Candidates List */}
      <Card>
        <CardHeader>
          <CardTitle>Upgrade Candidates</CardTitle>
          <CardDescription>
            Users identified as good candidates for plan upgrades based on usage patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upgradeCandidates?.map((candidate) => (
              <div key={candidate.user_id} className="border border-semantic rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-medium text-primary">{candidate.full_name}</h3>
                      <p className="text-sm text-secondary">{candidate.email}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="capitalize">
                        {candidate.current_plan}
                      </Badge>
                      <ArrowUp className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="default" className="capitalize">
                        {candidate.recommended_plan}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        Usage: {candidate.usage_percentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-secondary">
                        {candidate.credits_used} / {candidate.monthly_limit} credits
                      </p>
                      <Progress 
                        value={candidate.usage_percentage} 
                        className="w-20 h-2 mt-1"
                      />
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium">Score: {candidate.upgrade_score}</p>
                      <p className="text-xs text-success">+${candidate.potential_revenue}/mo</p>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedUser(candidate);
                            setSelectedPlan(candidate.recommended_plan);
                          }}
                        >
                          Upgrade
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upgrade User Plan</DialogTitle>
                          <DialogDescription>
                            Change plan for {candidate.full_name}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Select New Plan</label>
                            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select plan" />
                              </SelectTrigger>
                              <SelectContent>
                                {planData.map((plan) => (
                                  <SelectItem 
                                    key={plan.plan_type} 
                                    value={plan.plan_type}
                                    disabled={plan.plan_type === candidate.current_plan}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span className="capitalize">{plan.plan_type}</span>
                                      <span className="text-sm text-secondary">
                                        ${plan.monthly_price}/mo
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setSelectedUser(null)}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpgradeUser} disabled={!selectedPlan}>
                              Confirm Upgrade
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}
            
            {upgradeCandidates?.length === 0 && (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-primary mb-2">No upgrade candidates</h3>
                <p className="text-secondary">All users are on appropriate plans for their usage.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};