import { pushLog } from './loggerService.js';

export function evaluateMarketSafety(item) {
  const priceDeviation = Math.abs(item.currentPrice - item.basePrice) / item.basePrice;
  
  // If price swings over 45%, trigger security freeze
  if (priceDeviation > 0.45 && !item.isFrozen) {
    item.isFrozen = true;
    pushLog(`CIRCUIT BREAKER TRIGGERED: ${item.name} frozen due to extreme volatility.`, "critical");
    return true;
  }
  return false;
}