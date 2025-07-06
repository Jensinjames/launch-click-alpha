import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MousePointer, TrendingUp, Mail, Share2, FileText, ArrowRight } from "@/lib/icons";
import { Progress } from "@/components/ui/progress";

interface CampaignData {
  id: string;
  title: string;
  type: 'email' | 'social' | 'landing';
  status: 'active' | 'draft' | 'completed';
  metrics: {
    views: number;
    clicks: number;
    conversions: number;
    openRate?: number;
    ctr: number;
  };
  createdAt: string;
}

interface RecentContentPerformanceProps {
  campaigns?: CampaignData[];
}

const RecentContentPerformance = React.memo(({ campaigns = [] }: RecentContentPerformanceProps) => {
  // Mock data for demonstration
  const mockCampaigns: CampaignData[] = [
    {
      id: '1',
      title: 'Summer Product Launch Email',
      type: 'email',
      status: 'active',
      metrics: {
        views: 2847,
        clicks: 342,
        conversions: 28,
        openRate: 24.3,
        ctr: 12.0
      },
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      title: 'Social Media Campaign Q1',
      type: 'social',
      status: 'completed',
      metrics: {
        views: 8934,
        clicks: 1247,
        conversions: 89,
        ctr: 14.0
      },
      createdAt: '2024-01-12'
    },
    {
      id: '3',
      title: 'Landing Page - New Features',
      type: 'landing',
      status: 'active',
      metrics: {
        views: 1543,
        clicks: 298,
        conversions: 34,
        ctr: 19.3
      },
      createdAt: '2024-01-10'
    }
  ];

  const displayCampaigns = campaigns.length > 0 ? campaigns : mockCampaigns;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Campaign Performance</h2>
          <p className="text-muted-foreground">Track your content performance and engagement</p>
        </div>
        <Button variant="outline" className="text-primary hover:text-primary">
          View All Campaigns
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayCampaigns.map((campaign) => {
          const IconComponent = getTypeIcon(campaign.type);
          const conversionRate = ((campaign.metrics.conversions / campaign.metrics.views) * 100);
          
          return (
            <Card key={campaign.id} className="surface-elevated hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${getTypeColor(campaign.type)} text-white`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <Badge variant="secondary" className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {campaign.title}
                    </CardTitle>
                    <CardDescription className="capitalize mt-1">
                      {campaign.type.replace('_', ' ')} • {new Date(campaign.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-foreground">{campaign.metrics.views.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Eye className="h-3 w-3" />
                      Views
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{campaign.metrics.clicks.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <MousePointer className="h-3 w-3" />
                      Clicks
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-success">{campaign.metrics.conversions}</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Conversions
                    </div>
                  </div>
                </div>

                {/* Performance Indicators */}
                <div className="space-y-3 pt-2 border-t border-border">
                  {campaign.metrics.openRate && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Open Rate</span>
                        <span className="font-medium text-foreground">{campaign.metrics.openRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={campaign.metrics.openRate} className="h-2" />
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Click Rate</span>
                      <span className="font-medium text-foreground">{campaign.metrics.ctr.toFixed(1)}%</span>
                    </div>
                    <Progress value={campaign.metrics.ctr} className="h-2" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Conversion Rate</span>
                      <span className="font-medium text-success">{conversionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={conversionRate} className="h-2" />
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