import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Shield, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const stats = [
  {
    title: "Total Users",
    value: "2,456",
    change: "+12%",
    trend: "up",
    icon: Users,
    color: "text-blue-600"
  },
  {
    title: "Active Teams", 
    value: "348",
    change: "+8%",
    trend: "up",
    icon: Users,
    color: "text-green-600"
  },
  {
    title: "Monthly Revenue",
    value: "$24,560",
    change: "+15%", 
    trend: "up",
    icon: CreditCard,
    color: "text-emerald-600"
  },
  {
    title: "Security Events",
    value: "12",
    change: "-23%",
    trend: "down",
    icon: Shield,
    color: "text-red-600"
  }
];

export const AdminStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Badge 
                  variant={stat.trend === "up" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {stat.change}
                </Badge>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};