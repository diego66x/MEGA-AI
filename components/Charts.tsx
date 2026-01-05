import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PageResult } from '../types';

interface ChartsProps {
  data: PageResult[];
}

export const CategoryChart: React.FC<ChartsProps> = ({ data }) => {
  // Aggregate data by category
  const categoryCounts = data.reduce((acc, curr) => {
    const cat = curr.category || 'Geral';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryCounts)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); 

  // Palette: Netflix Red variations and Grays
  const COLORS = ['#E50914', '#B20710', '#8c050c', '#5e0308', '#404040', '#525252', '#737373', '#a3a3a3'];

  if (data.length === 0) {
     return (
        <div className="h-64 flex items-center justify-center text-zinc-600 font-medium">
            Sem dados recentes
        </div>
     );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#737373', fontSize: 11, fontWeight: 500 }} 
            axisLine={false} 
            tickLine={false}
            angle={-45}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip 
            cursor={{ fill: '#ffffff', opacity: 0.1 }}
            contentStyle={{ backgroundColor: '#000000', borderColor: '#333', color: '#fff', borderRadius: '4px' }}
            itemStyle={{ color: '#E50914' }}
          />
          <Bar dataKey="value" radius={[2, 2, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};