import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ContentAssembly, AssemblyWithContent, CreateAssemblyRequest, UpdateAssemblyRequest } from '@/types/assembly';

export const useContentAssemblies = () => {
  return useQuery({
    queryKey: ['content-assemblies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_assemblies')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as ContentAssembly[];
    }
  });
};

export const useAssemblyWithContent = (assemblyId: string | null) => {
  return useQuery({
    queryKey: ['assembly-with-content', assemblyId],
    queryFn: async () => {
      if (!assemblyId) return null;
      
      const { data, error } = await supabase.rpc('get_assembly_with_content', {
        assembly_uuid: assemblyId
      });

      if (error) throw error;
      return data ? (data as unknown as AssemblyWithContent) : null;
    },
    enabled: !!assemblyId
  });
};

export const useCreateAssembly = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateAssemblyRequest) => {
      // Create the assembly
      const { data: assembly, error: assemblyError } = await supabase
        .from('content_assemblies')
        .insert({
          title: request.title,
          description: request.description,
          assembly_type: request.assembly_type || 'manual',
          user_id: (await supabase.auth.getUser()).data.user?.id!
        })
        .select()
        .single();

      if (assemblyError) throw assemblyError;

      // Add content dependencies
      if (request.content_ids.length > 0) {
        const dependencies = request.content_ids.map((contentId, index) => ({
          assembly_id: assembly.id,
          content_id: contentId,
          dependency_order: index,
          dependency_type: 'component' as const
        }));

        const { error: depsError } = await supabase
          .from('content_dependencies')
          .insert(dependencies);

        if (depsError) throw depsError;
      }

      return assembly;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-assemblies'] });
      toast.success('Content assembly created successfully');
    },
    onError: (error: any) => {
      console.error('Failed to create assembly:', error);
      toast.error('Failed to create content assembly');
    }
  });
};

export const useUpdateAssembly = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateAssemblyRequest & { id: string }) => {
      const { data, error } = await supabase
        .from('content_assemblies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-assemblies'] });
      queryClient.invalidateQueries({ queryKey: ['assembly-with-content'] });
      toast.success('Assembly updated successfully');
    },
    onError: (error: any) => {
      console.error('Failed to update assembly:', error);
      toast.error('Failed to update assembly');
    }
  });
};

export const useDeleteAssembly = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assemblyId: string) => {
      const { error } = await supabase
        .from('content_assemblies')
        .delete()
        .eq('id', assemblyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-assemblies'] });
      toast.success('Assembly deleted successfully');
    },
    onError: (error: any) => {
      console.error('Failed to delete assembly:', error);
      toast.error('Failed to delete assembly');
    }
  });
};

export const useUpdateContentOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assemblyId, contentUpdates }: {
      assemblyId: string;
      contentUpdates: Array<{ dependencyId: string; newOrder: number }>;
    }) => {
      const updates = contentUpdates.map(({ dependencyId, newOrder }) =>
        supabase
          .from('content_dependencies')
          .update({ dependency_order: newOrder })
          .eq('id', dependencyId)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assembly-with-content'] });
      toast.success('Content order updated');
    },
    onError: (error: any) => {
      console.error('Failed to update content order:', error);
      toast.error('Failed to update content order');
    }
  });
};

export const useAddContentToAssembly = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assemblyId, contentIds }: {
      assemblyId: string;
      contentIds: string[];
    }) => {
      // Get current max order
      const { data: existingDeps } = await supabase
        .from('content_dependencies')
        .select('dependency_order')
        .eq('assembly_id', assemblyId)
        .order('dependency_order', { ascending: false })
        .limit(1);

      const startOrder = existingDeps?.[0]?.dependency_order + 1 || 0;

      const newDependencies = contentIds.map((contentId, index) => ({
        assembly_id: assemblyId,
        content_id: contentId,
        dependency_order: startOrder + index,
        dependency_type: 'component' as const
      }));

      const { error } = await supabase
        .from('content_dependencies')
        .insert(newDependencies);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assembly-with-content'] });
      toast.success('Content added to assembly');
    },
    onError: (error: any) => {
      console.error('Failed to add content to assembly:', error);
      toast.error('Failed to add content to assembly');
    }
  });
};

export const useRemoveContentFromAssembly = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dependencyId: string) => {
      const { error } = await supabase
        .from('content_dependencies')
        .delete()
        .eq('id', dependencyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assembly-with-content'] });
      toast.success('Content removed from assembly');
    },
    onError: (error: any) => {
      console.error('Failed to remove content from assembly:', error);
      toast.error('Failed to remove content from assembly');
    }
  });
};