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
        <div className="w-full px-4 lg:px-6">
          {/* Welcome Header */}
          <header id="dashboard-header" className="mb-4">
            <h1 id="dashboard-title" className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
              Welcome back, {user?.user_metadata?.full_name || "User"}! 👋
            </h1>
            <p className="text-lg text-muted-foreground">
              Ready to create some amazing marketing content today?
            </p>
          </header>

          {/* Enhanced Stats */}
          <EnhancedDashboardStats credits={credits} assetsCount={recentAssets.length} />

          {/* Main Dashboard Grid - Optimized Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
            {/* Main Content Area - Takes up more space */}
            <main id="dashboard-main-content" className="lg:col-span-8 space-y-4">
              <ContentCategoryGrid />
              <RecentContentPerformance />
            </main>

            {/* Right Sidebar - Better space utilization */}
            <aside id="dashboard-sidebar" className="lg:col-span-4">
              <TeamActivityOverview />
            </aside>
          </div>

          {/* Recent Assets Section */}
          <section id="recent-assets-section" aria-labelledby="recent-assets-title">
            <RecentAssets assets={recentAssets} />
          </section>
        </div>
      </Layout>
    </AuthGuard>;
};
export default Dashboard;