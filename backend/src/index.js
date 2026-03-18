// ============================================================
// SKILLA — Backend Server
// Express + Socket.io per chat real-time.
// ============================================================

require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { authenticateSocket } = require("./middleware/auth");
const { registerChatHandlers } = require("./handlers/chat");
const { registerMessageHandlers } = require("./handlers/messages");
const { registerAdminHandlers } = require("./handlers/admin");

// --- Routes REST ---
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chats");
const qrRoutes = require("./routes/qr");

const app = express();
const httpServer = http.createServer(app);

// ── Configurazione Socket.io ──
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 20000,
  pingInterval: 10000,
});

// ── Middleware Express ──
app.use(
  helmet({
    contentSecurityPolicy: false, // gestito da Next.js
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Rate limiting — anti-spam
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 200, // max 200 richieste per IP
  message: { error: "Troppe richieste. Riprova tra poco." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── Routes REST ──
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/qr", qrRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount,
  });
});

// ── Socket.io — autenticazione e handlers ──
io.use(authenticateSocket);

// Mappa userId → Set di socketId (un utente può avere più tab aperte)
const userSockets = new Map();

io.on("connection", (socket) => {
  const userId = socket.data.userId;
  console.log(`[Socket] Connesso: ${userId} (${socket.id})`);

  // Registra socket per questo utente
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId).add(socket.id);

  // Registra tutti gli handler per eventi chat
  registerChatHandlers(io, socket, userSockets);
  registerMessageHandlers(io, socket, userSockets);
  registerAdminHandlers(io, socket, userSockets);

  // Gestione disconnessione
  socket.on("disconnect", (reason) => {
    console.log(`[Socket] Disconnesso: ${userId} - ${reason}`);
    const sockets = userSockets.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        userSockets.delete(userId);
        // Notifica agli altri utenti che è offline
        socket.broadcast.emit("user:offline", { userId });
      }
    }
  });
});

// ── Avvio server ──
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 SKILLA Backend avviato`);
  console.log(`   Server: http://localhost:${PORT}`);
  console.log(`   Socket.io: ws://localhost:${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || "development"}\n`);
});

// Esporta io per uso negli handlers
module.exports = { io };
