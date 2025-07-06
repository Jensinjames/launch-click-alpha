import { Button } from "@/components/ui/button";
import { CategoryInfo } from "@/utils/contentCategories";
import { useNavigate } from "react-router-dom";
import { 
  Mail, 
  Share2, 
  FileText, 
  Plus 
} from "lucide-react";
import Breadcrumb from "@/components/shared/Breadcrumb";

interface CategoryHeaderProps {
  categoryInfo: CategoryInfo;
  contentType: string;
}

const iconMap = {
  Mail,
  Share2, 
  FileText
};

export const CategoryHeader = ({ categoryInfo, contentType }: CategoryHeaderProps) => {
  const navigate = useNavigate();
  const IconComponent = iconMap[categoryInfo.icon as keyof typeof iconMap] || FileText;

  const breadcrumbItems = [
    { label: "Content", href: "/content" },
    { label: categoryInfo.title, current: true }
  ];

  const handleCreateContent = () => {
    const typeParam = contentType !== 'all' ? `?type=${contentType}` : '';
    navigate(`/generate${typeParam}`);
  };

  return (
    <div className="space-y-4">
      <Breadcrumb items={breadcrumbItems} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <IconComponent className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              {categoryInfo.title}
            </h1>
            <p className="text-lg text-muted-foreground mt-1">
              {categoryInfo.description}
            </p>
          </div>
        </div>
        
        {contentType !== 'all' && (
          <Button 
            onClick={handleCreateContent}
            size="lg"
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>{categoryInfo.cta}</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default CategoryHeader;