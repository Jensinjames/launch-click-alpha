
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Star, Clock, Plus, ArrowRight } from "lucide-react";

interface RecentAssetsProps {
  assets: any[];
}

const RecentAssets = ({ assets }: RecentAssetsProps) => {
  if (assets.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold text-foreground">Recent Content</h2>
          <Button variant="ghost" className="text-primary hover:text-primary-hover font-semibold px-4 py-2 rounded-lg hover:bg-primary/5 transition-all duration-200">
            View all →
          </Button>
        </div>
        <Card className="border-2 border-dashed border-border/40 bg-surface-elevated/30 backdrop-blur-sm rounded-2xl">
          <CardContent className="text-center py-20 px-8">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-brand-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-8 ring-4 ring-white/10">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">No content yet</h3>
            <p className="text-muted-foreground mb-10 max-w-md mx-auto text-lg leading-relaxed">
              Get started by creating your first piece of content.
            </p>
            <Button className="bg-gradient-to-r from-primary to-brand-accent text-white px-8 py-4 rounded-xl font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
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
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-3xl font-bold text-foreground">Recent Content</h2>
        <Button variant="ghost" className="text-primary hover:text-primary-hover font-semibold px-4 py-2 rounded-lg hover:bg-primary/5 transition-all duration-200">
          View all →
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {assets.map((asset: any, index) => (
          <Card key={index} className="bg-surface-elevated/80 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 cursor-pointer group hover:-translate-y-1 rounded-xl border border-border/50">
            <CardHeader className="pb-6 p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-200 mb-2">
                    {asset.title}
                  </CardTitle>
                  <CardDescription className="capitalize text-muted-foreground text-base">
                    {asset.type.replace('_', ' ')}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-warning hover:bg-warning/10 p-2 rounded-lg transition-all duration-200">
                  <Star className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground bg-surface/50 px-3 py-1.5 rounded-full">
                  <Clock className="h-4 w-4 mr-2" />
                  {new Date(asset.created_at).toLocaleDateString()}
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-2 transition-all duration-300" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RecentAssets;
