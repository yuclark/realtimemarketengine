import { pushLog, systemLogs } from '../services/loggerService.js';
import { evaluateMarketSafety } from '../services/circuitBreaker.js';

export const marketInventory = [
  { id: "item-1", name: "iPhone 15 Pro Max (256GB)", stock: 14, basePrice: 72000, currentPrice: 72000, history: [72000], demandScore: 50, isFrozen: false },
  { id: "item-2", name: "PlayStation 5 Pro Digital", stock: 8, basePrice: 42000, currentPrice: 42000, history: [42000], demandScore: 30, isFrozen: false },
  { id: "item-3", name: "RTX 5080 Graphics Card", stock: 3, basePrice: 85000, currentPrice: 85000, history: [85000], demandScore: 85, isFrozen: false }
];

export function runMarketSimulation(io) {
  setInterval(() => {
    marketInventory.forEach(item => {
      if (item.isFrozen) return; // Disregard pricing shifts on frozen items

      const actionChance = Math.random();
      if (actionChance > 0.75) { 
        item.demandScore = Math.min(100, item.demandScore + Math.floor(Math.random() * 15));
        const oldPrice = item.currentPrice;
        item.currentPrice = Math.round(item.currentPrice * (1 + (item.demandScore / 2000)));
        
        if (item.currentPrice !== oldPrice) {
          pushLog(`Algorithmic surge for ${item.name} (+₱${(item.currentPrice - oldPrice).toLocaleString()})`, "surge");
        }
        
        // Evaluate stability thresholds
        if (evaluateMarketSafety(item)) {
          io.emit("SYSTEM_ALERT", { message: `MARKET PROTECTION: Trading frozen for ${item.name}!`, type: "critical" });
        }
      } else if (actionChance < 0.20) {
        item.demandScore = Math.max(10, item.demandScore - Math.floor(Math.random() * 6));
        item.currentPrice = Math.round(item.currentPrice * 0.995);
      }

      item.history.push(item.currentPrice);
      if (item.history.length > 10) item.history.shift();
    });

    broadcastState(io);
  }, 3000);
}

export function processPurchase(itemId, io) {
  const item = marketInventory.find(i => i.id === itemId);
  if (!item || item.stock <= 0 || item.isFrozen) {
    pushLog(`Transaction rejected: Order path blocked or item locked.`, "error");
    return { success: false };
  }
  
  item.stock -= 1;
  item.demandScore = Math.min(100, item.demandScore + 25);
  item.currentPrice = Math.round(item.currentPrice * 1.04);
  item.history.push(item.currentPrice);
  
  pushLog(`Fulfilled: 1 unit of ${item.name} captured.`, "success");
  
  if (item.stock === 0) {
    pushLog(`Inventory Exhaustion: ${item.name} sold out.`, "critical");
    io.emit("SYSTEM_ALERT", { message: `CRITICAL OUT-OF-STOCK: ${item.name} is completely empty!`, type: "critical" });
  }

  evaluateMarketSafety(item);
  return { success: true };
}

export function toggleBreakerOverride(itemId, io) {
  const item = marketInventory.find(i => i.id === itemId);
  if (item) {
    item.isFrozen = !item.isFrozen;
    item.currentPrice = item.basePrice; // Reset price back to standard safety limits
    item.history = [item.basePrice];
    pushLog(`Manual Override: Admin forced state change on ${item.name}.`, "system");
    broadcastState(io);
  }
}

export function injectRestock(io) {
  marketInventory.forEach(item => {
    if (item.stock < 5) {
      const added = Math.floor(Math.random() * 5) + 5;
      item.stock += added;
      pushLog(`Supply Injection: Stock reset +${added} items for ${item.name}.`, "system");
    }
  });
  broadcastState(io);
}

export function broadcastState(io) {
  io.emit("MARKET_DATA_STREAM", { inventory: marketInventory, logs: systemLogs });
}