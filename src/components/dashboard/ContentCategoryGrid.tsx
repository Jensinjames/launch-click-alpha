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
    <section aria-labelledby="content-categories-title" className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 id="content-categories-title" className="text-2xl font-bold text-foreground">Content Categories</h2>
          <p className="text-muted-foreground">Quick access to your content by type</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const IconComponent = category.icon;
          return (
            <Card 
              key={category.id}
              id={`content-category-${category.id}`}
              className={`surface-elevated hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 ${category.borderColor} focus-visible`}
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
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      {category.recentCount > 0 && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          +{category.recentCount} new
                        </Badge>
                      )}
                    </div>
                    
                    <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {category.name}
                    </CardTitle>
                    <CardDescription 
                      id={`category-description-${category.id}`}
                      className="text-sm text-muted-foreground mt-1 line-clamp-2"
                    >
                      {category.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{category.count}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    {category.recentCount > 0 && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-success">+{category.recentCount}</div>
                        <div className="text-xs text-muted-foreground">This week</div>
                      </div>
                    )}
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
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