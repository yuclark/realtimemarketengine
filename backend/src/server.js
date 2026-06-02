import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { marketInventory, systemLogs, runMarketSimulation, processPurchase, injectRestock } from './simulation/marketEngine.js';

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

io.on("connection", (socket) => {
  console.log(`Node linked: ${socket.id}`);
  
  // Instant baseline sync
  socket.emit("MARKET_DATA_STREAM", { inventory: marketInventory, logs: systemLogs });

  socket.on("EXECUTE_PURCHASE", (itemId) => {
    processPurchase(itemId, io);
    io.emit("MARKET_DATA_STREAM", { inventory: marketInventory, logs: systemLogs });
  });

  // Listener for automated backend restock execution
  socket.on("TRIGGER_GLOBAL_RESTOCK", () => {
    injectRestock(io);
  });

  socket.on("disconnect", () => console.log(`Node unlinked: ${socket.id}`));
});

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`⚡ [SaaS Core Engine] Active on http://localhost:${PORT}`);
  runMarketSimulation(io);
});