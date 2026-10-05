import { evaluateRisk } from './risk';

export type PaperOrder = {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  isCrypto: boolean;
  currentPositionValue: number;
  dailyLossPct: number;
  cryptoExposurePct: number;
  portfolioValue: number;
  stopDistancePct?: number;
};

export function createPaperOrder(order: PaperOrder) {
  if (process.env.TRADING_MODE !== 'paper' || process.env.LIVE_TRADING_ENABLED === 'true') {
    throw new Error('Paper execution requires TRADING_MODE=paper and LIVE_TRADING_ENABLED=false.');
  }

  const proposedValue = order.quantity * order.price;
  const risk = evaluateRisk({
    portfolioValue: order.portfolioValue,
    currentPositionValue: order.currentPositionValue,
    proposedOrderValue: proposedValue,
    dailyLossPct: order.dailyLossPct,
    cryptoExposurePct: order.cryptoExposurePct,
    isCrypto: order.isCrypto,
    stopDistancePct: order.stopDistancePct ?? 0,
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
