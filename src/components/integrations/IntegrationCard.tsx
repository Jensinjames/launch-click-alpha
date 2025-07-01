import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle, Clock } from "lucide-react";
interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  status: "connected" | "available" | "coming-soon";
  color: string;
}
interface IntegrationCardProps {
  integration: Integration;
  onConnect?: (id: string) => void;
}
const IntegrationCard = ({
  integration,
  onConnect
}: IntegrationCardProps) => {
  const getButtonText = (status: string) => {
    switch (status) {
      case "connected":
        return "Connected";
      case "available":
        return "Connect";
      case "coming-soon":
        return "Coming Soon";
      default:
        return "Connect";
    }
  };
  const getButtonVariant = (status: string) => {
    switch (status) {
      case "connected":
        return "outline";
      case "available":
        return "default";
      case "coming-soon":
        return "secondary";
      default:
        return "default";
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4" aria-hidden="true" />;
      case "available":
        return <ExternalLink className="h-4 w-4" aria-hidden="true" />;
      case "coming-soon":
        return <Clock className="h-4 w-4" aria-hidden="true" />;
      default:
        return null;
    }
  };
  const handleConnect = () => {
    if (integration.status === "available" && onConnect) {
      onConnect(integration.id);
    }
  };
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleConnect();
    }
  };
  return <Card className="p-6 hover:shadow-lg transition-shadow border border-border focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2" role="article" aria-labelledby={`integration-${integration.id}-name`} aria-describedby={`integration-${integration.id}-description`}>
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 ${integration.color} rounded-lg flex items-center justify-center`} role="img" aria-label={`${integration.name} logo`}>
            <span className="text-xl" aria-hidden="true">{integration.icon}</span>
          </div>
          <div className="flex items-center space-x-1">
            {getStatusIcon(integration.status)}
            <span className="sr-only">
              Status: {integration.status.replace('-', ' ')}
            </span>
          </div>
        </div>
        
        <h3 id={`integration-${integration.id}-name`} className="font-semibold mb-1 text-foreground">
          {integration.name}
        </h3>
        <p aria-label={`Category: ${integration.category}`} className="text-xs mb-3 text-muted-foreground">
          {integration.category}
        </p>
        <p id={`integration-${integration.id}-description`} className="text-sm mb-6 text-foreground">
          {integration.description}
        </p>
        
        <Button variant={getButtonVariant(integration.status)} className={`w-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${integration.status === "available" ? "bg-primary hover:bg-primary-hover text-primary-foreground" : ""}`} disabled={integration.status === "coming-soon"} onClick={handleConnect} onKeyDown={handleKeyDown} aria-describedby={`integration-${integration.id}-status`}>
          {getButtonText(integration.status)}
        </Button>
        <div id={`integration-${integration.id}-status`} className="sr-only">
          {integration.status === "connected" && "This integration is already connected"}
          {integration.status === "available" && "Click to connect this integration"}
          {integration.status === "coming-soon" && "This integration is not yet available"}
        </div>
      </CardContent>
    </Card>;
};
export default IntegrationCard;