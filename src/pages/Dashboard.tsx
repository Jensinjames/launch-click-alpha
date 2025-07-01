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
      const {
        data: creditsData
      } = await supabase.from("user_credits").select("*").single();
      if (creditsData) {
        setCredits({
          used: creditsData.credits_used,
          limit: creditsData.monthly_limit
        });
      }
      const {
        data: assetsData
      } = await supabase.from("generated_content").select("*").order("created_at", {
        ascending: false
      }).limit(5);
      if (assetsData) {
        setRecentAssets(assetsData);
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