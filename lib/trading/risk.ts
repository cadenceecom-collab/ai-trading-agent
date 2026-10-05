export type RiskInput = {
  portfolioValue: number;
  proposedValue: number;
  currentPositionPct: number;
  dailyLossPct: number;
  cryptoExposurePct: number;
  isCrypto: boolean;
};

export type RiskResult = { approved: boolean; reasons: string[] };

export function evaluateRisk(input: RiskInput): RiskResult {
  const reasons: string[] = [];
  if (input.portfolioValue <= 0) reasons.push('Portfolio value must be positive');
  if (input.proposedValue <= 0) reasons.push('Proposed trade value must be positive');

  const proposedPct = input.portfolioValue > 0 ? (input.proposedValue / input.portfolioValue) * 100 : Infinity;
  if (input.currentPositionPct + proposedPct > 10) reasons.push('Maximum position limit exceeded');
  if (input.dailyLossPct >= 2) reasons.push('Daily loss limit reached');
  if (input.isCrypto && input.cryptoExposurePct + proposedPct > 25) reasons.push('Maximum crypto exposure exceeded');

  return { approved: reasons.length === 0, reasons };
}
