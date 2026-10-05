import { evaluateRisk } from './risk';

export type PaperOrder = {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  isCrypto: boolean;
  currentPositionPct: number;
  dailyLossPct: number;
  cryptoExposurePct: number;
  portfolioValue: number;
};

export function createPaperOrder(order: PaperOrder) {
  if (process.env.LIVE_TRADING_ENABLED === 'true') {
    throw new Error('Live trading is intentionally unavailable in the initial build.');
  }

  const proposedValue = order.quantity * order.price;
  const risk = evaluateRisk({
    portfolioValue: order.portfolioValue,
    proposedValue,
    currentPositionPct: order.currentPositionPct,
    dailyLossPct: order.dailyLossPct,
    cryptoExposurePct: order.cryptoExposurePct,
    isCrypto: order.isCrypto,
  });

  return {
    mode: 'paper' as const,
    status: risk.approved ? 'approved' : 'rejected',
    symbol: order.symbol,
    side: order.side,
    quantity: order.quantity,
    price: order.price,
    value: proposedValue,
    risk,
  };
}
