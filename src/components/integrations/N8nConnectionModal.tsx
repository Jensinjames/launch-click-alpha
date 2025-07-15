import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface N8nConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function N8nConnectionModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: N8nConnectionModalProps) {
  const [instanceUrl, setInstanceUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!instanceUrl || !apiKey) {
      toast({
        title: "Missing Information",
        description: "Please provide both instance URL and API key",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(instanceUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid n8n instance URL",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      const { data, error } = await supabase.functions.invoke('n8n-integration/connect', {
        body: { instanceUrl, apiKey }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Connected Successfully",
        description: "Your n8n instance has been connected",
      });

      setInstanceUrl("");
      setApiKey("");
      onSuccess();
      onClose();
    } catch (error) {
      console.error('n8n connection error:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to n8n",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect to n8n</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instanceUrl">n8n Instance URL</Label>
            <Input
              id="instanceUrl"
              placeholder="https://your-n8n-instance.com"
              value={instanceUrl}
              onChange={(e) => setInstanceUrl(e.target.value)}
              disabled={isConnecting}
            />
            <p className="text-sm text-muted-foreground">
              The URL of your n8n instance (e.g., https://n8n.yourdomain.com)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your n8n API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isConnecting}
            />
            <p className="text-sm text-muted-foreground">
              You can find your API key in n8n Settings → API Keys
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isConnecting}>
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={isConnecting}>
            {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}