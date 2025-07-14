// Category Header Component - Dynamic Content Headers
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Mail, Share2, Plus } from "lucide-react";
import { useContentNavigation } from "../hooks/useContentNavigation";
import type { CategoryInfo, ContentType } from "../types";

interface CategoryHeaderProps {
  categoryInfo: CategoryInfo;
  contentType: ContentType;
}

export const CategoryHeader = ({ categoryInfo, contentType }: CategoryHeaderProps) => {
  const { navigateToGenerate } = useContentNavigation();

  const getIcon = () => {
    switch (categoryInfo.icon) {
      case 'Mail':
        return <Mail className="h-6 w-6" />;
      case 'Share2':
        return <Share2 className="h-6 w-6" />;
      case 'FileText':
      default:
        return <FileText className="h-6 w-6" />;
    }
  };

  return (
    <Card className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600 rounded-lg text-white">
              {getIcon()}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-purple-900">
                {categoryInfo.title}
              </CardTitle>
              <CardDescription className="text-purple-700 mt-1">
                {categoryInfo.description}
              </CardDescription>
            </div>
          </div>
          <Button 
            onClick={navigateToGenerate}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {categoryInfo.cta}
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};