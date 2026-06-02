// In-memory scalable database state
export const marketInventory = [
  { id: "item-1", name: "iPhone 15 Pro Max (256GB)", stock: 14, basePrice: 72000, currentPrice: 72000, history: [72000], demandScore: 50 },
  { id: "item-2", name: "PlayStation 5 Pro Digital", stock: 8, basePrice: 42000, currentPrice: 42000, history: [42000], demandScore: 30 },
  { id: "item-3", name: "RTX 5080 Graphics Card", stock: 3, basePrice: 85000, currentPrice: 85000, history: [85000], demandScore: 85 }
];

/**
 * Programmatic Pricing Logic
 * Simulates high-frequency market adjustments based on mock user traffic
 */
export function runMarketSimulation(io) {
  setInterval(() => {
    marketInventory.forEach(item => {
      // 1. Simulate random user traffic events (Add to cart, views, checkouts)
      const actionChance = Math.random();
      
      if (actionChance > 0.7) { 
        // High Demand Event: Price creeps up
        item.demandScore = Math.min(100, item.demandScore + Math.floor(Math.random() * 15));
        item.currentPrice = Math.round(item.currentPrice * (1 + (item.demandScore / 2500)));
      } else if (actionChance < 0.25) {
        // Low Demand Decay: Price drops slowly
        item.demandScore = Math.max(10, item.demandScore - Math.floor(Math.random() * 8));
        item.currentPrice = Math.round(item.currentPrice * (1 - 0.005));
      }

      // Hard limits to prevent negative numbers or broken schemas
      if (item.currentPrice < item.basePrice * 0.75) item.currentPrice = Math.round(item.basePrice * 0.75);
      if (item.currentPrice > item.basePrice * 2.0) item.currentPrice = Math.round(item.basePrice * 2.0);

      // Keep tracking the last 10 ticks for the frontend graphs
      item.history.push(item.currentPrice);
      if (item.history.length > 10) item.history.shift();
    });

    // 2. Broadcast the fresh event payload payload globally over WebSockets
    io.emit("MARKET_UPDATE", marketInventory);
  }, 3000); // Ticks every 3 seconds
}

/**
 * Handles transactional checkouts to safely manage concurrency
 */
export function processPurchase(itemId) {
  const item = marketInventory.find(i => i.id === itemId);
  if (!item || item.stock <= 0) return { success: false, reason: "Out of Stock" };
  
  item.stock -= 1;
  // Buying instantly spikes asset demand score
  item.demandScore = Math.min(100, item.demandScore + 25);
  item.currentPrice = Math.round(item.currentPrice * 1.04);
  item.history.push(item.currentPrice);
  
  return { success: true, updatedItem: item };
}