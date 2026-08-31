import http from "node:http";
import app from "./app.js";
import { config } from "./config/env.js";
import { createSocketServer } from "./socket/socket-server.js";
import { initWebsocketService } from "./services/websocket.service.js";

const server = http.createServer(app);

// Initialize Socket.IO server
const io = createSocketServer(server);

// Store io reference in websocket.service for decoupled broadcasting
initWebsocketService(io);

const PORT = config.port;

server.listen(PORT, () => {
  console.log(
    `[WebSocket Service] Running on port ${PORT} in ${config.nodeEnv} mode.`
  );
  console.log(
    `[WebSocket Service] Allowing CORS origins: ${config.corsOrigins.join(", ")}`
  );
});

// Graceful shutdown
const shutdown = () => {
  console.log("[WebSocket Service] Graceful shutdown initiated...");
  io.close(() => {
    server.close(() => {
      console.log("[WebSocket Service] Server closed. Exiting process.");
      process.exit(0);
    });
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export { server, io };

