
export interface SimulationParams {
  avgOdds: number;
  expectedRoi: number; // Agora rotulado apenas como ROI (%)
  stakePct: number;    // Novo campo para gestão dinâmica
  numBets: number;
  isCompound: boolean; // Tipo de Gestão: False = Fixa, True = Composta
}

export interface BetResult {
  id: number;
  won: boolean;
  profitUnit: number;
}

export interface SimulationStep {
  betNumber: number;
  bankroll: number; // Apenas uma linha de evolução da banca
}

export interface GlobalStats {
  finalResultUnits: number;
  realizedRoi: number;
  realizedWinRate: number;
  maxDrawdown: number; // Em unidades
  maxGreenStreak: number;
  maxRedStreak: number;
  finalBankroll: number;
  totalWagered: number;
  riskOfRuin: number; // Probabilidade entre 0 e 1 (ou 0 a 100%)
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
  stats: GlobalStats; // Estatística única para a stake escolhida
  blocks: BlockStats[];
  requiredWinRate: number;
}
