import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Share2, FileText, PenTool, Megaphone, TrendingUp, Loader2, Sparkles } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import { TemplateSelector } from "@/components/templates/TemplateSelector";
import { useContentGeneration } from "@/hooks/useUserContent";
import { useUserPlan } from "@/hooks/useUserPlan";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Database } from '@/integrations/supabase/types';

type ContentTemplate = Database['public']['Tables']['content_templates']['Row'];

// Map frontend content type IDs to database enum values
const contentTypeMapping: Record<string, Database['public']['Enums']['content_type']> = {
  email: 'email_sequence',
  social: 'social_post',
  landing: 'landing_page',
  blog: 'blog_post',
  ad: 'ad_copy',
  funnel: 'funnel'
};

const Generate = () => {
  const [searchParams] = useSearchParams();
  const [selectedType, setSelectedType] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [tone, setTone] = useState("");
  const [audience, setAudience] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  
  const { generateContent } = useContentGeneration();
  const { plan, hasCreditsRemaining } = useUserPlan();
  const queryClient = useQueryClient();

  // Handle URL parameter for pre-selecting content type
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam && !selectedType) {
      setSelectedType(typeParam);
    }
  }, [searchParams, selectedType]);
  const contentTypes = [{
    id: "email",
    title: "Email Campaign",
    description: "Generate compelling email content",
    icon: Mail,
    credits: 15
  }, {
    id: "social",
    title: "Social Media Post",
    description: "Create engaging social media content",
    icon: Share2,
    credits: 5
  }, {
    id: "landing",
    title: "Landing Page Copy",
    description: "High-converting landing page content",
    icon: FileText,
    credits: 10
  }, {
    id: "blog",
    title: "Blog Post",
    description: "SEO-optimized blog content",
    icon: PenTool,
    credits: 8
  }, {
    id: "ad",
    title: "Ad Copy",
    description: "Persuasive advertising content",
    icon: Megaphone,
    credits: 6
  }, {
    id: "funnel",
    title: "Sales Funnel",
    description: "Complete funnel sequence",
    icon: TrendingUp,
    credits: 20
  }];
  const handleTemplateSelect = (template: ContentTemplate) => {
    setSelectedTemplate(template);
    // Apply template data to the form
    const templateData = template.template_data as any;
    if (templateData?.prompt) {
      setPrompt(templateData.prompt);
    }
  };

  const handleGenerate = async () => {
    if (!selectedType || !prompt.trim()) return;
    
    if (!hasCreditsRemaining()) {
      toast.error('Insufficient credits. Please upgrade your plan or wait for your monthly reset.');
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const result = await generateContent({
        type: contentTypeMapping[selectedType],
        prompt,
        title: title || `${contentTypes.find(t => t.id === selectedType)?.title} - ${new Date().toLocaleDateString()}`,
        tone,
        audience
      });

      if (result.success) {
        setGeneratedContent(result.content);
        queryClient.invalidateQueries({ queryKey: ['user-content'] });
        queryClient.invalidateQueries({ queryKey: ['userPlan'] });
        toast.success(`Content generated successfully! ${result.creditsUsed} credits used.`);
      } else {
        throw new Error(result.error || 'Failed to generate content');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      if (error.message?.includes('Insufficient credits')) {
        toast.error(`Insufficient credits. You need ${error.creditsNeeded} credits but only have ${error.creditsAvailable} remaining.`);
      } else {
        toast.error(error.message || 'Failed to generate content. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };
  return <AuthGuard requireAuth={true}>
      <Layout>
        <div className="max-w-4xl mx-auto py-0">
          {/* Page Header */}
          <header className="mb-8">
            <h1 className="font-bold mb-3 text-foreground text-xl text-left my-0">
              Generate Content
            </h1>
            <p className="text-lg text-muted-foreground">
              Create AI-powered marketing content in seconds
            </p>
          </header>

          {/* Content Type Selection */}
          <section aria-labelledby="content-types-heading" className="mb-8">
            <h2 id="content-types-heading" className="text-2xl font-semibold mb-6">
              Choose Content Type
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contentTypes.map(type => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              return <button key={type.id} onClick={() => setSelectedType(type.id)} className={`
                      p-4 rounded-lg border-2 text-left transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                      ${isSelected ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'}
                    `} aria-pressed={isSelected} aria-describedby={`${type.id}-description`}>
                    <div className="flex items-start space-x-3">
                      <div className={`
                        p-2 rounded-lg
                        ${isSelected ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}
                      `}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate text-foreground">
                          {type.title}
                        </h3>
                        <p id={`${type.id}-description`} className="text-sm mt-1 text-muted-foreground">
                          {type.description}
                        </p>
                        <span className="inline-block mt-2 text-xs font-medium text-purple-600">
                          {type.credits} credits
                        </span>
                      </div>
                    </div>
                  </button>;
            })}
            </div>
          </section>

          {/* Generation Form */}
          {selectedType && <section aria-labelledby="generation-form-heading">
              <Card>
                <CardHeader>
                  <CardTitle id="generation-form-heading">
                    Generate {contentTypes.find(t => t.id === selectedType)?.title}
                  </CardTitle>
                  <CardDescription>
                    Provide details about what you want to create
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Template Selection */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">Start with a Template</h3>
                        <p className="text-sm text-gray-600">Jump start your content with pre-made templates</p>
                      </div>
                    </div>
                    <TemplateSelector 
                      contentType={contentTypeMapping[selectedType]} 
                      onTemplateSelect={handleTemplateSelect}
                    >
                      <Button variant="outline" className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Browse Templates
                      </Button>
                    </TemplateSelector>
                  </div>

                  {selectedTemplate && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">Template Applied: {selectedTemplate.name}</span>
                      </div>
                      <p className="text-sm text-green-700">{selectedTemplate.description}</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedTemplate(null)}
                        className="mt-2 text-green-700 hover:text-green-800"
                      >
                        Clear Template
                      </Button>
                    </div>
                  )}

                  <form onSubmit={e => {
                e.preventDefault();
                handleGenerate();
              }} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="content-title" className="text-sm font-medium">
                        Content Title (Optional)
                      </Label>
                      <Input 
                        id="content-title" 
                        name="title"
                        placeholder="Enter a custom title for your content" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content-prompt" className="text-sm font-medium">
                        Describe your content requirements *
                      </Label>
                      <Textarea id="content-prompt" name="prompt" placeholder="Describe what you want to create, your target audience, key messages, tone of voice, etc." value={prompt} onChange={e => setPrompt(e.target.value)} className="min-h-[120px] resize-y" required aria-describedby="prompt-help" />
                      <p id="prompt-help" className="text-sm text-gray-500">
                        Be as specific as possible for better results. Include target audience, tone, key points, and any specific requirements.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tone-select">Tone of Voice</Label>
                        <Select value={tone} onValueChange={setTone}>
                          <SelectTrigger id="tone-select">
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="humorous">Humorous</SelectItem>
                            <SelectItem value="authoritative">Authoritative</SelectItem>
                            <SelectItem value="conversational">Conversational</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="audience-input">Target Audience</Label>
                        <Input 
                          id="audience-input" 
                          name="audience"
                          placeholder="e.g., B2B decision makers, young professionals" 
                          value={audience}
                          onChange={e => setAudience(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button 
                        type="submit" 
                        className="w-full md:w-auto" 
                        disabled={!prompt.trim() || isGenerating || !hasCreditsRemaining()} 
                        aria-describedby="generate-button-help"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                            Generating...
                          </>
                        ) : (
                          `Generate Content (${contentTypes.find(t => t.id === selectedType)?.credits} credits)`
                        )}
                      </Button>
                      
                      <div className="text-sm space-y-1">
                        <p id="generate-button-help" className="text-muted-foreground">
                          Generation typically takes 10-30 seconds
                        </p>
                        {plan && (
                          <p className="text-muted-foreground">
                            Credits remaining: {plan.monthlyLimit - plan.creditsUsed} / {plan.monthlyLimit}
                          </p>
                        )}
                        {!hasCreditsRemaining() && (
                          <p className="text-destructive text-sm">
                            Insufficient credits. Upgrade your plan or wait for monthly reset.
                          </p>
                        )}
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Generated Content Display */}
              {generatedContent && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      Generated Content
                    </CardTitle>
                    <CardDescription>
                      Your AI-generated content is ready! You can copy it or make edits.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-medium mb-2 text-foreground">{generatedContent.title}</h3>
                      <div className="whitespace-pre-wrap text-muted-foreground">
                        {generatedContent.content?.text || 'No content generated'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => navigator.clipboard.writeText(generatedContent.content?.text || '')}
                      >
                        Copy to Clipboard
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setGeneratedContent(null);
                          setPrompt('');
                          setTitle('');
                          setSelectedTemplate(null);
                        }}
                      >
                        Generate New
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>}
        </div>
      </Layout>
    </AuthGuard>;
};
export default Generate;