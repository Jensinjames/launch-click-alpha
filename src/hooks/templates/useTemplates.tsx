import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type ContentTemplate = Database['public']['Tables']['content_templates']['Row'];
type ContentType = Database['public']['Enums']['content_type'];

export const useTemplates = (contentType?: ContentType) => {
  return useQuery({
    queryKey: ['templates', contentType],
    queryFn: async () => {
      let query = supabase
        .from('content_templates')
        .select('*')
        .order('usage_count', { ascending: false });
      
      if (contentType) {
        query = query.eq('type', contentType);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ContentTemplate[];
    }
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: {
      name: string;
      description?: string;
      type: ContentType;
      template_data: any;
      is_public?: boolean;
      tags?: string[];
    }) => {
      const { data, error } = await supabase
        .from('content_templates')
        .insert({
          ...template,
          created_by: (await supabase.auth.getUser()).data.user?.id!
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create template');
    }
  });
};

export const useUseTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (templateId: string) => {
      // First get current usage count
      const { data: template, error: fetchError } = await supabase
        .from('content_templates')
        .select('usage_count')
        .eq('id', templateId)
        .maybeSingle();
      
      if (fetchError) {
        console.error('Failed to fetch template:', fetchError);
        throw new Error('Template not found or inaccessible');
      }
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Then increment it
      const { data, error } = await supabase
        .from('content_templates')
        .update({ 
          usage_count: (template.usage_count || 0) + 1
        })
        .eq('id', templateId)
        .select()
        .maybeSingle();
      
      if (error) {
        console.error('Failed to update template usage:', error);
        throw new Error('Failed to update template usage count');
      }
      
      if (!data) {
        throw new Error('Failed to update template');
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template usage tracked successfully');
    },
    onError: (error: any) => {
      console.error('Template usage error:', error);
      toast.error(error.message || 'Failed to use template');
    }
  });
};