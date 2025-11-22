import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title, icon }) => {
  return (
    <div className={`relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl flex flex-col ${className}`}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      
      {title && (
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 relative z-10 flex-shrink-0">
           {icon && <span className="text-indigo-400">{icon}</span>}
           <h3 className="text-lg font-semibold text-slate-100 tracking-tight">{title}</h3>
        </div>
      )}
      
      {/* flex-1 and min-h-0 are crucial for ResponsiveContainer to inherit height correctly in a flex column */}
      <div className="relative z-10 p-6 flex-1 min-h-0 w-full">
        {children}
      </div>
    </div>
  );
};