import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { marketInventory, runMarketSimulation, processPurchase } from './simulation/marketEngine.js';

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

// Standard REST endpoint for baseline initial state hydration
app.get('/api/inventory', (req, res) => {
  res.json(marketInventory);
});

// WebSocket orchestration layer
io.on("connection", (socket) => {
  console.log(`Connection established: Client IDs [ ${socket.id} ]`);
  
  // Send current state instantly to newly connected client
  socket.emit("MARKET_UPDATE", marketInventory);

  // Handle instant purchase triggers over websocket connection
  socket.on("EXECUTE_PURCHASE", (itemId) => {
    const result = processPurchase(itemId);
    if (result.success) {
      // Broadcast state update immediately to all connected screens
      io.emit("MARKET_UPDATE", marketInventory);
    } else {
      socket.emit("TRANSACTION_FAILED", { itemId, reason: result.reason });
    }
  });

  socket.on("disconnect", () => console.log(`Connection closed: ${socket.id}`));
});

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`⚡ [SaaS Core Engine] Active on http://localhost:${PORT}`);
  runMarketSimulation(io);
});