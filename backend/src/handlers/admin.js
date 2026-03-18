// ============================================================
// SKILLA — Admin Socket Handlers
// Gestisce: muta, espelle, promuove, aggiorna chat.
// ============================================================

const { supabase } = require("../middleware/auth");

function registerAdminHandlers(io, socket, userSockets) {
  const userId = socket.data.userId;

  // Helper: verifica che l'utente sia admin della chat
  async function assertAdmin(chatId) {
    const { data } = await supabase
      .from("chats")
      .select("admin_ids")
      .eq("id", chatId)
      .single();

    if (!data?.admin_ids?.includes(userId)) {
      socket.emit("error", { message: "Sei non sei admin", code: "FORBIDDEN" });
      return false;
    }
    return true;
  }

  // ── Muta membro ──
  socket.on("member:mute", async ({ userId: targetId, chatId, duration }) => {
    if (!(await assertAdmin(chatId))) return;

    const mutedUntil = duration
      ? new Date(Date.now() + duration * 60 * 1000).toISOString()
      : null; // null = muto permanente fino a revoca

    await supabase
      .from("chat_members")
      .update({ is_muted: true, muted_until: mutedUntil })
      .eq("chat_id", chatId)
      .eq("user_id", targetId);

    // Notifica membro mutato
    const targetSockets = userSockets.get(targetId);
    if (targetSockets) {
      targetSockets.forEach((sid) => {
        io.to(sid).emit("member:muted", { chatId, duration });
      });
    }

    // Messaggio di sistema in chat
    io.to(chatId).emit("message:new", {
      id: `sys_${Date.now()}`,
      chatId,
      senderId: "system",
      type: "system",
      content: `Un membro è stato silenziato dall'admin`,
      isPinned: false,
      isDeleted: false,
      reactions: [],
      createdAt: new Date().toISOString(),
    });
  });

  // ── Revoca muto ──
  socket.on("member:unmute", async ({ userId: targetId, chatId }) => {
    if (!(await assertAdmin(chatId))) return;

    await supabase
      .from("chat_members")
      .update({ is_muted: false, muted_until: null })
      .eq("chat_id", chatId)
      .eq("user_id", targetId);

    const targetSockets = userSockets.get(targetId);
    if (targetSockets) {
      targetSockets.forEach((sid) => {
        io.to(sid).emit("member:unmuted", { chatId });
      });
    }
  });

  // ── Espelle membro ──
  socket.on("member:expel", async ({ userId: targetId, chatId }) => {
    if (!(await assertAdmin(chatId))) return;

    // Non può espellere se stesso
    if (targetId === userId) {
      return socket.emit("error", { message: "Non puoi espellere te stesso", code: "SELF_EXPEL" });
    }

    await supabase
      .from("chat_members")
      .update({ is_expelled: true })
      .eq("chat_id", chatId)
      .eq("user_id", targetId);

    // Forza disconnessione dalla room
    const targetSockets = userSockets.get(targetId);
    if (targetSockets) {
      targetSockets.forEach((sid) => {
        io.to(sid).emit("member:expelled", { chatId });
        // Togli dalla Socket.io room
        io.sockets.sockets.get(sid)?.leave(chatId);
      });
    }

    io.to(chatId).emit("member:left", { chatId, userId: targetId });

    io.to(chatId).emit("message:new", {
      id: `sys_${Date.now()}`,
      chatId,
      senderId: "system",
      type: "system",
      content: "Un membro è stato rimosso dalla chat",
      isPinned: false,
      isDeleted: false,
      reactions: [],
      createdAt: new Date().toISOString(),
    });
  });

  // ── Promuovi a admin ──
  socket.on("member:promote", async ({ userId: targetId, chatId }) => {
    if (!(await assertAdmin(chatId))) return;

    const { data: chat } = await supabase
      .from("chats")
      .select("admin_ids")
      .eq("id", chatId)
      .single();

    const adminIds = [...new Set([...(chat?.admin_ids || []), targetId])];

    await supabase.from("chats").update({ admin_ids: adminIds }).eq("id", chatId);
    await supabase
      .from("chat_members")
      .update({ role: "admin" })
      .eq("chat_id", chatId)
      .eq("user_id", targetId);

    const targetSockets = userSockets.get(targetId);
    if (targetSockets) {
      targetSockets.forEach((sid) => {
        io.to(sid).emit("member:promoted", { chatId });
      });
    }

    io.to(chatId).emit("chat:updated", { id: chatId, adminIds });
  });

  // ── Demote admin → membro ──
  socket.on("member:demote", async ({ userId: targetId, chatId }) => {
    if (!(await assertAdmin(chatId))) return;

    const { data: chat } = await supabase
      .from("chats")
      .select("admin_ids")
      .eq("id", chatId)
      .single();

    // Almeno un admin deve restare
    const adminIds = (chat?.admin_ids || []).filter((id) => id !== targetId);
    if (adminIds.length === 0) {
      return socket.emit("error", {
        message: "La chat deve avere almeno un admin",
        code: "LAST_ADMIN",
      });
    }

    await supabase.from("chats").update({ admin_ids: adminIds }).eq("id", chatId);
    await supabase
      .from("chat_members")
      .update({ role: "member" })
      .eq("chat_id", chatId)
      .eq("user_id", targetId);

    io.to(chatId).emit("chat:updated", { id: chatId, adminIds });
  });

  // ── Aggiorna impostazioni chat ──
  socket.on("chat:update-settings", async ({ chatId, settings }) => {
    if (!(await assertAdmin(chatId))) return;

    await supabase
      .from("chats")
      .update({ settings, updated_at: new Date().toISOString() })
      .eq("id", chatId);

    io.to(chatId).emit("chat:updated", { id: chatId, settings });
  });
}

module.exports = { registerAdminHandlers };
