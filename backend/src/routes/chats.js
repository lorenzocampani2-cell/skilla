// ============================================================
// SKILLA — Chat REST Routes
// CRUD per chat: crea, lista, entra, dettagli, messaggi.
// ============================================================

const express = require("express");
const { nanoid } = require("nanoid");
const { supabase, authenticateRequest } = require("../middleware/auth");

const router = express.Router();

// ── Crea nuova chat ──
router.post("/", authenticateRequest, async (req, res) => {
  try {
    const { name, type = "group", description, sport, requirePin, pin } = req.body;
    const userId = req.userId;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Il nome della chat è obbligatorio" });
    }

    const chatId = nanoid();

    // Crea chat
    const { data: chat, error } = await supabase
      .from("chats")
      .insert({
        id: chatId,
        name: name.trim(),
        type, // "public" | "private" | "group"
        description: description?.trim(),
        sport: sport || null,
        created_by: userId,
        admin_ids: [userId],
        pinned_message_ids: [],
        is_archived: false,
        settings: {
          onlyAdminsCanWrite: false,
          onlyAdminsCanAddMembers: false,
          requirePin: requirePin || false,
          pin: pin || null,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Aggiungi creatore come primo membro (admin)
    await supabase.from("chat_members").insert({
      id: `${chatId}_${userId}`,
      chat_id: chatId,
      user_id: userId,
      role: "admin",
      joined_at: new Date().toISOString(),
      is_muted: false,
      is_expelled: false,
    });

    res.status(201).json({ success: true, data: chat });

  } catch (err) {
    console.error("[POST /chats]", err.message);
    res.status(500).json({ error: "Errore creazione chat" });
  }
});

// ── Lista chat dell'utente ──
router.get("/my", authenticateRequest, async (req, res) => {
  try {
    const userId = req.userId;

    const { data, error } = await supabase
      .from("chat_members")
      .select(`
        role,
        joined_at,
        is_muted,
        chat:chats(
          id, name, type, description, sport,
          admin_ids, pinned_message_ids, is_archived,
          settings, created_at, updated_at, last_message
        )
      `)
      .eq("user_id", userId)
      .eq("is_expelled", false)
      .order("joined_at", { ascending: false });

    if (error) throw error;

    const chats = data
      .filter((d) => d.chat && !d.chat.is_archived)
      .map((d) => ({
        ...d.chat,
        myRole: d.role,
        isMuted: d.is_muted,
      }));

    res.json({ success: true, data: chats });

  } catch (err) {
    console.error("[GET /chats/my]", err.message);
    res.status(500).json({ error: "Errore recupero chat" });
  }
});

// ── Lista chat pubbliche ──
router.get("/public", async (req, res) => {
  try {
    const { sport, search, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from("chats")
      .select("id, name, type, description, sport, created_at, settings")
      .eq("type", "public")
      .eq("is_archived", false)
      .order("updated_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (sport) query = query.eq("sport", sport);
    if (search) query = query.ilike("name", `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ success: true, data, total: count, hasMore: data.length === Number(limit) });

  } catch (err) {
    res.status(500).json({ error: "Errore recupero chat pubbliche" });
  }
});

// ── Dettagli chat + membri ──
router.get("/:chatId", authenticateRequest, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    const { data: chat } = await supabase
      .from("chats")
      .select(`
        *,
        members:chat_members(
          role, joined_at, is_muted, is_expelled,
          user:profiles(id, display_name, avatar, sport, badges, is_online, last_seen)
        )
      `)
      .eq("id", chatId)
      .single();

    if (!chat) return res.status(404).json({ error: "Chat non trovata" });

    // Verifica accesso
    const isMember = chat.members?.some(
      (m) => m.user?.id === userId && !m.is_expelled
    );
    if (!isMember && chat.type !== "public") {
      return res.status(403).json({ error: "Non sei membro di questa chat" });
    }

    res.json({ success: true, data: chat });

  } catch (err) {
    res.status(500).json({ error: "Errore recupero chat" });
  }
});

// ── Messaggi di una chat (paginati) ──
router.get("/:chatId/messages", authenticateRequest, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, before } = req.query;

    let query = supabase
      .from("messages")
      .select(`
        id, chat_id, sender_id, type, content, is_pinned,
        is_deleted, deleted_at, reactions, reply_to_id, created_at, updated_at,
        sender:profiles(id, display_name, avatar, sport)
      `)
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(Number(limit));

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Inverte per avere i più vecchi prima
    const messages = (data || []).reverse().map((m) => ({
      id: m.id,
      chatId: m.chat_id,
      senderId: m.sender_id,
      sender: m.sender,
      type: m.type,
      content: m.is_deleted ? "Messaggio eliminato" : m.content,
      isPinned: m.is_pinned,
      isDeleted: m.is_deleted,
      deletedAt: m.deleted_at,
      reactions: m.reactions || [],
      replyToId: m.reply_to_id,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));

    res.json({
      success: true,
      data: messages,
      hasMore: data?.length === Number(limit),
    });

  } catch (err) {
    console.error("[GET messages]", err.message);
    res.status(500).json({ error: "Errore recupero messaggi" });
  }
});

// ── Elimina chat (solo admin) ──
router.delete("/:chatId", authenticateRequest, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    const { data: chat } = await supabase
      .from("chats")
      .select("admin_ids, created_by")
      .eq("id", chatId)
      .single();

    if (chat?.created_by !== userId && !chat?.admin_ids?.includes(userId)) {
      return res.status(403).json({ error: "Solo il creatore può eliminare la chat" });
    }

    // Soft delete (archivia invece di eliminare per sicurezza)
    await supabase
      .from("chats")
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq("id", chatId);

    res.json({ success: true, message: "Chat eliminata" });

  } catch (err) {
    res.status(500).json({ error: "Errore eliminazione chat" });
  }
});

module.exports = router;
