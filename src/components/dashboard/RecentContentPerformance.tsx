import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MousePointer, TrendingUp, Mail, Share2, FileText, ArrowRight } from "@/lib/icons";
import { Progress } from "@/components/ui/progress";
import { ContentCardSkeleton } from "@/components/ui/loading-skeleton";
import { useDashboardContent, CampaignData } from "@/hooks/useDashboardContent";

interface RecentContentPerformanceProps {
  campaigns?: CampaignData[];
}

const RecentContentPerformance = React.memo(({ campaigns }: RecentContentPerformanceProps) => {
  const { contentPerformance } = useDashboardContent();
  
  // Use provided campaigns or fetch from hook
  const displayCampaigns = campaigns || contentPerformance.data;
  const isLoading = !campaigns && contentPerformance.isLoading;
  const hasError = !campaigns && contentPerformance.error;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'social': return Share2;
      case 'landing': return FileText;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'from-info to-primary';
      case 'social': return 'from-success to-info';
      case 'landing': return 'from-primary to-brand-accent';
      default: return 'from-muted to-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'draft': return 'bg-warning text-warning-foreground';
      case 'completed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Campaign Performance</h2>
            <p className="text-sm sm:text-base text-muted-foreground/80">Track your content performance and engagement</p>
          </div>
          <Button variant="outline" className="text-primary hover:text-primary border-primary/20 hover:bg-primary/5 self-start sm:self-auto">
            <span className="hidden sm:inline">View All Campaigns</span>
            <span className="sm:hidden">View All</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <ContentCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // Show empty state if no campaigns
  if (!isLoading && displayCampaigns.length === 0) {
    return (
      <div className="space-y-6 sm:space-y-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Campaign Performance</h2>
            <p className="text-sm sm:text-base text-muted-foreground/80">Track your content performance and engagement</p>
          </div>
        </div>
        
        <Card className="bg-gradient-to-br from-card to-card/70 backdrop-blur-sm border border-border/50 text-center p-8">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-muted/50 rounded-full">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">No Content Performance Data</h3>
                <p className="text-muted-foreground mb-4">
                  {hasError 
                    ? "We couldn't load your performance data. Please try again." 
                    : "Start creating content to see performance metrics here."
                  }
                </p>
                {hasError && (
                  <Button onClick={() => contentPerformance.refetch()} variant="outline">
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Campaign Performance</h2>
          <p className="text-sm sm:text-base text-muted-foreground/80">Track your content performance and engagement</p>
        </div>
        <Button variant="outline" className="text-primary hover:text-primary border-primary/20 hover:bg-primary/5 self-start sm:self-auto">
          <span className="hidden sm:inline">View All Campaigns</span>
          <span className="sm:hidden">View All</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {displayCampaigns.map((campaign) => {
          const IconComponent = getTypeIcon(campaign.type);
          const conversionRate = ((campaign.metrics.conversions / campaign.metrics.views) * 100);
          
          return (
            <Card key={campaign.id} className="bg-gradient-to-br from-card to-card/70 backdrop-blur-sm border border-border/50 hover:shadow-elegant hover:shadow-primary/10 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-400 cursor-pointer group relative overflow-hidden w-full">
              <CardHeader className="pb-4 sm:pb-5 px-4 sm:px-6 pt-4 sm:pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-r ${getTypeColor(campaign.type)} text-white shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                        <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <Badge variant="secondary" className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {campaign.title}
                    </CardTitle>
                    <CardDescription className="capitalize mt-1 text-xs sm:text-sm">
                      {campaign.type.replace('_', ' ')} • {new Date(campaign.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
                  <div>
                    <div className="text-lg sm:text-2xl font-bold text-foreground">{campaign.metrics.views.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Eye className="h-3 w-3" />
                      Views
                    </div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-2xl font-bold text-foreground">{campaign.metrics.clicks.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <MousePointer className="h-3 w-3" />
                      Clicks
                    </div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-2xl font-bold text-success">{campaign.metrics.conversions}</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Conv.
                    </div>
                  </div>
                </div>

                {/* Performance Indicators */}
                <div className="space-y-2 sm:space-y-3 pt-2 border-t border-border">
                  {campaign.metrics.openRate && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Open Rate</span>
                        <span className="font-medium text-foreground">{campaign.metrics.openRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={campaign.metrics.openRate} className="h-1.5 sm:h-2" />
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Click Rate</span>
                      <span className="font-medium text-foreground">{campaign.metrics.ctr.toFixed(1)}%</span>
                    </div>
                    <Progress value={campaign.metrics.ctr} className="h-1.5 sm:h-2" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Conversion Rate</span>
                      <span className="font-medium text-success">{conversionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={conversionRate} className="h-1.5 sm:h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
});

RecentContentPerformance.displayName = 'RecentContentPerformance';

export default RecentContentPerformance;