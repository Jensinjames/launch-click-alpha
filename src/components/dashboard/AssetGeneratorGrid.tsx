
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Share2, FileText, ArrowRight } from "lucide-react";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";

const AssetGeneratorGrid = () => {
  const { containerRef } = useKeyboardNavigation({
    enableArrowKeys: true,
    enableTabNavigation: true,
  });

  const assetTypes = React.useMemo(() => [
    {
      id: 'email-campaign',
      icon: <Mail className="h-6 w-6" aria-hidden="true" />,
      title: "Generate Email Campaign",
      description: "Create compelling email content with AI",
      color: "from-info to-primary",
      bgColor: "bg-info/10",
      borderColor: "border-info/20",
      credits: 15
    },
    {
      id: 'social-media',
      icon: <Share2 className="h-6 w-6" aria-hidden="true" />,
      title: "Social Media Posts",
      description: "Generate posts for all platforms",
      color: "from-success to-info",
      bgColor: "bg-success/10",
      borderColor: "border-success/20",
      credits: 5
    },
    {
      id: 'landing-page',
      icon: <FileText className="h-6 w-6" aria-hidden="true" />,
      title: "Landing Page Copy",
      description: "High-converting page content",
      color: "from-primary to-brand-accent",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      credits: 10
    }
  ], []);

  return (
    <section aria-labelledby="quick-actions-title" className="mb-12">
      <div className="flex items-center justify-between mb-8">
        <h2 id="quick-actions-title" className="text-2xl font-bold text-foreground">
          Quick Actions
        </h2>
        <Button 
          variant="ghost" 
          className="text-primary hover:text-primary-hover font-medium focus-visible"
        >
          View all options →
        </Button>
      </div>
      
      <div 
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        role="grid"
        aria-label="Asset generation options"
      >
        {assetTypes.map((asset, index) => (
          <Card 
            key={asset.id}
            className={`surface-elevated hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden border-2 ${asset.borderColor} focus-visible`}
            role="gridcell"
            tabIndex={0}
            aria-label={`${asset.title}: ${asset.description}. Costs ${asset.credits} credits`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Handle asset selection
                console.log(`Selected: ${asset.title}`);
              }
            }}
          >
            <CardHeader className="pb-4">
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${asset.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300 w-fit`}>
                {asset.icon}
              </div>
              <CardTitle className="text-xl font-semibold text-foreground">
                {asset.title}
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                {asset.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-primary">
                  {asset.credits} credits
                </span>
                <ArrowRight 
                  className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" 
                  aria-hidden="true"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default AssetGeneratorGrid;
