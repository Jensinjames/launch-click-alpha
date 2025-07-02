
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      credits: "50 credits/month",
      features: [
        "50 AI-generated assets per month",
        "Basic templates",
        "Email support",
        "Export to PDF/DOCX"
      ],
      cta: "Start Free",
      popular: false,
      color: "from-gray-600 to-gray-700"
    },
    {
      name: "Pro",
      price: "$29",
      period: "per month",
      description: "For serious marketers",
      credits: "500 credits/month",
      features: [
        "500 AI-generated assets per month",
        "Premium templates",
        "Priority support",
        "Advanced export options",
        "Team collaboration (3 seats)",
        "Custom branding"
      ],
      cta: "Start Pro Trial",
      popular: true,
      color: "from-purple-600 to-blue-600"
    },
    {
      name: "Growth",
      price: "$99",
      period: "per month",
      description: "For growing teams",
      credits: "2,000 credits/month",
      features: [
        "2,000 AI-generated assets per month",
        "All premium templates",
        "Priority support",
        "Advanced analytics",
        "Team collaboration (10 seats)",
        "Custom integrations",
        "API access"
      ],
      cta: "Start Growth Trial",
      popular: false,
      color: "from-orange-600 to-red-600"
    },
    {
      name: "Elite",
      price: "Custom",
      period: "pricing",
      description: "For large organizations",
      credits: "Unlimited credits",
      features: [
        "Unlimited AI-generated assets",
        "Custom templates",
        "Dedicated support",
        "Advanced analytics & reporting",
        "Unlimited team seats",
        "Custom integrations",
        "White-label options",
        "On-premise deployment"
      ],
      cta: "Contact Sales",
      popular: false,
      color: "from-green-600 to-emerald-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-3xl p-8 shadow-xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  plan.popular 
                    ? 'border-purple-500 ring-4 ring-purple-500/20' 
                    : 'border-gray-200/50 hover:border-gray-300/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
                      <Zap className="h-4 w-4 mr-1" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground mb-6">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-purple-600">
                    {plan.credits}
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/signup" className="block">
                  <Button 
                    className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 transition-opacity`}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-20 text-center">
            <p className="text-muted-foreground mb-4">
              All plans include a 14-day free trial. No credit card required.
            </p>
            <p className="text-sm text-muted-foreground">
              Questions? <a href="#" className="text-purple-600 hover:text-purple-700">Contact our sales team</a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
