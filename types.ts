export interface SimulationParams {
  avgOdds: number;
  expectedRoi: number;
  numBets: number;
}

export interface BetResult {
  id: number;
  won: boolean;
  profitUnit: number; // Profit in units (e.g., 0.7 for a win at 1.70, -1 for loss)
}

export interface SimulationStep {
  betNumber: number;
  bankroll1: number; // 1% stake path
  bankroll2: number; // 2% stake path
  bankroll5: number; // 5% stake path
}

export interface GlobalStats {
  finalResultUnits: number;
  realizedRoi: number;
  realizedWinRate: number;
  maxDrawdown: number; // In units
  maxGreenStreak: number;
  maxRedStreak: number;
  finalBankroll: number;
  totalWagered: number;
}

export interface BlockStats {
  id: number;
  startBet: number;
  endBet: number;
  result: number;
  winRate: number;
  roi: number;
  drawdownMax: number;
}

export interface SimulationResult {
  history: SimulationStep[];
  stats1: GlobalStats;
  stats2: GlobalStats;
  stats5: GlobalStats;
  blocks: BlockStats[]; // Based on 1% stake as the primary view
  requiredWinRate: number;
}