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

const calculateStats = (
  results: boolean[], 
  odds: number, 
  stakePct: number
): GlobalStats => {
  const initialBankroll = 1000; // Abstract currency
  let currentBankroll = initialBankroll;
  let maxBankroll = initialBankroll;
  let maxDrawdown = 0;
  let currentGreenStreak = 0;
  let maxGreenStreak = 0;
  let currentRedStreak = 0;
  let maxRedStreak = 0;
  let totalWagered = 0;
  let wins = 0;

  // Logic for fixed stake: Stake is always stakePct * initialBankroll
  const currentStake = initialBankroll * (stakePct / 100);

  results.forEach((won) => {
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

    // Drawdown Calc
    if (currentBankroll > maxBankroll) {
      maxBankroll = currentBankroll;
    }
    
    // Calculate Drawdown in Units (where 1 Unit = 1% of Initial Bankroll = 10)
    // This standardizes "Units" across different simulation runs
    const unitValue = initialBankroll * 0.01;
    const drawdownUnits = (maxBankroll - currentBankroll) / unitValue;
    
    if (drawdownUnits > maxDrawdown) {
      maxDrawdown = drawdownUnits;
    }
  });

  const finalResultUnits = (currentBankroll - initialBankroll) / (initialBankroll * 0.01); // Convert to "Units" relative to 1% stake
  const realizedRoi = ((currentBankroll - initialBankroll) / totalWagered) * 100;
  const realizedWinRate = (wins / results.length) * 100;

  return {
    finalResultUnits,
    realizedRoi,
    realizedWinRate,
    maxDrawdown, // Now in Units
    maxGreenStreak,
    maxRedStreak,
    finalBankroll: currentBankroll,
    totalWagered
  };
};

export const runSimulation = (params: SimulationParams): SimulationResult => {
  const { avgOdds, expectedRoi, numBets } = params;
  
  const requiredWinProb = calculateRequiredWinRate(avgOdds, expectedRoi);
  const results: boolean[] = [];

  // 1. Generate Win/Loss Sequence
  for (let i = 0; i < numBets; i++) {
    results.push(generateRandomOutcome(requiredWinProb));
  }

  // 2. Calculate History for Chart (Downsampled if too large)
  // We need to track 1%, 2%, 5% paths simultaneously for the chart
  const history: SimulationStep[] = [];
  
  // Add Start Point (0, 0)
  history.push({
    betNumber: 0,
    bankroll1: 0,
    bankroll2: 0,
    bankroll5: 0
  });

  const initialBank = 1000;
  let b1 = initialBank, b2 = initialBank, b5 = initialBank;
  const s1 = initialBank * 0.01, s2 = initialBank * 0.02, s5 = initialBank * 0.05;

  // Create a set of indices to save for the chart to improve performance on large datasets
  const saveInterval = numBets > 2000 ? Math.floor(numBets / 500) : 1;

  results.forEach((won, index) => {
    if (won) {
      b1 += s1 * (avgOdds - 1);
      b2 += s2 * (avgOdds - 1);
      b5 += s5 * (avgOdds - 1);
    } else {
      b1 -= s1;
      b2 -= s2;
      b5 -= s5;
    }

    if (index % saveInterval === 0 || index === numBets - 1) {
        // Normalize history to "Yield %" or "Units gained relative to 1% base"
        // Let's use Yield % (Growth from start)
        history.push({
            betNumber: index + 1,
            bankroll1: ((b1 - initialBank) / initialBank) * 100,
            bankroll2: ((b2 - initialBank) / initialBank) * 100,
            bankroll5: ((b5 - initialBank) / initialBank) * 100,
        });
    }
  });

  // 3. Calculate Global Stats
  const stats1 = calculateStats(results, avgOdds, 1);
  const stats2 = calculateStats(results, avgOdds, 2);
  const stats5 = calculateStats(results, avgOdds, 5);

  // 4. Calculate Blocks (using 1% stake as baseline for analysis)
  const blockSize = Math.floor(numBets / 5);
  const blocks: BlockStats[] = [];
  
  for (let i = 0; i < 5; i++) {
    const startIdx = i * blockSize;
    const endIdx = (i === 4) ? numBets : (i + 1) * blockSize;
    const blockResults = results.slice(startIdx, endIdx);
    
    // Calculate stats just for this block
    const bStats = calculateStats(blockResults, avgOdds, 1);
    
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
    stats1,
    stats2,
    stats5,
    blocks,
    requiredWinRate: requiredWinProb * 100
  };
};