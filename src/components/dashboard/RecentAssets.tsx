
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Star, Clock, Plus, ArrowRight } from "@/lib/icons";

interface AssetItem {
  id: string;
  title: string;
  type: string;
  created_at: string;
  is_favorite?: boolean;
}

interface RecentAssetsProps {
  assets: AssetItem[];
}

const RecentAssets = React.memo(({ assets }: RecentAssetsProps) => {
  if (assets.length === 0) {
    return (
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Recent Content</h2>
          <Button variant="ghost" className="text-primary hover:text-primary font-medium self-start sm:self-auto">
            <span className="hidden sm:inline">View all →</span>
            <span className="sm:hidden">View all</span>
          </Button>
        </div>
        <Card className="border-2 border-dashed border-border/60 bg-gradient-to-br from-surface/30 to-surface/10 backdrop-blur-sm hover:border-border transition-all duration-300 w-full">
          <CardContent className="text-center py-16 sm:py-20 px-4 sm:px-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-surface-elevated to-surface-elevated/60 rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-sm">
              <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/80" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3">No content yet</h3>
            <p className="text-sm sm:text-base text-muted-foreground/80 mb-8 sm:mb-10 max-w-md mx-auto leading-relaxed">
              Get started by creating your first piece of content.
            </p>
            <Button className="bg-gradient-to-r from-primary to-primary/80 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold shadow-elegant hover:shadow-primary/25 hover:scale-105 transition-all duration-300">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Generate Content
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Recent Content</h2>
        <Button variant="ghost" className="text-primary hover:text-primary font-medium self-start sm:self-auto">
          <span className="hidden sm:inline">View all →</span>
          <span className="sm:hidden">View all</span>
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {assets.map((asset: AssetItem, index) => (
          <Card key={index} className="bg-gradient-to-br from-card to-card/70 backdrop-blur-sm border border-border/50 hover:shadow-elegant hover:shadow-primary/10 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-400 cursor-pointer group relative overflow-hidden w-full">
            <CardHeader className="pb-4 sm:pb-5 px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-1">
                    {asset.title}
                  </CardTitle>
                  <CardDescription className="capitalize text-muted-foreground/80 mt-1 sm:mt-2 text-sm">
                    {asset.type.replace('_', ' ')}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-warning p-1.5 sm:p-2 flex-shrink-0">
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs sm:text-sm text-muted-foreground/80 font-medium">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{new Date(asset.created_at).toLocaleDateString()}</span>
                </div>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-2 transition-all duration-300 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});

RecentAssets.displayName = 'RecentAssets';

export default RecentAssets;
