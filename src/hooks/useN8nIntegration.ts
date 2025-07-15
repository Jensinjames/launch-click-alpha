import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface N8nIntegrationStatus {
  isConnected: boolean;
  instanceUrl?: string;
  connectedAt?: string;
}

export function useN8nIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if n8n is connected
  const { data: integrationStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['n8n-integration-status'],
    queryFn: async (): Promise<N8nIntegrationStatus> => {
      const { data, error } = await supabase
        .from('integration_tokens')
        .select('token_data, is_active')
        .eq('provider', 'n8n')
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error checking n8n status:', error);
        return { isConnected: false };
      }

      if (!data) {
        return { isConnected: false };
      }

      const tokenData = data.token_data as any;
      return {
        isConnected: true,
        instanceUrl: tokenData?.instanceUrl,
        connectedAt: tokenData?.connectedAt,
      };
    },
  });

  // Fetch n8n workflows
  const { 
    data: workflows, 
    isLoading: workflowsLoading,
    refetch: refetchWorkflows 
  } = useQuery({
    queryKey: ['n8n-workflows'],
    queryFn: async (): Promise<N8nWorkflow[]> => {
      const { data, error } = await supabase.functions.invoke('n8n-integration/workflows');

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data?.workflows || [];
    },
    enabled: integrationStatus?.isConnected,
  });

  // Execute workflow mutation
  const executeWorkflow = useMutation({
    mutationFn: async ({ 
      workflowId, 
      inputData = {} 
    }: { 
      workflowId: string; 
      inputData?: Record<string, any> 
    }) => {
      const { data, error } = await supabase.functions.invoke(
        `n8n-integration/workflows/${workflowId}/execute`,
        { body: { inputData } }
      );

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Workflow Executed",
        description: "Your n8n workflow has been executed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Execution Failed",
        description: error instanceof Error ? error.message : "Failed to execute workflow",
        variant: "destructive",
      });
    },
  });

  // Disconnect n8n integration
  const disconnectIntegration = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('n8n-integration/disconnect');

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['n8n-integration-status'] });
      queryClient.invalidateQueries({ queryKey: ['n8n-workflows'] });
      toast({
        title: "Disconnected",
        description: "n8n integration has been disconnected",
      });
    },
    onError: (error) => {
      toast({
        title: "Disconnection Failed",
        description: error instanceof Error ? error.message : "Failed to disconnect n8n",
        variant: "destructive",
      });
    },
  });

  const refreshConnection = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['n8n-integration-status'] });
    queryClient.invalidateQueries({ queryKey: ['n8n-workflows'] });
  }, [queryClient]);

  return {
    // Status
    isConnected: integrationStatus?.isConnected || false,
    instanceUrl: integrationStatus?.instanceUrl,
    connectedAt: integrationStatus?.connectedAt,
    statusLoading,
    
    // Workflows
    workflows: workflows || [],
    workflowsLoading,
    refetchWorkflows,
    
    // Actions
    executeWorkflow: executeWorkflow.mutate,
    isExecuting: executeWorkflow.isPending,
    disconnectIntegration: disconnectIntegration.mutate,
    isDisconnecting: disconnectIntegration.isPending,
    refreshConnection,
  };
}