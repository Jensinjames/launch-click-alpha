import { Plug, CheckCircle, Clock } from "lucide-react";
const IntegrationStats = () => {
  const stats = [{
    title: "Available integrations",
    value: "4",
    icon: "🔗",
    color: "text-purple-600"
  }, {
    title: "Connected",
    value: "0",
    icon: "✓",
    color: "text-green-600"
  }, {
    title: "Coming Soon",
    value: "2",
    icon: "⚙️",
    color: "text-blue-600"
  }];
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 rounded-none">
      {stats.map((stat, index) => <div key={index} className="p-6 border border-border bg-card rounded-sm py-[17px]">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-2xl">{stat.icon}</span>
            <span className="text-sm text-muted-foreground">{stat.title}</span>
          </div>
          <div className={`text-3xl font-bold ${stat.color}`}>
            {stat.value}
          </div>
        </div>)}
    </div>;
};
export default IntegrationStats;