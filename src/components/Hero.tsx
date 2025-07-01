
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Calendar } from "lucide-react";
import launchClickLogo from "@/assets/launchclick-logo.png";

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-16 pb-24">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM2MzY2ZjEiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 gradient-rocket rounded-xl flex items-center justify-center shadow-lg">
              <img 
                src={launchClickLogo} 
                alt="LaunchClick" 
                className="w-10 h-10 object-contain filter brightness-0 invert"
              />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="block text-brand-navy">
              LaunchClick
            </span>
          </h1>
          
          <h2 className="text-2xl md:text-3xl font-semibold mb-8" style={{ color: '#227CFF' }}>
            Your AI Marketing Copilot
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            You didn't launch a business to become a full-time marketer. But growth depends on the right message, the right funnel, at the right time. AI Marketing Copilot takes your idea — and instantly turns it into emails, ads, landing pages, and full funnels tailored to your audience.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link to="/signup">
              <Button size="lg" className="gradient-rocket text-white text-lg px-8 py-4 h-auto font-semibold hover:opacity-90 transition-opacity">
                Try Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto border-2 hover:bg-white/80">
              <Play className="mr-2 h-5 w-5" />
              See Live Demo
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto border-2 hover:bg-white/80">
              <Calendar className="mr-2 h-5 w-5" />
              Book Strategy Call
            </Button>
          </div>
          
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 gradient-rocket opacity-20 rounded-2xl blur-3xl" />
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-2xl">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-left">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
                <div className="font-mono text-sm text-green-400">
                  <div className="mb-2">$ Generate complete marketing funnel for SaaS startup</div>
                  <div className="mb-2 text-gray-400">→ Analyzing your business model...</div>
                  <div className="mb-2 text-gray-400">→ Creating email sequences (5 emails)...</div>
                  <div className="mb-2 text-gray-400">→ Writing Facebook & Google ads...</div>
                  <div className="mb-2 text-gray-400">→ Building landing page copy...</div>
                  <div className="text-green-400">✓ Complete funnel generated in 8 seconds</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
