import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star, ArrowRight, Phone } from "lucide-react";
const Pricing = () => {
  const plans = [{
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "Solopreneurs, Lean Teams",
    features: ["Core tools", "Monthly credits", "Basic integrations", "Email support"],
    popular: false,
    cta: "Start Free"
  }, {
    name: "Growth",
    price: "$99",
    period: "/mo",
    description: "Coaches, Startups, SMBs",
    features: ["More credits", "Advanced integrations", "3 team seats", "Priority support", "Custom templates"],
    popular: true,
    cta: "Start Free"
  }, {
    name: "Elite",
    price: "$199",
    period: "/mo",
    description: "Agencies, Scaleups",
    features: ["All features", "Unlimited automations", "5 team seats", "Priority support", "White-label options"],
    popular: false,
    cta: "Start Free"
  }, {
    name: "Custom",
    price: "Contact",
    period: "",
    description: "Enterprise/Big Teams",
    features: ["Bespoke features", "VIP onboarding", "Unlimited seats", "Dedicated support", "Custom integrations"],
    popular: false,
    cta: "Contact Sales"
  }];
  return <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Plans That Scale
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              With You
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            ✨ Try it free—no credit card required
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {plans.map((plan, index) => <Card key={index} className="">
              {plan.popular && <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </div>
                </div>}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-foreground mb-2">
                  {plan.name}
                </CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>)}
                </ul>

                <Link to={plan.cta === "Contact Sales" ? "/contact" : "/signup"}>
                  <Button className={`w-full ${plan.popular ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : ''}`} variant={plan.popular ? "default" : "outline"}>
                    {plan.cta === "Contact Sales" ? <>
                        <Phone className="mr-2 h-4 w-4" />
                        {plan.cta}
                      </> : <>
                        {plan.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>}
                  </Button>
                </Link>
              </CardContent>
            </Card>)}
        </div>

        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/pricing">
              <Button variant="outline" size="lg">
                Compare Plans
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              <Phone className="mr-2 h-4 w-4" />
              Book Strategy Call
            </Button>
          </div>
        </div>
      </div>
    </section>;
};
export default Pricing;