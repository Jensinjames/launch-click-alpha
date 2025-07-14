import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import EnhancedDashboardStats from "@/components/dashboard/EnhancedDashboardStats";
import ContentCategoryGrid from "@/components/dashboard/ContentCategoryGrid";
import RecentContentPerformance from "@/components/dashboard/RecentContentPerformance";
import TeamActivityOverview from "@/components/dashboard/TeamActivityOverview";
import RecentAssets from "@/components/dashboard/RecentAssets";
import { OnboardingBanner } from "@/components/onboarding/OnboardingBanner";
import { useDashboardData } from "@/hooks/dashboard/useDashboardData";

const Dashboard = () => {
  const { user } = useAuth();
  const { data, isLoading, error } = useDashboardData();
  
  // Check if user has completed onboarding
  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });
  return <AuthGuard requireAuth={true}>
      <Layout>
        <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          {/* Welcome Header - Mobile First */}
          <header id="dashboard-header" className="space-y-2 sm:space-y-3">
            <h1 id="dashboard-title" className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight bg-gradient-to-r from-primary via-primary/90 to-brand-secondary bg-clip-text text-transparent tracking-tight">
              Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}! 👋
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground/80 leading-relaxed">
              Ready to create some amazing marketing content today?
            </p>
          </header>

          {/* Onboarding Banner */}
          {profile && !profile.onboarded && <OnboardingBanner />}

          {/* Enhanced Stats */}
          <EnhancedDashboardStats credits={data.credits} assetsCount={data.recentAssets.length} />

          {/* Main Dashboard Grid - Mobile First */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Main Content Area */}
            <main id="dashboard-main-content" className="lg:col-span-8 space-y-6 sm:space-y-8">
              <ContentCategoryGrid />
              <RecentContentPerformance />
            </main>

            {/* Right Sidebar */}
            <aside id="dashboard-sidebar" className="lg:col-span-4">
              <TeamActivityOverview />
            </aside>
          </div>

          {/* Recent Assets Section */}
          <section id="recent-assets-section" aria-labelledby="recent-assets-title">
            <RecentAssets assets={data.recentAssets} />
          </section>
        </div>
      </Layout>
    </AuthGuard>;
};
export default Dashboard;