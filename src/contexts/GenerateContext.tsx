import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { GeneratedContent, GeneratedImage, ImageStorageData } from '@/types/generate';

type ContentTemplate = Database['public']['Tables']['content_templates']['Row'];

interface GenerateContextType {
  // Content generation state
  selectedType: string;
  setSelectedType: (type: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  title: string;
  setTitle: (title: string) => void;
  tone: string;
  setTone: (tone: string) => void;
  audience: string;
  setAudience: (audience: string) => void;
  selectedTemplate: ContentTemplate | null;
  setSelectedTemplate: (template: ContentTemplate | null) => void;
  
  // Generation state
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  generatedContent: GeneratedContent | null;
  setGeneratedContent: (content: GeneratedContent | null) => void;
  generatedImages: GeneratedImage[];
  setGeneratedImages: (images: GeneratedImage[]) => void;
  
  // Tab navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Storage integration
  saveImageToStorage: (imageData: ImageStorageData) => Promise<void>;
}

const GenerateContext = createContext<GenerateContextType | undefined>(undefined);

export const useGenerateContext = () => {
  const context = useContext(GenerateContext);
  if (!context) {
    throw new Error('useGenerateContext must be used within a GenerateProvider');
  }
  return context;
};

interface GenerateProviderProps {
  children: ReactNode;
}

export const GenerateProvider = ({ children }: GenerateProviderProps) => {
  // Content generation state
  const [selectedType, setSelectedType] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [tone, setTone] = useState("");
  const [audience, setAudience] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  
  // Tab navigation
  const [activeTab, setActiveTab] = useState("content");

  // Storage integration function
  const saveImageToStorage = useCallback(async (imageData: ImageStorageData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('image_assets')
        .insert({
          user_id: user.id,
          image_url: imageData.imageUrl,
          prompt: imageData.prompt,
          image_type: 'generated',
          generation_params: {
            type: imageData.type,
            style: imageData.style,
            model: imageData.model || 'unknown'
          }
        });

      if (error) {
        console.error('Failed to save image to storage:', error);
        throw error;
      }
      
      console.log('Image saved to storage:', data);
    } catch (error) {
      console.error('Error saving image:', error);
      // Don't throw to avoid blocking UI - just log for now
    }
  }, []);

  const value: GenerateContextType = {
    selectedType,
    setSelectedType,
    prompt,
    setPrompt,
    title,
    setTitle,
    tone,
    setTone,
    audience,
    setAudience,
    selectedTemplate,
    setSelectedTemplate,
    isGenerating,
    setIsGenerating,
    generatedContent,
    setGeneratedContent,
    generatedImages,
    setGeneratedImages,
    activeTab,
    setActiveTab,
    saveImageToStorage,
  };

  return (
    <GenerateContext.Provider value={value}>
      {children}
    </GenerateContext.Provider>
  );
};