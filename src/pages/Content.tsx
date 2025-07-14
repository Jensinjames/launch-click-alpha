import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Copy, Eye, Calendar, FileText, Mail, Share2, MoreHorizontal, Heart, Trash2, Layers } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import { useUserContent } from "@/hooks/useUserContent";
import { useContentMutations } from "@/hooks/useContentMutations";
import { getCategoryInfo, CONTENT_TYPE_ROUTES } from "@/utils/contentCategories";
import CategoryHeader from "@/components/content/CategoryHeader";
import { useContentFilters } from "@/hooks/content/useContentFilters";
import { useContentNavigation } from "@/hooks/content/useContentNavigation";
import { ContentPage } from "@/features/content";
import { CreateAssemblyDialog } from "@/components/assembly";
import { MultiSelectContent } from "@/components/content/MultiSelectContent";

type ContentType = keyof typeof CONTENT_TYPE_ROUTES;

const Content = () => {
  return <ContentPage />;
};
export default Content;