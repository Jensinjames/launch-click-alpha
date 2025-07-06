import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GenerateProvider, useGenerateContext } from "@/contexts/GenerateContext";
import { ContentGeneratorTab } from "@/components/generate/ContentGeneratorTab";
import { VisualAssetsTab } from "@/components/generate/VisualAssetsTab";
import { GeneratedContentTab } from "@/components/generate/GeneratedContentTab";
import { Sparkles, Image, FileText } from "lucide-react";

const GenerateContent = () => {
  const { 
    activeTab, 
    setActiveTab, 
    generatedContent, 
    generatedImages 
  } = useGenerateContext();

  const hasResults = generatedContent || generatedImages.length > 0;

  return (
    <div className="max-w-6xl mx-auto py-0">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="font-bold mb-3 text-foreground text-xl text-left my-0">
          Generate Content
        </h1>
        <p className="text-lg text-muted-foreground">
          Create AI-powered marketing content and visual assets in seconds
        </p>
      </header>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content Generator
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Visual Assets
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2 relative">
            <Sparkles className="h-4 w-4" />
            Generated Content
            {hasResults && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {(generatedContent ? 1 : 0) + generatedImages.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-0">
          <ContentGeneratorTab />
        </TabsContent>

        <TabsContent value="assets" className="mt-0">
          <VisualAssetsTab />
        </TabsContent>

        <TabsContent value="results" className="mt-0">
          <GeneratedContentTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Generate = () => {
  return (
    <AuthGuard requireAuth={true}>
      <Layout>
        <GenerateProvider>
          <GenerateContent />
        </GenerateProvider>
      </Layout>
    </AuthGuard>
  );
};

export default Generate;