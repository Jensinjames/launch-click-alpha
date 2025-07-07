import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { queryClient } from '@/lib/queryClient';

export interface ExportJob {
  id: string;
  user_id: string;
  job_type: 'pdf' | 'docx' | 'zip';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  content_ids: string[];
  file_url?: string;
  file_size?: number;
  metadata: any;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  expires_at: string;
}

export interface ExportRequest {
  contentId: string;
  format?: 'pdf' | 'docx';
  template?: 'default' | 'branded';
}

export interface BulkExportRequest {
  contentIds: string[];
  format?: 'json' | 'text' | 'pdf';
  includeMetadata?: boolean;
}

export const useContentExport = () => {
  return useMutation({
    mutationFn: async (request: ExportRequest) => {
      const { data, error } = await supabase.functions.invoke('export-content-pdf', {
        body: request
      });

      if (error) {
        throw new Error(error.message || 'Export failed');
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success('Export completed successfully!');
      // Refresh export jobs
      queryClient.invalidateQueries({ queryKey: ['export-jobs'] });
    },
    onError: (error: Error) => {
      toast.error(`Export failed: ${error.message}`);
    }
  });
};

export const useBulkContentExport = () => {
  return useMutation({
    mutationFn: async (request: BulkExportRequest) => {
      const { data, error } = await supabase.functions.invoke('bulk-export-zip', {
        body: request
      });

      if (error) {
        throw new Error(error.message || 'Bulk export failed');
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(`Bulk export completed! ${data.itemCount} items exported.`);
      // Refresh export jobs
      queryClient.invalidateQueries({ queryKey: ['export-jobs'] });
    },
    onError: (error: Error) => {
      toast.error(`Bulk export failed: ${error.message}`);
    }
  });
};

export const useExportJobs = () => {
  return useQuery({
    queryKey: ['export-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('export_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(error.message);
      }

      return data as ExportJob[];
    },
    refetchInterval: 5000, // Refresh every 5 seconds to track job status
  });
};

export const useDeleteExportJob = () => {
  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('export_jobs')
        .delete()
        .eq('id', jobId);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success('Export job deleted');
      queryClient.invalidateQueries({ queryKey: ['export-jobs'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete job: ${error.message}`);
    }
  });
};