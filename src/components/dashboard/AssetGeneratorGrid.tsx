
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
    <section aria-labelledby="quick-actions-title" className="mb-16">
      <div className="flex items-center justify-between mb-10">
        <h2 id="quick-actions-title" className="text-3xl font-bold text-foreground">
          Quick Actions
        </h2>
        <Button 
          variant="ghost" 
          className="text-primary hover:text-primary-hover font-semibold px-4 py-2 rounded-lg hover:bg-primary/5 transition-all duration-200"
        >
          View all options →
        </Button>
      </div>
      
      <div 
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
        role="grid"
        aria-label="Asset generation options"
      >
        {assetTypes.map((asset, index) => (
          <Card 
            key={asset.id}
            className={`bg-surface-elevated/90 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/15 transition-all duration-500 cursor-pointer group relative overflow-hidden border-2 ${asset.borderColor} focus-visible hover:-translate-y-2 rounded-2xl`}
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
            <CardHeader className="pb-6 p-8">
              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${asset.color} text-white mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 w-fit shadow-lg`}>
                {asset.icon}
              </div>
              <CardTitle className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-200">
                {asset.title}
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground leading-relaxed">
                {asset.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 p-8">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                  {asset.credits} credits
                </span>
                <ArrowRight 
                  className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-2 transition-all duration-300" 
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
