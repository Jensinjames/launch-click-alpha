// Export Service - Complete Implementation
import { supabase } from "@/integrations/supabase/client";

export interface ExportJobData {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url?: string;
  error_message?: string;
  progress: number;
}

export class ExportService {
  static async createExportJob(contentIds: string[], format: 'pdf' | 'zip' | 'csv' = 'zip'): Promise<ExportJobData> {
    try {
      const { data: job, error } = await supabase
        .from('export_jobs')
        .insert({
          content_ids: contentIds,
          job_type: 'bulk_export',
          status: 'pending',
          metadata: { format }
        })
        .select()
        .single();

      if (error || !job) {
        throw new Error('Failed to create export job');
      }

      // Trigger export processing
      await this.processExport(job.id, contentIds, format);

      return {
        id: job.id,
        status: 'processing',
        progress: 0
      };
    } catch (error) {
      console.error('Export job creation failed:', error);
      throw error;
    }
  }

  private static async processExport(jobId: string, contentIds: string[], format: string): Promise<void> {
    try {
      // Call edge function to process export
      const { data, error } = await supabase.functions.invoke('bulk-export-zip', {
        body: {
          job_id: jobId,
          content_ids: contentIds,
          format
        }
      });

      if (error) {
        await this.updateJobStatus(jobId, 'failed', error.message);
      }
    } catch (error) {
      console.error('Export processing failed:', error);
      await this.updateJobStatus(jobId, 'failed', 'Export processing failed');
    }
  }

  static async getJobStatus(jobId: string): Promise<ExportJobData | null> {
    try {
      const { data: job, error } = await supabase
        .from('export_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error || !job) {
        return null;
      }

      return {
        id: job.id,
        status: job.status,
        file_url: job.file_url,
        error_message: job.error_message,
        progress: job.status === 'completed' ? 100 : 
                 job.status === 'processing' ? 50 : 
                 job.status === 'failed' ? 0 : 10
      };
    } catch (error) {
      console.error('Failed to get job status:', error);
      return null;
    }
  }

  private static async updateJobStatus(jobId: string, status: string, errorMessage?: string): Promise<void> {
    await supabase
      .from('export_jobs')
      .update({ 
        status, 
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }

  static async exportSingleContent(contentId: string, format: 'pdf' | 'json' = 'pdf'): Promise<{ file_url: string } | null> {
    try {
      const { data, error } = await supabase.functions.invoke('export-content-pdf', {
        body: { content_id: contentId, format }
      });

      if (error || !data?.file_url) {
        throw new Error('Export failed');
      }

      return { file_url: data.file_url };
    } catch (error) {
      console.error('Single content export failed:', error);
      return null;
    }
  }
}