// ============================================================
// SKILLA — Chat Socket Handlers
// Gestisce: join/leave chat, lista membri, stato online.
// ============================================================

const { supabase } = require("../middleware/auth");

/**
 * Registra tutti gli handler relativi alla gestione delle chat
 * per un socket specifico.
 */
function registerChatHandlers(io, socket, userSockets) {
  const userId = socket.data.userId;

  // ── Entra in una chat ──
  socket.on("chat:join", async ({ chatId }) => {
    try {
      // Verifica che l'utente sia membro
      const { data: member } = await supabase
        .from("chat_members")
        .select("*")
        .eq("chat_id", chatId)
        .eq("user_id", userId)
        .eq("is_expelled", false)
        .single();

      if (!member && !isChatPublic(chatId)) {
        return socket.emit("error", {
          message: "Non sei membro di questa chat",
          code: "NOT_MEMBER",
        });
      }

      // Entra nella room Socket.io (gruppo broadcast)
      socket.join(chatId);

      // Notifica agli altri membri
      socket.to(chatId).emit("user:joined-room", { userId, chatId });

      console.log(`[Chat] ${userId} ha raggiunto la chat ${chatId}`);
    } catch (err) {
      console.error("[chat:join]", err.message);
      socket.emit("error", { message: "Errore ingresso chat", code: "JOIN_ERROR" });
    }
  });

  // ── Lascia una chat ──
  socket.on("chat:leave", async ({ chatId }) => {
    socket.leave(chatId);
    socket.to(chatId).emit("user:left-room", { userId, chatId });
    console.log(`[Chat] ${userId} ha lasciato la room ${chatId}`);
  });

  // ── Aggiorna stato utente (online/away/offline) ──
  socket.on("user:status", async ({ status }) => {
    try {
      await supabase
        .from("profiles")
        .update({ is_online: status === "online", last_seen: new Date().toISOString() })
        .eq("id", userId);

      // Broadcast a tutti (semplificato — in produzione solo agli amici/gruppi)
      socket.broadcast.emit("user:status:update", { userId, status });
    } catch (err) {
      console.error("[user:status]", err.message);
    }
  });

  // ── Typing indicator ──
  let typingTimer;
  socket.on("user:typing", ({ chatId }) => {
    socket.to(chatId).emit("user:typing:broadcast", {
      chatId,
      userId,
    });

    // Auto-stop dopo 3 secondi senza eventi
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      socket.to(chatId).emit("user:typing:stop", { chatId, userId });
    }, 3000);
  });
}

// Helper: verifica se una chat è pubblica (senza query per performance)
async function isChatPublic(chatId) {
  const { data } = await supabase
    .from("chats")
    .select("type")
    .eq("id", chatId)
    .single();
  return data?.type === "public";
}

module.exports = { registerChatHandlers };
