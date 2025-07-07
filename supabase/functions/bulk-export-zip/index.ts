import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkExportRequest {
  contentIds: string[];
  format?: 'json' | 'text' | 'pdf';
  includeMetadata?: boolean;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Simple ZIP creation function using JSZip-like functionality
async function createZipArchive(contents: any[], format: string, includeMetadata: boolean): Promise<Uint8Array> {
  // For now, we'll create a simple text-based archive
  // In production, you'd want to use a proper ZIP library
  let archiveContent = '';
  
  // Add manifest
  const manifest = {
    exportDate: new Date().toISOString(),
    totalItems: contents.length,
    format: format,
    includeMetadata: includeMetadata
  };
  
  archiveContent += `MANIFEST.json\n${JSON.stringify(manifest, null, 2)}\n\n${'='.repeat(50)}\n\n`;
  
  // Add each content item
  for (let i = 0; i < contents.length; i++) {
    const content = contents[i];
    const fileName = `${i + 1}_${content.title.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;
    
    archiveContent += `${fileName}\n`;
    
    if (format === 'json') {
      archiveContent += JSON.stringify(content, null, 2);
    } else if (format === 'text') {
      archiveContent += formatContentAsText(content, includeMetadata);
    }
    
    archiveContent += `\n\n${'='.repeat(50)}\n\n`;
  }
  
  return new TextEncoder().encode(archiveContent);
}

function formatContentAsText(content: any, includeMetadata: boolean): string {
  let output = `Title: ${content.title}\n`;
  output += `Type: ${content.type}\n`;
  output += `Created: ${new Date(content.created_at).toLocaleString()}\n\n`;
  
  if (includeMetadata && content.metadata) {
    output += `Metadata:\n${JSON.stringify(content.metadata, null, 2)}\n\n`;
  }
  
  output += `Content:\n`;
  if (typeof content.content === 'string') {
    output += content.content;
  } else {
    output += JSON.stringify(content.content, null, 2);
  }
  
  if (includeMetadata) {
    output += `\n\nPrompt: ${content.prompt || 'N/A'}`;
    if (content.content_tags && content.content_tags.length > 0) {
      output += `\nTags: ${content.content_tags.join(', ')}`;
    }
  }
  
  return output;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      contentIds, 
      format = 'json', 
      includeMetadata = true 
    }: BulkExportRequest = await req.json();

    if (!contentIds || contentIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Content IDs are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user ID from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create export job record
    const { data: exportJob, error: jobError } = await supabase
      .from('export_jobs')
      .insert({
        user_id: user.id,
        job_type: 'zip',
        status: 'processing',
        content_ids: contentIds,
        metadata: { format, includeMetadata, itemCount: contentIds.length }
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating export job:', jobError);
      return new Response(
        JSON.stringify({ error: 'Failed to create export job' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all content items
    const { data: contents, error: contentError } = await supabase
      .from('generated_content')
      .select('*')
      .in('id', contentIds)
      .eq('user_id', user.id);

    if (contentError || !contents || contents.length === 0) {
      // Update job as failed
      await supabase
        .from('export_jobs')
        .update({ 
          status: 'failed', 
          error_message: 'No accessible content found',
          updated_at: new Date().toISOString()
        })
        .eq('id', exportJob.id);

      return new Response(
        JSON.stringify({ error: 'No accessible content found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Create ZIP archive
      const zipBuffer = await createZipArchive(contents, format, includeMetadata);
      
      // Upload to storage
      const fileName = `exports/${user.id}/${exportJob.id}_bulk_export_${contents.length}_items.zip`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('content-exports')
        .upload(fileName, zipBuffer, {
          contentType: 'application/zip',
          cacheControl: '3600'
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('content-exports')
        .getPublicUrl(fileName);

      // Update export job as completed
      await supabase
        .from('export_jobs')
        .update({
          status: 'completed',
          file_url: urlData.publicUrl,
          file_size: zipBuffer.length,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', exportJob.id);

      return new Response(
        JSON.stringify({
          success: true,
          jobId: exportJob.id,
          downloadUrl: urlData.publicUrl,
          fileName: fileName.split('/').pop(),
          itemCount: contents.length,
          processedCount: contents.length
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (error) {
      console.error('Bulk export processing error:', error);
      
      // Update job as failed
      await supabase
        .from('export_jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', exportJob.id);

      return new Response(
        JSON.stringify({ error: 'Bulk export processing failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in bulk-export-zip function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);