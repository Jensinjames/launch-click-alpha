import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import EnhancedDashboardStats from "@/components/dashboard/EnhancedDashboardStats";
import ContentCategoryGrid from "@/components/dashboard/ContentCategoryGrid";
import RecentContentPerformance from "@/components/dashboard/RecentContentPerformance";
import TeamActivityOverview from "@/components/dashboard/TeamActivityOverview";
import RecentAssets from "@/components/dashboard/RecentAssets";
const Dashboard = () => {
  const {
    user
  } = useAuth();
  const [credits, setCredits] = useState({
    used: 0,
    limit: 50
  });
  const [recentAssets, setRecentAssets] = useState([]);
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);
  const fetchUserData = async () => {
    try {
      // Single batched RPC call instead of multiple queries
      const { data, error } = await supabase.rpc('get_dashboard_data');
      
      if (error) {
        console.error("Error fetching dashboard data:", error);
        return;
      }
      
      if (data && typeof data === 'object') {
        const result = data as any;
        if (result.credits) {
          setCredits(result.credits);
        }
        if (result.recentAssets) {
          setRecentAssets(result.recentAssets);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };
  return <AuthGuard requireAuth={true}>
      <Layout>
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
              Welcome back, {user?.user_metadata?.full_name || "User"}! 👋
            </h1>
            <p className="text-lg text-muted-foreground">
              Ready to create some amazing marketing content today?
            </p>
          </div>

          {/* Enhanced Stats */}
          <EnhancedDashboardStats credits={credits} assetsCount={recentAssets.length} />

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
            {/* Main Content Area */}
            <div className="xl:col-span-3 space-y-8">
              <ContentCategoryGrid />
              <RecentContentPerformance />
            </div>

            {/* Right Sidebar */}
            <div className="xl:col-span-1">
              <TeamActivityOverview />
            </div>
          </div>

          {/* Recent Assets Section */}
          <RecentAssets assets={recentAssets} />
        </div>
      </Layout>
    </AuthGuard>;
};
export default Dashboard;