import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { marketInventory, runMarketSimulation, processPurchase, injectRestock, toggleBreakerOverride, broadcastState } from './simulation/marketEngine.js';
import { systemLogs } from './services/loggerService.js';

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:3000" }
});

let activeConnections = 0;

io.on("connection", (socket) => {
  activeConnections++;
  io.emit("TELEMETRY_UPDATE", { activeConnections });
  
  socket.emit("MARKET_DATA_STREAM", { inventory: marketInventory, logs: systemLogs });

  socket.on("EXECUTE_PURCHASE", (itemId) => {
    processPurchase(itemId, io);
    broadcastState(io);
  });

  socket.on("TRIGGER_GLOBAL_RESTOCK", () => {
    injectRestock(io);
  });

  socket.on("TOGGLE_BREAKER", (itemId) => {
    toggleBreakerOverride(itemId, io);
  });

  socket.on("disconnect", () => {
    activeConnections = Math.max(0, activeConnections - 1);
    io.emit("TELEMETRY_UPDATE", { activeConnections });
  });
});

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`⚡ [SaaS Core Engine v3.0] Active on http://localhost:${PORT}`);
  runMarketSimulation(io);
});