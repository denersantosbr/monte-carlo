
import React, { useState, useEffect } from 'react';
import { Play, Settings2, Target, BarChart3, RefreshCw, Percent, ZoomOut, Instagram, Send, PieChart, Briefcase } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea } from 'recharts';

import { SimulationParams, SimulationResult } from './types';
import { runSimulation, calculateRequiredWinRate } from './utils/simulation';
import { GlassCard } from './components/GlassCard';
import { BlockAnalysis } from './components/BlockAnalysis';

const App: React.FC = () => {
  // --- State ---
  const [params, setParams] = useState<SimulationParams>({
    avgOdds: 1.70,
    expectedRoi: 3.0,
    stakePct: 1.0, // Default 1%
    numBets: 1000,
    isCompound: false // Padrão Stake Fixa
  });

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Zoom State
  const [left, setLeft] = useState<string | number>('dataMin');
  const [right, setRight] = useState<string | number>('dataMax');
  const [refAreaLeft, setRefAreaLeft] = useState<string | number>('');
  const [refAreaRight, setRefAreaRight] = useState<string | number>('');

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const toggleCompound = (isCompound: boolean) => {
    setParams(prev => ({ ...prev, isCompound }));
  };

  const handleSimulate = () => {
    setIsAnimating(true);
    // Reset zoom on new simulation
    setLeft('dataMin');
    setRight('dataMax');
    setRefAreaLeft('');
    setRefAreaRight('');

    // Tiny timeout to allow UI to show loading state
    setTimeout(() => {
      const simResult = runSimulation(params);
      setResult(simResult);
      setIsAnimating(false);
    }, 100);
  };

  // Zoom Logic
  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === '') {
      setRefAreaLeft('');
      setRefAreaRight('');
      return;
    }

    // Ensure left is smaller than right
    let l = refAreaLeft;
    let r = refAreaRight;
    if (typeof l === 'number' && typeof r === 'number' && l > r) {
      [l, r] = [r, l];
    }

    setRefAreaLeft('');
    setRefAreaRight('');
    setLeft(l);
    setRight(r);
  };

  const zoomOut = () => {
    setLeft('dataMin');
    setRight('dataMax');
    setRefAreaLeft('');
    setRefAreaRight('');
  };

  // Initial run
  useEffect(() => {
    handleSimulate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requiredWinRate = calculateRequiredWinRate(params.avgOdds, params.expectedRoi) * 100;

  // --- Helper UI Components ---
  const StatRow = ({ label, value, color = 'text-slate-200' }: { label: string, value: string, color?: string }) => (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-slate-400 font-light">{label}</span>
      <span className={`font-medium font-mono ${color}`}>{value}</span>
    </div>
  );

  // Derived stats for display
  const profitPctOnBankroll = result ? result.stats.finalResultUnits * params.stakePct : 0;
  const maxDrawdownPctOnBankroll = result ? result.stats.maxDrawdown * params.stakePct : 0;

  return (
    <div className="min-h-screen p-4 md:p-8 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">Automação Quant - Mentoria Dener Santos</h1>
                <p className="text-slate-400 mt-2 text-sm uppercase tracking-widest font-semibold">Simulador de Variância Monte Carlo</p>
            </div>

            <div className="flex items-center gap-3">
                <a 
                    href="https://www.instagram.com/denersantosbr/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-pink-500 transition-all duration-300 hover:scale-105 backdrop-blur-sm shadow-lg group"
                    title="Instagram"
                >
                    <Instagram size={24} />
                </a>
                <a 
                    href="https://t.me/ODenerSantos" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-sky-400 transition-all duration-300 hover:scale-105 backdrop-blur-sm shadow-lg group"
                    title="Telegram"
                >
                    <Send size={24} className="-ml-0.5 mt-0.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
            </div>
        </header>

        {/* Input Section */}
        <GlassCard className="p-0 overflow-visible" title="Configuração da Simulação" icon={<Settings2 size={20} />}>
          <div className="flex flex-col gap-6">
            
            {/* Type of Management Switch */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                     <Briefcase size={16} className="text-indigo-400"/>
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo de Gestão</label>
                </div>
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 w-full md:w-fit">
                    <button 
                        onClick={() => toggleCompound(false)}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${!params.isCompound ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Stake Fixa
                    </button>
                    <button 
                        onClick={() => toggleCompound(true)}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${params.isCompound ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Juros Compostos
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-end">
                {/* Inputs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-grow w-full">
                    
                    <div className="space-y-2 group">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider group-focus-within:text-indigo-400 transition-colors">Odd Média</label>
                        <div className="relative">
                            <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                            <input 
                                type="number" 
                                step="0.01" 
                                name="avgOdds"
                                value={params.avgOdds}
                                onChange={handleInputChange}
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none font-mono" 
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider group-focus-within:text-emerald-400 transition-colors">ROI (%)</label>
                        <div className="relative">
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                            <input 
                                type="number" 
                                step="0.1" 
                                name="expectedRoi"
                                value={params.expectedRoi}
                                onChange={handleInputChange}
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none font-mono" 
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider group-focus-within:text-amber-400 transition-colors">Gestão (%)</label>
                        <div className="relative">
                            <PieChart className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                            <input 
                                type="number" 
                                step="0.1" 
                                name="stakePct"
                                value={params.stakePct}
                                onChange={handleInputChange}
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all outline-none font-mono" 
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider group-focus-within:text-blue-400 transition-colors">Número de Apostas</label>
                        <div className="relative">
                            <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                            <input 
                                type="number" 
                                name="numBets"
                                value={params.numBets}
                                onChange={handleInputChange}
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none font-mono" 
                            />
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div className="w-full lg:w-auto">
                    <button 
                        onClick={handleSimulate}
                        disabled={isAnimating}
                        className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 h-[46px]"
                    >
                        {isAnimating ? <RefreshCw className="animate-spin" /> : <Play fill="currentColor" size={18} />}
                        Simular
                    </button>
                </div>
            </div>
          </div>
        </GlassCard>

        {result && (
            <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Chart Section */}
                <div className="lg:col-span-2 relative">
                    <GlassCard className="h-[500px] flex flex-col relative" title={`Crescimento da Banca (${params.isCompound ? 'Juros Compostos' : 'Stake Fixa'})`}>
                        
                        {/* Reset Zoom Button */}
                        {left !== 'dataMin' && (
                            <button 
                                onClick={zoomOut}
                                className="absolute top-4 right-6 z-20 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs font-medium text-white backdrop-blur-md transition-all flex items-center gap-2 shadow-lg"
                            >
                                <ZoomOut size={14} />
                                Resetar Zoom
                            </button>
                        )}

                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart 
                                data={result.history} 
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                onMouseDown={(e) => e && e.activeLabel && setRefAreaLeft(e.activeLabel)}
                                onMouseMove={(e) => refAreaLeft && e && e.activeLabel && setRefAreaRight(e.activeLabel)}
                                onMouseUp={zoom}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis 
                                    dataKey="betNumber" 
                                    stroke="#64748b" 
                                    fontSize={12} 
                                    tickFormatter={(val) => `${val}`} 
                                    label={{ value: 'Número de Apostas', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }}
                                    allowDataOverflow
                                    domain={[left, right]}
                                    type="number"
                                />
                                <YAxis 
                                    stroke="#64748b" 
                                    fontSize={12} 
                                    tickFormatter={(val) => `${val}%`} 
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                                    itemStyle={{ color: '#e2e8f0', fontSize: '13px', fontFamily: 'monospace' }}
                                    labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem' }}
                                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Lucro']}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Line 
                                    name={`Stake ${params.stakePct}% (${params.isCompound ? 'Comp.' : 'Fixa'})`} 
                                    type="monotone" 
                                    dataKey="bankroll" 
                                    stroke="#60a5fa" 
                                    strokeWidth={2} 
                                    dot={false} 
                                    activeDot={{ r: 6, fill: '#60a5fa' }}
                                    animationDuration={1500}
                                    isAnimationActive={left === 'dataMin'} // Disable animation on zoom
                                />
                                
                                {refAreaLeft && refAreaRight ? (
                                    <ReferenceArea 
                                        x1={refAreaLeft} 
                                        x2={refAreaRight} 
                                        strokeOpacity={0.3} 
                                        fill="#818cf8" 
                                        fillOpacity={0.1} 
                                    />
                                ) : null}

                            </LineChart>
                        </ResponsiveContainer>
                    </GlassCard>
                </div>

                {/* Summary Stats Column */}
                <div className="space-y-6">
                    <GlassCard title={`Resumo Global`}>
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <span className="text-slate-400">Resultado Final</span>
                                <span className={`text-3xl font-bold ${result.stats.finalResultUnits >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {result.stats.finalResultUnits > 0 ? '+' : ''}{result.stats.finalResultUnits.toFixed(2)}u
                                </span>
                            </div>
                            
                            <div className="space-y-0">
                                <StatRow label="ROI Realizado" value={`${result.stats.realizedRoi.toFixed(2)}%`} color={result.stats.realizedRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
                                <StatRow label="Win Rate" value={`${result.stats.realizedWinRate.toFixed(2)}%`} />
                                <StatRow label="Drawdown Máx." value={`-${result.stats.maxDrawdown.toFixed(2)}u`} color="text-rose-400" />
                                <StatRow label="Maior Seq. Green" value={`${result.stats.maxGreenStreak}`} color="text-emerald-400" />
                                <StatRow label="Maior Seq. Red" value={`${result.stats.maxRedStreak}`} color="text-rose-400" />
                                <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 pt-4 mt-2 border-t border-white/10">
                                    <span className="text-sm text-rose-300 font-semibold uppercase tracking-wider text-xs">Risco de Ruína</span>
                                    <span className={`font-bold font-mono ${result.stats.riskOfRuin > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {result.stats.riskOfRuin.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* NEW BLOCK: Impact on Bankroll */}
                    <GlassCard className="overflow-hidden">
                         <div className="flex flex-row justify-between items-center divide-x divide-white/10">
                             <div className="flex-1 flex flex-col items-center py-2">
                                 <span className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Lucro / Banca</span>
                                 <span className={`text-2xl font-mono font-bold ${profitPctOnBankroll >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                     {profitPctOnBankroll > 0 ? '+' : ''}{profitPctOnBankroll.toFixed(2)}%
                                 </span>
                             </div>
                             <div className="flex-1 flex flex-col items-center py-2">
                                  <span className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Drawdown Máx</span>
                                  <span className="text-2xl font-mono font-bold text-rose-400">
                                     -{maxDrawdownPctOnBankroll.toFixed(2)}%
                                 </span>
                             </div>
                         </div>
                    </GlassCard>
                </div>
            </div>

            {/* Block Analysis */}
            <BlockAnalysis blocks={result.blocks} />
            </>
        )}

      </div>
    </div>
  );
};

export default App;
