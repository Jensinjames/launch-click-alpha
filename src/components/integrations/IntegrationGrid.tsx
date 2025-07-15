
import { useState } from "react";
import IntegrationCard from "./IntegrationCard";
import N8nConnectionModal from "./N8nConnectionModal";

const IntegrationGrid = () => {
  const [isN8nModalOpen, setIsN8nModalOpen] = useState(false);
  
  const handleIntegrationConnect = (integrationId: string) => {
    if (integrationId === "n8n") {
      setIsN8nModalOpen(true);
    }
    // Handle other integrations here
  };

  const integrations = [
    {
      id: "mailchimp",
      name: "Mailchimp",
      category: "Email Marketing",
      description: "Sync your email campaigns and audience data",
      icon: "📧",
      status: "available" as const,
      color: "bg-yellow-100"
    },
    {
      id: "convertkit", 
      name: "ConvertKit",
      category: "Email Marketing",
      description: "Automate email sequences and subscriber management",
      icon: "💌",
      status: "available" as const,
      color: "bg-pink-100"
    },
    {
      id: "zapier",
      name: "Zapier", 
      category: "Automation",
      description: "Connect with 5000+ apps and automate workflows",
      icon: "⚡",
      status: "available" as const,
      color: "bg-orange-100"
    },
    {
      id: "airtable",
      name: "Airtable",
      category: "Database", 
      description: "Organize and track your marketing data",
      icon: "📊",
      status: "available" as const,
      color: "bg-blue-100"
    },
    {
      id: "n8n",
      name: "n8n",
      category: "Automation",
      description: "Self-hosted workflow automation platform",
      icon: "🔗",
      status: "available" as const,
      color: "bg-purple-100"
    },
    {
      id: "webflow",
      name: "Webflow", 
      category: "Website",
      description: "Deploy landing pages directly to your site",
      icon: "🌐",
      status: "coming-soon" as const,
      color: "bg-green-100"
    }
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onConnect={handleIntegrationConnect}
          />
        ))}
      </div>
      
      <N8nConnectionModal
        isOpen={isN8nModalOpen}
        onClose={() => setIsN8nModalOpen(false)}
        onSuccess={() => {
          // Refresh integrations or update state as needed
        }}
      />
    </>
  );
};

export default IntegrationGrid;
