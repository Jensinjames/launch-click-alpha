
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Star, Clock, Plus, ArrowRight } from "@/lib/icons";

interface RecentAssetsProps {
  assets: any[];
}

const RecentAssets = React.memo(({ assets }: RecentAssetsProps) => {
  if (assets.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground">Recent Content</h2>
          <Button variant="ghost" className="text-primary hover:text-primary font-medium">
            View all →
          </Button>
        </div>
        <Card className="border-2 border-dashed border-border/60 bg-gradient-to-br from-surface/30 to-surface/10 backdrop-blur-sm hover:border-border transition-all duration-300">
          <CardContent className="text-center py-20">
            <div className="w-20 h-20 bg-gradient-to-br from-surface-elevated to-surface-elevated/60 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
              <FileText className="h-10 w-10 text-muted-foreground/80" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">No content yet</h3>
            <p className="text-muted-foreground/80 mb-10 max-w-md mx-auto leading-relaxed">
              Get started by creating your first piece of content.
            </p>
            <Button className="bg-gradient-to-r from-primary to-primary/80 text-white px-8 py-4 rounded-xl font-semibold shadow-elegant hover:shadow-primary/25 hover:scale-105 transition-all duration-300">
              <Plus className="h-5 w-5 mr-2" />
              Generate Content
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-foreground">Recent Content</h2>
        <Button variant="ghost" className="text-primary hover:text-primary font-medium">
          View all →
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {assets.map((asset: any, index) => (
          <Card key={index} className="bg-gradient-to-br from-card to-card/70 backdrop-blur-sm border border-border/50 hover:shadow-elegant hover:shadow-primary/10 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-400 cursor-pointer group relative overflow-hidden">
            <CardHeader className="pb-5 px-6 pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                    {asset.title}
                  </CardTitle>
                  <CardDescription className="capitalize text-muted-foreground/80 mt-2">
                    {asset.type.replace('_', ' ')}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-warning p-2">
                  <Star className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-6 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground/80 font-medium">
                  <Clock className="h-4 w-4 mr-2" />
                  {new Date(asset.created_at).toLocaleDateString()}
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-2 transition-all duration-300" />
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
