import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TeamAnalytics } from '../types';

interface TeamAnalyticsChartProps {
  analytics: TeamAnalytics[];
  type: 'bar' | 'line';
  title: string;
  dataKey: keyof TeamAnalytics;
}

export const TeamAnalyticsChart: React.FC<TeamAnalyticsChartProps> = ({ 
  analytics, 
  type, 
  title, 
  dataKey 
}) => {
  const chartData = analytics.map((item, index) => ({
    period: `Period ${index + 1}`,
    value: item[dataKey],
    ...item
  }));

  const ChartComponent = type === 'bar' ? BarChart : LineChart;
  const DataComponent = type === 'bar' ? 
    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /> :
    <Line 
      type="monotone" 
      dataKey="value" 
      stroke="hsl(var(--primary))" 
      strokeWidth={2}
      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
    />;

  return (
    <Card className="surface-elevated">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ChartComponent data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="period" 
              stroke="hsl(var(--text-tertiary))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--text-tertiary))"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                color: 'hsl(var(--card-foreground))'
              }}
            />
            {DataComponent}
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};