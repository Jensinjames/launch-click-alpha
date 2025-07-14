// Types for content generation
export interface GeneratedContent {
  text?: string;
  content?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  sections?: Array<{
    title: string;
    content: string;
  }>;
  metadata?: {
    wordCount?: number;
    tone?: string;
    audience?: string;
  };
}

export interface GeneratedImage {
  id: string;
  name?: string;
  imageUrl: string;
  prompt: string;
  type: string;
  style?: string;
  model?: string;
  width?: number;
  height?: number;
  created_at: string;
}

export interface ImageStorageData {
  imageUrl: string;
  prompt: string;
  type: string;
  style?: string;
  model?: string;
}