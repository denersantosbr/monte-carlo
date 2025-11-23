
import { SimulationParams, SimulationResult, SimulationStep, GlobalStats, BlockStats } from '../types';

export const calculateRequiredWinRate = (avgOdds: number, expectedRoi: number): number => {
  // Formula: ROI = (WinProb * Odds) - 1
  // WinProb = (ROI + 1) / Odds
  if (avgOdds <= 0) return 0;
  const decimalRoi = expectedRoi / 100;
  return (decimalRoi + 1) / avgOdds;
};

const generateRandomOutcome = (winProbability: number): boolean => {
  return Math.random() < winProbability;
};

// Cálculo Teórico do Risco de Ruína (Infinite Time Horizon approximation via Brownian Motion)
// RoR = e^(-2 * mu * B / sigma^2)
// Nota: Esta fórmula assume teoricamente Stake Fixa. Juros compostos perfeitos (Kelly) teoricamente
// nunca quebram (assíntota em 0), mas na prática quebram devido a limites mínimos de aposta.
// Manteremos a fórmula baseada nos parâmetros iniciais para referência de risco da estratégia.
const calculateRiskOfRuin = (
  initialBankroll: number,
  stakePct: number,
  avgOdds: number,
  winProb: number
): number => {
  const stakeAmount = initialBankroll * (stakePct / 100);
  
  // Média de lucro por aposta (mu)
  const meanProfit = stakeAmount * (winProb * (avgOdds - 1) - (1 - winProb));

  // Se a expectativa é negativa ou zero, a ruína é certa (100%) no longo prazo
  if (meanProfit <= 0) return 100;

  // Variância por aposta (sigma^2)
  // Var = E[X^2] - (E[X])^2
  const winOutcome = stakeAmount * (avgOdds - 1);
  const lossOutcome = -stakeAmount;
  
  const meanSquare = (winProb * Math.pow(winOutcome, 2)) + ((1 - winProb) * Math.pow(lossOutcome, 2));
  const variance = meanSquare - Math.pow(meanProfit, 2);

  if (variance === 0) return 0; // Sem variância e lucro positivo = sem risco

  // Fórmula Exponencial
  const ror = Math.exp((-2 * initialBankroll * meanProfit) / variance);
  
  // Garantir limites entre 0 e 100
  return Math.min(Math.max(ror * 100, 0), 100);
};

const calculateStats = (
  results: boolean[], 
  odds: number, 
  stakePct: number,
  theoreticalWinProb: number,
  isCompound: boolean
): GlobalStats => {
  const initialBankroll = 1000;
  let currentBankroll = initialBankroll;
  let maxBankroll = initialBankroll;
  let maxDrawdown = 0; // Em unidades fixas (relativas à banca inicial) para padronização visual
  let currentGreenStreak = 0;
  let maxGreenStreak = 0;
  let currentRedStreak = 0;
  let maxRedStreak = 0;
  let totalWagered = 0;
  let wins = 0;

  // Para cálculo de drawdown em unidades, usamos a stake inicial como referência de "1 unidade"
  // mesmo em juros compostos, para ter uma métrica comparável.
  const baseUnit = initialBankroll * (stakePct / 100);

  results.forEach((won) => {
    // Definição da Stake Atual
    let currentStake;
    if (isCompound) {
        currentStake = currentBankroll * (stakePct / 100);
        // Proteção contra valores muito pequenos (opcional, mas evita underflow matemático irreal)
        if (currentStake < 0.01) currentStake = 0; 
    } else {
        currentStake = baseUnit;
    }

    totalWagered += currentStake;

    if (won) {
      wins++;
      const profit = currentStake * (odds - 1);
      currentBankroll += profit;
      
      currentGreenStreak++;
      currentRedStreak = 0;
      if (currentGreenStreak > maxGreenStreak) maxGreenStreak = currentGreenStreak;
    } else {
      currentBankroll -= currentStake;
      
      currentRedStreak++;
      currentGreenStreak = 0;
      if (currentRedStreak > maxRedStreak) maxRedStreak = currentRedStreak;
    }

    if (currentBankroll > maxBankroll) {
      maxBankroll = currentBankroll;
    }
    
    // Cálculo de Drawdown
    // Em juros compostos, drawdown geralmente é medido em % do pico (DD relativo).
    // Em stake fixa, é medido em valor absoluto ou unidades.
    // O app pede "Unidades".
    // Para manter consistência: (Pico - Atual) / Valor da Stake Inicial
    const drawdownUnits = (maxBankroll - currentBankroll) / baseUnit;
    
    if (drawdownUnits > maxDrawdown) {
      maxDrawdown = drawdownUnits;
    }
  });

  // Resultado em Unidades (baseado na stake inicial para referência)
  const finalResultUnits = (currentBankroll - initialBankroll) / baseUnit;
  
  const realizedRoi = totalWagered > 0 ? ((currentBankroll - initialBankroll) / totalWagered) * 100 : 0;
  const realizedWinRate = results.length > 0 ? (wins / results.length) * 100 : 0;
  
  const riskOfRuin = calculateRiskOfRuin(initialBankroll, stakePct, odds, theoreticalWinProb);

  return {
    finalResultUnits,
    realizedRoi,
    realizedWinRate,
    maxDrawdown, 
    maxGreenStreak,
    maxRedStreak,
    finalBankroll: currentBankroll,
    totalWagered,
    riskOfRuin
  };
};

export const runSimulation = (params: SimulationParams): SimulationResult => {
  const { avgOdds, expectedRoi, numBets, stakePct, isCompound } = params;
  
  const requiredWinProb = calculateRequiredWinRate(avgOdds, expectedRoi);
  const results: boolean[] = [];

  // 1. Generate Win/Loss Sequence
  for (let i = 0; i < numBets; i++) {
    results.push(generateRandomOutcome(requiredWinProb));
  }

  // 2. Calculate History for Chart
  const history: SimulationStep[] = [];
  
  // Add Start Point (0, 0)
  history.push({
    betNumber: 0,
    bankroll: 0 // Começa em 0% de lucro
  });

  const initialBank = 1000;
  let currentB = initialBank;
  const initialStakeAmount = initialBank * (stakePct / 100);

  const saveInterval = numBets > 2000 ? Math.floor(numBets / 500) : 1;

  results.forEach((won, index) => {
    // Lógica de Simulação principal para o Gráfico
    let betAmount;
    if (isCompound) {
        betAmount = currentB * (stakePct / 100);
        if (betAmount < 0.01) betAmount = 0; // Ruína efetiva
    } else {
        betAmount = initialStakeAmount;
    }

    if (won) {
      currentB += betAmount * (avgOdds - 1);
    } else {
      currentB -= betAmount;
    }

    if (index % saveInterval === 0 || index === numBets - 1) {
        history.push({
            betNumber: index + 1,
            bankroll: ((currentB - initialBank) / initialBank) * 100, // Lucro em %
        });
    }
  });

  // 3. Calculate Global Stats
  const stats = calculateStats(results, avgOdds, stakePct, requiredWinProb, isCompound);

  // 4. Calculate Blocks
  const blockSize = Math.floor(numBets / 5);
  const blocks: BlockStats[] = [];
  
  for (let i = 0; i < 5; i++) {
    const startIdx = i * blockSize;
    const endIdx = (i === 4) ? numBets : (i + 1) * blockSize;
    const blockResults = results.slice(startIdx, endIdx);
    
    // Importante: Para os blocos, calculamos como se fosse uma mini-simulação independente
    // ou continuamos o fluxo? Geralmente blocos são estatísticas isoladas daquela amostra.
    // Assumiremos stake fixa dentro do bloco para analisar a "qualidade das tips" daquele bloco,
    // ou usamos a flag global. Vamos usar a flag global, mas resetando a banca para o cálculo?
    // Não, calculateStats assume banca de 1000 resetada. Isso é bom para comparar performance pura do bloco.
    const bStats = calculateStats(blockResults, avgOdds, stakePct, requiredWinProb, isCompound);
    
    blocks.push({
      id: i + 1,
      startBet: startIdx + 1,
      endBet: endIdx,
      result: bStats.finalResultUnits,
      winRate: bStats.realizedWinRate,
      roi: bStats.realizedRoi,
      drawdownMax: bStats.maxDrawdown
    });
  }

  return {
    history,
    stats,
    blocks,
    requiredWinRate: requiredWinProb * 100
  };
};
