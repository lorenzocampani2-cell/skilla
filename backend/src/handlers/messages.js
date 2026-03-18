// ============================================================
// SKILLA — Message Socket Handlers
// Gestisce: invio, eliminazione, pin messaggi.
// ============================================================

const { supabase } = require("../middleware/auth");
const { nanoid } = require("nanoid");

function registerMessageHandlers(io, socket, userSockets) {
  const userId = socket.data.userId;

  // ── Invia messaggio ──
  socket.on("message:send", async ({ chatId, content, type = "text", replyToId }) => {
    try {
      if (!content?.trim()) return;

      // Controlla che l'utente non sia mutato
      const { data: member } = await supabase
        .from("chat_members")
        .select("is_muted, muted_until")
        .eq("chat_id", chatId)
        .eq("user_id", userId)
        .single();

      if (member?.is_muted) {
        const mutedUntil = member.muted_until ? new Date(member.muted_until) : null;
        if (!mutedUntil || mutedUntil > new Date()) {
          return socket.emit("error", {
            message: "Sei silenziato in questa chat",
            code: "USER_MUTED",
          });
        }
      }

      // Verifica se solo admin possono scrivere
      const { data: chatSettings } = await supabase
        .from("chats")
        .select("settings, admin_ids")
        .eq("id", chatId)
        .single();

      if (chatSettings?.settings?.onlyAdminsCanWrite) {
        const isAdmin = chatSettings.admin_ids?.includes(userId);
        if (!isAdmin) {
          return socket.emit("error", {
            message: "Solo gli admin possono scrivere in questa chat",
            code: "ADMIN_ONLY",
          });
        }
      }

      // Salva messaggio su Supabase
      const { data: message, error } = await supabase
        .from("messages")
        .insert({
          id: nanoid(),
          chat_id: chatId,
          sender_id: userId,
          content: content.trim(),
          type,
          reply_to_id: replyToId || null,
          is_pinned: false,
          is_deleted: false,
          created_at: new Date().toISOString(),
        })
        .select(`
          *,
          sender:profiles(id, display_name, avatar, sport, badges)
        `)
        .single();

      if (error) throw error;

      // Aggiorna last_message nella chat
      await supabase
        .from("chats")
        .update({
          last_message: message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", chatId);

      // Broadcast a tutti nella room (incluso il mittente)
      io.to(chatId).emit("message:new", {
        id: message.id,
        chatId: message.chat_id,
        senderId: message.sender_id,
        sender: message.sender,
        type: message.type,
        content: message.content,
        isPinned: false,
        isDeleted: false,
        reactions: [],
        replyToId: message.reply_to_id,
        createdAt: message.created_at,
      });

    } catch (err) {
      console.error("[message:send]", err.message);
      socket.emit("error", { message: "Errore invio messaggio", code: "SEND_ERROR" });
    }
  });

  // ── Elimina messaggio ──
  socket.on("message:delete", async ({ messageId, chatId }) => {
    try {
      // Recupera messaggio
      const { data: message } = await supabase
        .from("messages")
        .select("sender_id, chat_id")
        .eq("id", messageId)
        .single();

      if (!message) return;

      // Solo il mittente o un admin può eliminare
      const { data: chat } = await supabase
        .from("chats")
        .select("admin_ids")
        .eq("id", chatId)
        .single();

      const isOwner = message.sender_id === userId;
      const isAdmin = chat?.admin_ids?.includes(userId);

      if (!isOwner && !isAdmin) {
        return socket.emit("error", {
          message: "Non puoi eliminare questo messaggio",
          code: "FORBIDDEN",
        });
      }

      // Soft delete (mantieni per audit, nascondi agli utenti)
      await supabase
        .from("messages")
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq("id", messageId);

      io.to(chatId).emit("message:updated", {
        id: messageId,
        chatId,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      });

    } catch (err) {
      console.error("[message:delete]", err.message);
    }
  });

  // ── Pinna/spinna messaggio ──
  socket.on("message:pin", async ({ messageId, chatId }) => {
    try {
      // Solo admin possono pinnare
      const { data: chat } = await supabase
        .from("chats")
        .select("admin_ids, pinned_message_ids")
        .eq("id", chatId)
        .single();

      if (!chat?.admin_ids?.includes(userId)) {
        return socket.emit("error", {
          message: "Solo gli admin possono pinnare messaggi",
          code: "FORBIDDEN",
        });
      }

      const { data: message } = await supabase
        .from("messages")
        .select("is_pinned")
        .eq("id", messageId)
        .single();

      const newPinned = !message?.is_pinned;

      await supabase
        .from("messages")
        .update({ is_pinned: newPinned })
        .eq("id", messageId);

      // Aggiorna lista pinnati nella chat
      let pinnedIds = chat.pinned_message_ids || [];
      if (newPinned) {
        pinnedIds = [...new Set([...pinnedIds, messageId])];
      } else {
        pinnedIds = pinnedIds.filter((id) => id !== messageId);
      }

      await supabase
        .from("chats")
        .update({ pinned_message_ids: pinnedIds })
        .eq("id", chatId);

      io.to(chatId).emit("message:updated", {
        id: messageId,
        chatId,
        isPinned: newPinned,
      });

      io.to(chatId).emit("chat:updated", {
        id: chatId,
        pinnedMessageIds: pinnedIds,
      });

    } catch (err) {
      console.error("[message:pin]", err.message);
    }
  });

  // ── Reazione emoji ──
  socket.on("message:react", async ({ messageId, chatId, emoji }) => {
    try {
      const { data: message } = await supabase
        .from("messages")
        .select("reactions")
        .eq("id", messageId)
        .single();

      let reactions = message?.reactions || [];
      const existing = reactions.find((r) => r.emoji === emoji);

      if (existing) {
        if (existing.userIds.includes(userId)) {
          // Rimuovi reazione
          existing.userIds = existing.userIds.filter((id) => id !== userId);
          if (existing.userIds.length === 0) {
            reactions = reactions.filter((r) => r.emoji !== emoji);
          }
        } else {
          existing.userIds.push(userId);
        }
      } else {
        reactions.push({ emoji, userIds: [userId] });
      }

      await supabase
        .from("messages")
        .update({ reactions })
        .eq("id", messageId);

      io.to(chatId).emit("message:updated", {
        id: messageId,
        chatId,
        reactions,
      });
    } catch (err) {
      console.error("[message:react]", err.message);
    }
  });
}

module.exports = { registerMessageHandlers };
