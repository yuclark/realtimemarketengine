// In-memory scalable database state
export const marketInventory = [
  { id: "item-1", name: "iPhone 15 Pro Max (256GB)", stock: 14, basePrice: 72000, currentPrice: 72000, history: [72000], demandScore: 50 },
  { id: "item-2", name: "PlayStation 5 Pro Digital", stock: 8, basePrice: 42000, currentPrice: 42000, history: [42000], demandScore: 30 },
  { id: "item-3", name: "RTX 5080 Graphics Card", stock: 3, basePrice: 85000, currentPrice: 85000, history: [85000], demandScore: 85 }
];

// High-frequency logging stack
export const systemLogs = [];

function pushLog(message, type = "info") {
  const timestamp = new Date().toLocaleTimeString();
  systemLogs.unshift({ id: Math.random().toString(36).substr(2, 9), timestamp, message, type });
  if (systemLogs.length > 15) systemLogs.pop();
}

// Initial log seed
pushLog("Real-Time Asset Engine safely initialized.", "system");

export function runMarketSimulation(io) {
  setInterval(() => {
    marketInventory.forEach(item => {
      const actionChance = Math.random();
      
      if (actionChance > 0.75) { 
        // Demand spikes
        item.demandScore = Math.min(100, item.demandScore + Math.floor(Math.random() * 12));
        const oldPrice = item.currentPrice;
        item.currentPrice = Math.round(item.currentPrice * (1 + (item.demandScore / 3000)));
        
        if (item.currentPrice !== oldPrice) {
          pushLog(`Algorithmic surge triggered for ${item.name} (+₱${(item.currentPrice - oldPrice).toLocaleString()})`, "surge");
        }
      } else if (actionChance < 0.20) {
        // Demand decays
        item.demandScore = Math.max(10, item.demandScore - Math.floor(Math.random() * 6));
        item.currentPrice = Math.round(item.currentPrice * 0.996);
      }

      item.history.push(item.currentPrice);
      if (item.history.length > 10) item.history.shift();
    });

    // Unified payload broadcasting
    io.emit("MARKET_DATA_STREAM", { inventory: marketInventory, logs: systemLogs });
  }, 3000);
}

export function processPurchase(itemId, io) {
  const item = marketInventory.find(i => i.id === itemId);
  if (!item || item.stock <= 0) {
    pushLog(`Transaction blocked: Conflict detected. Resource exhausted.`, "error");
    return { success: false, reason: "Out of Stock" };
  }
  
  item.stock -= 1;
  item.demandScore = Math.min(100, item.demandScore + 20);
  item.currentPrice = Math.round(item.currentPrice * 1.035);
  item.history.push(item.currentPrice);
  
  pushLog(`Order fulfilled: 1 unit of ${item.name} claimed.`, "success");
  
  if (item.stock === 0) {
    pushLog(`CRITICAL: Stock depletion event on ${item.name}!`, "critical");
    io.emit("SYSTEM_ALERT", { message: `CRITICAL ALERT: ${item.name} has officially sold out!`, type: "critical" });
  }

  return { success: true, updatedItem: item };
}

export function injectRestock(io) {
  marketInventory.forEach(item => {
    if (item.stock < 5) {
      const injectionCount = Math.floor(Math.random() * 8) + 5;
      item.stock += injectionCount;
      pushLog(`Admin Refill event: Injected +${injectionCount} units into ${item.name}.`, "system");
    }
  });
  io.emit("MARKET_DATA_STREAM", { inventory: marketInventory, logs: systemLogs });
}