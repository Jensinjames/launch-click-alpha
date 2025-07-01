import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
const PlanSelector = () => {
  const [isYearly, setIsYearly] = useState(false);
  const plans = [{
    name: "Starter",
    monthly: 0,
    yearly: 0,
    credits: 50,
    features: ["50 credits/month", "Basic templates", "Email support"],
    current: true
  }, {
    name: "Pro",
    monthly: 29,
    yearly: 290,
    credits: 200,
    features: ["200 credits/month", "Advanced templates", "Priority support", "Analytics"]
  }, {
    name: "Growth",
    monthly: 79,
    yearly: 790,
    credits: 500,
    features: ["500 credits/month", "Team collaboration", "Integrations", "Advanced analytics"]
  }, {
    name: "Elite",
    monthly: 199,
    yearly: 1990,
    credits: 1500,
    features: ["1500 credits/month", "White-label", "Custom integrations", "Dedicated support"]
  }];
  return <div className="space-y-6">
      <div className="flex items-center justify-center">
        <div className="bg-surface-elevated p-1 rounded-lg border border-border">
          <button onClick={() => setIsYearly(false)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${!isYearly ? "bg-surface text-primary shadow-sm border border-border" : "text-secondary hover:text-primary"}`}>
            Monthly
          </button>
          <button onClick={() => setIsYearly(true)} className="my-0 mx-[16px] px-0 py-[9px] text-base font-normal">
            Yearly
            <span className="ml-1 text-xs bg-success-light text-success px-1.5 py-0.5 rounded border border-success/30">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map(plan => <Card key={plan.name} className="surface-elevated relative mx-0 my-0 py-0">
            {plan.current && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                  Current Plan
                </span>
              </div>}
            <CardHeader className="text-center">
              <CardTitle className="text-lg text-primary">{plan.name}</CardTitle>
              <div className="text-3xl font-bold text-primary">
                ${isYearly ? plan.yearly : plan.monthly}
                <span className="text-base font-normal text-muted-foreground">
                  /{isYearly ? "year" : "month"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => <li key={index} className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-success mr-2 flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>)}
              </ul>
              <Button className={`w-full ${plan.current ? "bg-muted text-muted-foreground cursor-not-allowed" : "gradient-primary text-white hover:opacity-90"}`} disabled={plan.current}>
                {plan.current ? "Current Plan" : "Upgrade"}
              </Button>
            </CardContent>
          </Card>)}
      </div>
    </div>;
};
export default PlanSelector;