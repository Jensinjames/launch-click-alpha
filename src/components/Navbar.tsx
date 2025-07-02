import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Menu, X } from "lucide-react";
import rocketLogo from "@/assets/rocket_svg.svg";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  return <nav className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src={rocketLogo} 
                alt="Rocket Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-brand-navy font-display text-xl font-semibold">LaunchClick</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/#features" className="text-foreground/70 hover:text-primary px-3 py-2 text-sm font-medium transition-colors">
                Features
              </Link>
              <Link to="/pricing" className="text-foreground/70 hover:text-primary px-3 py-2 text-sm font-medium transition-colors">
                Pricing
              </Link>
              <Link to="/#use-cases" className="text-foreground/70 hover:text-primary px-3 py-2 text-sm font-medium transition-colors">
                Use Cases
              </Link>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-4 flex items-center space-x-4">
              <ThemeToggle />
              <Link to="/login">
                <Button variant="ghost" className="text-foreground/70 hover:text-primary">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="gradient" className="shadow-lg">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>

          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-foreground/70 hover:text-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background/90 backdrop-blur-md border-b border-border">
            <Link to="/#features" className="text-foreground/70 hover:text-primary block px-3 py-2 text-base font-medium">
              Features
            </Link>
            <Link to="/pricing" className="text-foreground/70 hover:text-primary block px-3 py-2 text-base font-medium">
              Pricing
            </Link>
            <Link to="/#use-cases" className="text-foreground/70 hover:text-primary block px-3 py-2 text-base font-medium">
              Use Cases
            </Link>
            <div className="pt-4 pb-2 space-y-2">
              <Link to="/login" className="block">
                <Button variant="ghost" className="w-full justify-start">
                  Login
                </Button>
              </Link>
              <Link to="/signup" className="block">
                <Button variant="gradient" className="w-full shadow-lg">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>}
    </nav>;
};
export default Navbar;