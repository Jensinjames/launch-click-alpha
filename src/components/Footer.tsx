
import { Link } from "react-router-dom";
import rocketLogo from "@/assets/rocket_svg.svg";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                <img 
                  src={rocketLogo} 
                  alt="Rocket Logo" 
                  className="h-6 w-6 object-contain"
                />
              </div>
              <span className="text-2xl font-bold">Launch Click</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              The AI-powered marketing platform that helps busy founders generate 
              high-converting marketing assets in minutes, not hours.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">Product</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/docs" className="text-gray-400 hover:text-white transition-colors">
                  Docs
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">Company</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">
              &copy; 2024 AMAP. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
              <span className="flex items-center">
                <span className="mr-1">🔒</span>
                GDPR Compliant
              </span>
              <span className="flex items-center">
                <span className="mr-1">💳</span>
                Stripe Secured
              </span>
              <span className="flex items-center">
                <span className="mr-1">🗄️</span>
                Supabase Powered
              </span>
              <span className="flex items-center">
                <span className="mr-1">🤖</span>
                OpenAI GPT-4
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
