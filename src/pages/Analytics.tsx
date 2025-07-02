
import { useAuth } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import FeatureGate from "@/components/shared/FeatureGate";
import AnalyticsHeader from "@/components/analytics/AnalyticsHeader";
import MetricsRow from "@/components/analytics/MetricsRow";
import PerformanceChart from "@/components/analytics/PerformanceChart";
import ContentTypeBreakdown from "@/components/analytics/ContentTypeBreakdown";
import AdvancedAnalyticsBanner from "@/components/analytics/AdvancedAnalyticsBanner";
import { TeamAnalyticsSection } from "@/components/analytics/TeamAnalyticsSection";

const Analytics = () => {
  return (
    <AuthGuard requireAuth={true}>
      <FeatureGate featureName="page_access_analytics" mode="page">
        <Layout>
          <div className="space-y-8">
            <AnalyticsHeader />
            <MetricsRow />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <PerformanceChart />
              </div>
              <div className="lg:col-span-1">
                <ContentTypeBreakdown />
              </div>
            </div>
            
            <FeatureGate featureName="analytics_advanced" mode="component" graceful={true}>
              <AdvancedAnalyticsBanner />
            </FeatureGate>
            
            <FeatureGate featureName="page_access_teams" mode="component" graceful={true}>
              <TeamAnalyticsSection />
            </FeatureGate>
          </div>
        </Layout>
      </FeatureGate>
    </AuthGuard>
  );
};

export default Analytics;
