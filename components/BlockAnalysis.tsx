import React from 'react';
import { BlockStats } from '../types';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface Props {
  blocks: BlockStats[];
}

export const BlockAnalysis: React.FC<Props> = ({ blocks }) => {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-slate-400" />
        <h3 className="text-xl font-bold text-white">Análise por Blocos (1/5 das Entradas)</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {blocks.map((block) => {
          const isPositive = block.result >= 0;
          return (
            <div 
              key={block.id} 
              className={`
                relative p-5 rounded-xl border backdrop-blur-md transition-all duration-300 hover:-translate-y-1
                ${isPositive 
                  ? 'bg-emerald-900/10 border-emerald-500/20 hover:border-emerald-500/40' 
                  : 'bg-rose-900/10 border-rose-500/20 hover:border-rose-500/40'}
              `}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                <span className="text-sm font-bold text-slate-300">Bloco {block.id}</span>
                <span className="text-xs text-slate-500">{block.startBet}-{block.endBet}</span>
              </div>

              {/* Main Result */}
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm text-slate-400">Resultado</span>
                <span className={`text-xl font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {block.result > 0 ? '+' : ''}{block.result.toFixed(2)}u
                </span>
              </div>

              {/* Stats Grid */}
              <div className="space-y-2 text-sm">
                 <div className="flex justify-between">
                   <span className="text-slate-500">Win Rate</span>
                   <span className="font-mono text-slate-200">{block.winRate.toFixed(1)}%</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-slate-500">ROI</span>
                   <span className={`font-mono ${block.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                     {block.roi.toFixed(2)}%
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-slate-500">Drawdown Máx</span>
                   <span className="font-mono text-rose-400">-{block.drawdownMax.toFixed(2)}u</span>
                 </div>
              </div>
              
              {/* Decorative background glow */}
              <div className={`absolute -bottom-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};