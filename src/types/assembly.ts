export interface ContentAssembly {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  assembly_type: 'manual' | 'template' | 'automated';
  status: 'draft' | 'published' | 'archived';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ContentDependency {
  id: string;
  assembly_id: string;
  content_id: string;
  dependency_order: number;
  dependency_type: 'component' | 'prerequisite' | 'reference';
  settings: Record<string, any>;
  created_at: string;
}

export interface AssemblyWithContent {
  assembly: ContentAssembly;
  content: Array<{
    dependency_id: string;
    dependency_order: number;
    dependency_type: string;
    settings: Record<string, any>;
    content: {
      id: string;
      title: string;
      type: string;
      content: any;
      created_at: string;
    };
  }>;
}

export interface CreateAssemblyRequest {
  title: string;
  description?: string;
  assembly_type?: 'manual' | 'template' | 'automated';
  content_ids: string[];
}

export interface UpdateAssemblyRequest {
  title?: string;
  description?: string;
  status?: 'draft' | 'published' | 'archived';
  metadata?: Record<string, any>;
}