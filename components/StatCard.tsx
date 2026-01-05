import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend }) => {
  return (
    <div className="bg-[#1f1f1f] p-6 rounded hover:bg-[#2a2a2a] transition-colors duration-300 cursor-default group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-white">{value}</h3>
        </div>
        <div className="p-2 rounded bg-black/50 group-hover:bg-[#E50914] transition-colors duration-300">
          <Icon className="w-5 h-5 text-zinc-400 group-hover:text-white" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-xs">
          <span className="text-[#46d369] font-bold">{trend}</span>
          <span className="text-zinc-500 ml-2">relevância</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;