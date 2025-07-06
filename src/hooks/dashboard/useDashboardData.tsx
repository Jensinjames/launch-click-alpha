import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DashboardData {
  credits: {
    used: number;
    limit: number;
  };
  recentAssets: any[];
}

export const useDashboardData = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    credits: { used: 0, limit: 50 },
    recentAssets: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Single batched RPC call instead of multiple queries
      const { data: result, error } = await supabase.rpc('get_dashboard_data');
      
      if (error) {
        console.error("Error fetching dashboard data:", error);
        setError(error.message);
        return;
      }
      
      if (result && typeof result === 'object') {
        const dashboardData = result as any;
        setData({
          credits: dashboardData.credits || { used: 0, limit: 50 },
          recentAssets: dashboardData.recentAssets || []
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboardData
  };
};