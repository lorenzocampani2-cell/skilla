// ============================================================
// SKILLA — QR Code Routes
// Genera e valida QR code per inviti chat.
// ============================================================

const express = require("express");
const QRCode = require("qrcode");
const { nanoid } = require("nanoid");
const { supabase, authenticateRequest } = require("../middleware/auth");

const router = express.Router();

// ── Genera QR code per invito chat ──
router.post("/generate", authenticateRequest, async (req, res) => {
  try {
    const { chatId, expiresInHours } = req.body;
    const userId = req.userId;

    // Verifica che l'utente sia admin
    const { data: chat } = await supabase
      .from("chats")
      .select("admin_ids, name, type")
      .eq("id", chatId)
      .single();

    if (!chat) return res.status(404).json({ error: "Chat non trovata" });

    if (!chat.admin_ids?.includes(userId)) {
      return res.status(403).json({ error: "Solo gli admin possono generare QR code" });
    }

    // Genera token univoco per l'invito
    const inviteToken = nanoid(12);

    // Calcola scadenza
    const expiresAt = expiresInHours
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
      : null;

    // Salva invito su DB
    await supabase.from("chat_invites").insert({
      id: nanoid(),
      chat_id: chatId,
      token: inviteToken,
      created_by: userId,
      expires_at: expiresAt,
      uses: 0,
      max_uses: null, // null = illimitato
    });

    // Build link
    const appUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const inviteLink = `${appUrl}/join/${inviteToken}`;

    // Genera QR code come Data URL (base64 PNG)
    const qrDataUrl = await QRCode.toDataURL(inviteLink, {
      errorCorrectionLevel: "M",
      type: "image/png",
      quality: 0.92,
      margin: 2,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
      width: 300,
    });

    res.json({
      success: true,
      data: {
        inviteLink,
        qrCode: qrDataUrl,
        token: inviteToken,
        expiresAt,
        chatName: chat.name,
      },
    });

  } catch (err) {
    console.error("[QR generate]", err.message);
    res.status(500).json({ error: "Errore generazione QR code" });
  }
});

// ── Valida e usa un token invito ──
router.get("/validate/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const { data: invite } = await supabase
      .from("chat_invites")
      .select(`
        *,
        chat:chats(id, name, type, description, members_count)
      `)
      .eq("token", token)
      .single();

    if (!invite) {
      return res.status(404).json({ error: "Link di invito non valido" });
    }

    // Controlla scadenza
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return res.status(410).json({ error: "Questo link di invito è scaduto" });
    }

    // Controlla usi massimi
    if (invite.max_uses && invite.uses >= invite.max_uses) {
      return res.status(410).json({ error: "Questo link ha raggiunto il limite di usi" });
    }

    res.json({
      success: true,
      data: {
        chatId: invite.chat_id,
        chatName: invite.chat?.name,
        chatType: invite.chat?.type,
        description: invite.chat?.description,
        expiresAt: invite.expires_at,
        token,
      },
    });

  } catch (err) {
    console.error("[QR validate]", err.message);
    res.status(500).json({ error: "Errore validazione token" });
  }
});

// ── Usa invito per entrare in una chat ──
router.post("/use/:token", authenticateRequest, async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.userId;

    const { data: invite } = await supabase
      .from("chat_invites")
      .select("*")
      .eq("token", token)
      .single();

    if (!invite) return res.status(404).json({ error: "Invito non trovato" });
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return res.status(410).json({ error: "Invito scaduto" });
    }

    // Controlla se già membro
    const { data: existing } = await supabase
      .from("chat_members")
      .select("id, is_expelled")
      .eq("chat_id", invite.chat_id)
      .eq("user_id", userId)
      .single();

    if (existing && !existing.is_expelled) {
      return res.json({ success: true, data: { chatId: invite.chat_id, alreadyMember: true } });
    }

    // Aggiungi o re-aggiungi come membro
    if (existing?.is_expelled) {
      await supabase
        .from("chat_members")
        .update({ is_expelled: false, joined_at: new Date().toISOString() })
        .eq("chat_id", invite.chat_id)
        .eq("user_id", userId);
    } else {
      await supabase.from("chat_members").insert({
        id: `${invite.chat_id}_${userId}`,
        chat_id: invite.chat_id,
        user_id: userId,
        role: "member",
        joined_at: new Date().toISOString(),
        is_muted: false,
        is_expelled: false,
      });
    }

    // Incrementa contatore usi
    await supabase
      .from("chat_invites")
      .update({ uses: (invite.uses || 0) + 1 })
      .eq("id", invite.id);

    res.json({ success: true, data: { chatId: invite.chat_id, alreadyMember: false } });

  } catch (err) {
    console.error("[QR use]", err.message);
    res.status(500).json({ error: "Errore utilizzo invito" });
  }
});

// ── Lista inviti attivi di una chat ──
router.get("/chat/:chatId", authenticateRequest, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    const { data: chat } = await supabase
      .from("chats")
      .select("admin_ids")
      .eq("id", chatId)
      .single();

    if (!chat?.admin_ids?.includes(userId)) {
      return res.status(403).json({ error: "Non autorizzato" });
    }

    const { data: invites } = await supabase
      .from("chat_invites")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false });

    const appUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    res.json({
      success: true,
      data: invites.map((inv) => ({
        ...inv,
        inviteLink: `${appUrl}/join/${inv.token}`,
        isExpired: inv.expires_at && new Date(inv.expires_at) < new Date(),
      })),
    });

  } catch (err) {
    res.status(500).json({ error: "Errore lista inviti" });
  }
});

module.exports = router;
