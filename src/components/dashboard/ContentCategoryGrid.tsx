import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Share2, FileText, Bell, Workflow, File, ArrowRight } from "@/lib/icons";

interface ContentCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
  count: number;
  recentCount: number;
  route: string;
}

const ContentCategoryGrid = React.memo(() => {
  const navigate = useNavigate();

  const categories: ContentCategory[] = [
    {
      id: 'emails',
      name: 'Email Campaigns',
      description: 'Newsletters, promotions, and automated sequences',
      icon: Mail,
      color: 'from-info to-primary',
      bgColor: 'bg-info/10',
      borderColor: 'border-info/20',
      count: 24,
      recentCount: 3,
      route: '/content?type=email'
    },
    {
      id: 'social',
      name: 'Social Media',
      description: 'Posts for all social platforms and campaigns',
      icon: Share2,
      color: 'from-success to-info',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20',
      count: 18,
      recentCount: 5,
      route: '/content?type=social'
    },
    {
      id: 'landing',
      name: 'Landing Pages',
      description: 'High-converting page copy and layouts',
      icon: FileText,
      color: 'from-primary to-brand-accent',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      count: 12,
      recentCount: 2,
      route: '/content?type=landing'
    },
    {
      id: 'ads',
      name: 'Ad Copy',
      description: 'Google, Facebook, and display advertisements',
      icon: Bell,
      color: 'from-warning to-primary',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/20',
      count: 8,
      recentCount: 1,
      route: '/content?type=ad'
    },
    {
      id: 'funnels',
      name: 'Sales Funnels',
      description: 'Complete funnel sequences and automation',
      icon: Workflow,
      color: 'from-brand-secondary to-primary',
      bgColor: 'bg-brand-secondary/10',
      borderColor: 'border-brand-secondary/20',
      count: 6,
      recentCount: 1,
      route: '/content?type=funnel'
    },
    {
      id: 'blogs',
      name: 'Blog Posts',
      description: 'Articles, guides, and thought leadership content',
      icon: File,
      color: 'from-muted-foreground to-primary',
      bgColor: 'bg-muted/10',
      borderColor: 'border-muted/20',
      count: 15,
      recentCount: 2,
      route: '/content?type=blog'
    }
  ];

  const handleCategoryClick = (category: ContentCategory) => {
    navigate(category.route);
  };

  return (
    <section aria-labelledby="content-categories-title" className="space-y-4 sm:space-y-6 w-full">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 id="content-categories-title" className="text-xl sm:text-2xl font-bold text-foreground">Content Categories</h2>
          <p className="text-sm sm:text-base text-muted-foreground/80">Quick access to your content by type</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {categories.map((category) => {
          const IconComponent = category.icon;
          return (
            <Card 
              key={category.id}
              id={`content-category-${category.id}`}
              className={`bg-gradient-to-br from-card to-card/60 backdrop-blur-sm border-2 ${category.borderColor} hover:shadow-elegant hover:shadow-primary/15 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-400 cursor-pointer group focus-visible relative overflow-hidden w-full`}
              onClick={() => handleCategoryClick(category)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCategoryClick(category);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`View ${category.name}: ${category.description}`}
              aria-describedby={`category-description-${category.id}`}
            >
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-r ${category.color} text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg flex-shrink-0`}>
                        <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      {category.recentCount > 0 && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                          +{category.recentCount} new
                        </Badge>
                      )}
                    </div>
                    
                    <CardTitle className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-1">
                      {category.name}
                    </CardTitle>
                    <CardDescription 
                      id={`category-description-${category.id}`}
                      className="text-xs sm:text-sm text-muted-foreground/80 mt-1 sm:mt-2 line-clamp-2 leading-relaxed"
                    >
                      {category.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{category.count}</div>
                      <div className="text-xs text-muted-foreground/60 font-medium">Total</div>
                    </div>
                    {category.recentCount > 0 && (
                      <div className="text-center">
                        <div className="text-base sm:text-lg font-bold text-success">+{category.recentCount}</div>
                        <div className="text-xs text-muted-foreground/60 font-medium">This week</div>
                      </div>
                    )}
                  </div>
                  
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-2 transition-all duration-300 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
});

ContentCategoryGrid.displayName = 'ContentCategoryGrid';

export default ContentCategoryGrid;