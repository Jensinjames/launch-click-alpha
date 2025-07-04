import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import DashboardStats from "@/components/dashboard/DashboardStats";
import AssetGeneratorGrid from "@/components/dashboard/AssetGeneratorGrid";
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
        <div className="space-y-8">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-3 text-violet-700">
              Welcome back, {user?.user_metadata?.full_name || "User"}! 👋
            </h1>
            <p className="text-lg text-zinc-50">
              Ready to create some amazing marketing content today?
            </p>
          </div>

          <DashboardStats credits={credits} assetsCount={recentAssets.length} />

          <AssetGeneratorGrid />

          <RecentAssets assets={recentAssets} />
        </div>
      </Layout>
    </AuthGuard>;
};
export default Dashboard;