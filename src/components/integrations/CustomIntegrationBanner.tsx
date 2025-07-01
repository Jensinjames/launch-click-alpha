import { Button } from "@/components/ui/button";
import { Plug, FileText } from "lucide-react";
const CustomIntegrationBanner = () => {
  return <section className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white" aria-labelledby="custom-integration-title" role="region">
      <div className="text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Plug className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        
        <h2 id="custom-integration-title" className="text-2xl font-bold mb-4">
          Need a Custom Integration?
        </h2>
        <p className="text-purple-100 mb-8 leading-relaxed">
          Don't see the tool you need? We're constantly adding new integrations. Let us know what you'd like to connect and we'll prioritize it.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100 font-medium focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600" aria-describedby="request-integration-description">
            Request Integration
          </Button>
          <div id="request-integration-description" className="sr-only">
            Submit a request for a new integration to be added
          </div>
          
          <Button variant="outline" aria-describedby="api-docs-description" className="border-white/30 hover:bg-white/10 font-medium focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600 text-white">
            <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
            View API Docs
          </Button>
          <div id="api-docs-description" className="sr-only">
            View technical documentation for building custom integrations
          </div>
        </div>
      </div>
    </section>;
};
export default CustomIntegrationBanner;