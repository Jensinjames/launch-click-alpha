import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Upload, FileText, Database, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  data_type: 'users' | 'teams' | 'content' | 'analytics' | 'audit_logs';
  date_range: 'all' | '7d' | '30d' | '90d' | 'custom';
  include_pii: boolean;
  gdpr_compliant: boolean;
  custom_start_date?: string;
  custom_end_date?: string;
}

interface ImportOptions {
  operation: 'create' | 'update' | 'upsert';
  data_type: 'users' | 'teams' | 'user_plans';
  validation_level: 'strict' | 'lenient';
  dry_run: boolean;
}

interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  download_url?: string;
  created_at: string;
  estimated_completion?: string;
  file_size?: number;
  error_message?: string;
}

export const DataExportImport = () => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    data_type: 'users',
    date_range: '30d',
    include_pii: false,
    gdpr_compliant: true
  });
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    operation: 'create',
    data_type: 'users',
    validation_level: 'strict',
    dry_run: true
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Get active export jobs
  const { data: exportJobs, refetch: refetchJobs } = useQuery({
    queryKey: ['export-jobs'],
    queryFn: async (): Promise<ExportJob[]> => {
      // In a real implementation, this would query a jobs table
      // For now, we'll simulate some jobs
      return [
        {
          id: '1',
          status: 'completed',
          progress: 100,
          download_url: '/api/downloads/users-export-2024-01-15.csv',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          file_size: 1024 * 1024 * 2.5 // 2.5MB
        },
        {
          id: '2',
          status: 'processing',
          progress: 65,
          created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          estimated_completion: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        }
      ];
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const exportMutation = useMutation({
    mutationFn: async (options: ExportOptions) => {
      // In a real implementation, this would call an edge function
      const { data, error } = await supabase.functions.invoke('data-export', {
        body: options
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Export job started successfully');
      refetchJobs();
    },
    onError: (error: any) => {
      toast.error(`Export failed: ${error.message}`);
    }
  });

  const importMutation = useMutation({
    mutationFn: async ({ file, options }: { file: File, options: ImportOptions }) => {
      // Convert file to base64 for edge function
      const fileContent = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('data-import', {
        body: {
          file_content: fileContent,
          file_name: file.name,
          ...options
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Import ${importOptions.dry_run ? 'validation' : 'completed'} successfully`);
      if (data.preview) {
        console.log('Import preview:', data.preview);
      }
    },
    onError: (error: any) => {
      toast.error(`Import failed: ${error.message}`);
    }
  });

  const handleExport = () => {
    exportMutation.mutate(exportOptions);
  };

  const handleImport = () => {
    if (!uploadedFile) {
      toast.error('Please select a file to import');
      return;
    }

    importMutation.mutate({ file: uploadedFile, options: importOptions });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['text/csv', 'application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload CSV, JSON, or XLSX files only.');
        return;
      }
      
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 50MB.');
        return;
      }
      
      setUploadedFile(file);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success';
      case 'processing': return 'text-warning';
      case 'failed': return 'text-destructive';
      default: return 'text-secondary';
    }
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-surface-secondary rounded-lg p-1">
        <Button
          variant={activeTab === 'export' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('export')}
          className="flex-1"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
        <Button
          variant={activeTab === 'import' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('import')}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          Import Data
        </Button>
      </div>

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span>Data Export</span>
              </CardTitle>
              <CardDescription>
                Export user data with GDPR compliance and custom formatting options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="data-type">Data Type</Label>
                  <Select
                    value={exportOptions.data_type}
                    onValueChange={(value) => setExportOptions(prev => ({ ...prev, data_type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="users">Users & Profiles</SelectItem>
                      <SelectItem value="teams">Teams & Members</SelectItem>
                      <SelectItem value="content">Generated Content</SelectItem>
                      <SelectItem value="analytics">Usage Analytics</SelectItem>
                      <SelectItem value="audit_logs">Audit Logs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="format">Export Format</Label>
                  <Select
                    value={exportOptions.format}
                    onValueChange={(value) => setExportOptions(prev => ({ ...prev, format: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date-range">Date Range</Label>
                  <Select
                    value={exportOptions.date_range}
                    onValueChange={(value) => setExportOptions(prev => ({ ...prev, date_range: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {exportOptions.date_range === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      type="date"
                      value={exportOptions.custom_start_date || ''}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, custom_start_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      type="date"
                      value={exportOptions.custom_end_date || ''}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, custom_end_date: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gdpr-compliant"
                    checked={exportOptions.gdpr_compliant}
                    onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, gdpr_compliant: !!checked }))}
                  />
                  <Label htmlFor="gdpr-compliant" className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-success" />
                    <span>GDPR Compliant Export</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-pii"
                    checked={exportOptions.include_pii}
                    onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, include_pii: !!checked }))}
                    disabled={!exportOptions.gdpr_compliant}
                  />
                  <Label htmlFor="include-pii" className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span>Include Personal Identifiable Information</span>
                  </Label>
                </div>
              </div>

              {!exportOptions.gdpr_compliant && exportOptions.include_pii && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Warning: Exporting PII without GDPR compliance may violate data protection regulations.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleExport}
                disabled={exportMutation.isPending}
                className="w-full"
              >
                {exportMutation.isPending ? 'Starting Export...' : 'Start Export'}
              </Button>
            </CardContent>
          </Card>

          {/* Export Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Export History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exportJobs?.map((job) => (
                  <div key={job.id} className="border border-semantic rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium capitalize ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                          {job.file_size && (
                            <span className="text-sm text-secondary">
                              ({formatFileSize(job.file_size)})
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-secondary">
                          Started {new Date(job.created_at).toLocaleString()}
                        </p>
                        {job.estimated_completion && (
                          <p className="text-xs text-tertiary">
                            ETA: {new Date(job.estimated_completion).toLocaleString()}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {job.status === 'processing' && (
                          <div className="w-32">
                            <Progress value={job.progress} className="h-2" />
                            <p className="text-xs text-center mt-1">{job.progress}%</p>
                          </div>
                        )}
                        
                        {job.status === 'completed' && job.download_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={job.download_url} download>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        )}
                        
                        {job.status === 'failed' && job.error_message && (
                          <div className="text-sm text-destructive max-w-xs">
                            Error: {job.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!exportJobs || exportJobs.length === 0) && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-secondary">No export jobs found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Data Import</span>
              </CardTitle>
              <CardDescription>
                Import data with validation and bulk operations support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Upload File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.json,.xlsx"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
                {uploadedFile && (
                  <p className="text-sm text-secondary mt-2">
                    Selected: {uploadedFile.name} ({formatFileSize(uploadedFile.size)})
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="import-data-type">Data Type</Label>
                  <Select
                    value={importOptions.data_type}
                    onValueChange={(value) => setImportOptions(prev => ({ ...prev, data_type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="users">Users & Profiles</SelectItem>
                      <SelectItem value="teams">Teams</SelectItem>
                      <SelectItem value="user_plans">User Plans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="operation">Operation</Label>
                  <Select
                    value={importOptions.operation}
                    onValueChange={(value) => setImportOptions(prev => ({ ...prev, operation: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="create">Create New Records</SelectItem>
                      <SelectItem value="update">Update Existing</SelectItem>
                      <SelectItem value="upsert">Create or Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="validation">Validation Level</Label>
                  <Select
                    value={importOptions.validation_level}
                    onValueChange={(value) => setImportOptions(prev => ({ ...prev, validation_level: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strict">Strict (Fail on Any Error)</SelectItem>
                      <SelectItem value="lenient">Lenient (Skip Invalid Records)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dry-run"
                  checked={importOptions.dry_run}
                  onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, dry_run: !!checked }))}
                />
                <Label htmlFor="dry-run" className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-primary" />
                  <span>Dry Run (Validate Only, Don't Import)</span>
                </Label>
              </div>

              <Button
                onClick={handleImport}
                disabled={!uploadedFile || importMutation.isPending}
                className="w-full"
              >
                {importMutation.isPending 
                  ? (importOptions.dry_run ? 'Validating...' : 'Importing...') 
                  : (importOptions.dry_run ? 'Validate Import' : 'Start Import')
                }
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};