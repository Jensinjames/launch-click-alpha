
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedPricingCards from "@/components/AnimatedPricingCards";

const Pricing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:bg-gradient-to-br dark:from-background dark:to-surface">
      <Navbar />
      
      <div className="text-center pt-24 pb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
          Simple, Transparent
          <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Pricing
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Choose the perfect plan for your marketing needs. 
          Upgrade or downgrade at any time.
        </p>
      </div>

      <AnimatedPricingCards />

      <div className="text-center pb-20">
        <p className="text-muted-foreground mb-4">
          All plans include a 14-day free trial. No credit card required.
        </p>
        <p className="text-sm text-muted-foreground">
          Questions? <a href="#" className="text-purple-600 hover:text-purple-700">Contact our sales team</a>
        </p>
      </div>

      <Footer />
    </div>
  );
};

export default Pricing;
