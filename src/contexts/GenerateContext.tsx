import { createContext, useContext, useState, ReactNode } from 'react';
import type { Database } from '@/integrations/supabase/types';

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
  generatedContent: any;
  setGeneratedContent: (content: any) => void;
  generatedImages: any[];
  setGeneratedImages: (images: any[]) => void;
  
  // Tab navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
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
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  
  // Tab navigation
  const [activeTab, setActiveTab] = useState("content");

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
  };

  return (
    <GenerateContext.Provider value={value}>
      {children}
    </GenerateContext.Provider>
  );
};