// ============================================================
// SKILLA — Rooms REST Routes
// Stanze voce live: crea, lista, entra, esci.
// Voice powered by LiveKit.
// ============================================================

const express = require("express");
const { nanoid } = require("nanoid");
const { supabase, authenticateRequest } = require("../middleware/auth");

const router = express.Router();

// Genera token LiveKit — fallback se SDK non disponibile
function generateLiveKitToken(roomName, participantIdentity, participantName) {
  try {
    const { AccessToken } = require("livekit-server-sdk");
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.warn("[rooms] LIVEKIT_API_KEY/SECRET non configurati");
      return null;
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: participantName,
    });
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    return token.toJwt();
  } catch (err) {
    console.warn("[rooms] livekit-server-sdk non installato:", err.message);
    return null;
  }
}

// ── GET /rooms?status=live&sport=ski ──
router.get("/", async (req, res) => {
  try {
    const { status, sport, limit = 30, offset = 0 } = req.query;

    let query = supabase
      .from("rooms")
      .select(`
        id, name, description, sport, is_live, max_users,
        voice_room_id, created_at,
        creator:profiles(id, display_name, avatar, sport),
        participants:room_participants(
          user_id, joined_at, is_speaking, is_muted,
          user:profiles(id, display_name, avatar, sport)
        )
      `)
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status === "live") query = query.eq("is_live", true);
    if (sport) query = query.eq("sport", sport);

    const { data, error } = await query;
    if (error) throw error;

    const rooms = (data || []).map((r) => ({
      ...r,
      creatorId: r.creator?.id,
      participantCount: r.participants?.length || 0,
    }));

    res.json({ success: true, data: rooms });
  } catch (err) {
    console.error("[GET /rooms]", err.message);
    res.status(500).json({ error: "Errore recupero stanze" });
  }
});

// ── POST /rooms — crea nuova stanza ──
router.post("/", authenticateRequest, async (req, res) => {
  try {
    const { name, description, sport, maxUsers } = req.body;
    const userId = req.userId;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Il nome della stanza è obbligatorio" });
    }

    const roomId = nanoid();
    const voiceRoomId = `skilla-${roomId}`; // nome univoco per LiveKit

    const { data: room, error } = await supabase
      .from("rooms")
      .insert({
        id: roomId,
        name: name.trim(),
        description: description?.trim() || null,
        creator_id: userId,
        sport: sport || null,
        is_live: true,
        max_users: maxUsers || null,
        voice_room_id: voiceRoomId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Aggiungi creatore come primo partecipante
    await supabase.from("room_participants").insert({
      id: `${roomId}_${userId}`,
      room_id: roomId,
      user_id: userId,
      joined_at: new Date().toISOString(),
      is_speaking: false,
      is_muted: false,
    });

    // Genera token LiveKit per il creatore
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .single();

    const token = generateLiveKitToken(
      voiceRoomId,
      userId,
      profile?.display_name || userId
    );

    res.status(201).json({
      success: true,
      data: {
        ...room,
        token,
        livekitUrl: process.env.LIVEKIT_URL || null,
      },
    });
  } catch (err) {
    console.error("[POST /rooms]", err.message);
    res.status(500).json({ error: "Errore creazione stanza" });
  }
});

// ── GET /rooms/:id — dettagli stanza ──
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: room, error } = await supabase
      .from("rooms")
      .select(`
        id, name, description, sport, is_live, max_users,
        voice_room_id, created_at, ended_at,
        creator:profiles(id, display_name, avatar, sport),
        participants:room_participants(
          user_id, joined_at, is_speaking, is_muted,
          user:profiles(id, display_name, avatar, sport)
        )
      `)
      .eq("id", id)
      .single();

    if (error || !room) return res.status(404).json({ error: "Stanza non trovata" });

    res.json({
      success: true,
      data: { ...room, participantCount: room.participants?.length || 0 },
    });
  } catch (err) {
    res.status(500).json({ error: "Errore recupero stanza" });
  }
});

// ── POST /rooms/:id/join — entra in stanza + token LiveKit ──
router.post("/:id/join", authenticateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const { data: room } = await supabase
      .from("rooms")
      .select("id, name, is_live, max_users, voice_room_id")
      .eq("id", id)
      .single();

    if (!room) return res.status(404).json({ error: "Stanza non trovata" });
    if (!room.is_live) return res.status(400).json({ error: "La stanza non è più attiva" });

    // Controlla limite utenti
    if (room.max_users) {
      const { count } = await supabase
        .from("room_participants")
        .select("*", { count: "exact", head: true })
        .eq("room_id", id);

      if (count >= room.max_users) {
        return res.status(400).json({ error: "La stanza è piena" });
      }
    }

    // Upsert partecipante (potrebbe rientrare)
    await supabase.from("room_participants").upsert({
      id: `${id}_${userId}`,
      room_id: id,
      user_id: userId,
      joined_at: new Date().toISOString(),
      is_speaking: false,
      is_muted: false,
    });

    // Profilo per nome LiveKit
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .single();

    const token = generateLiveKitToken(
      room.voice_room_id,
      userId,
      profile?.display_name || userId
    );

    res.json({
      success: true,
      data: {
        roomId: id,
        token,
        livekitUrl: process.env.LIVEKIT_URL || null,
        voiceRoomId: room.voice_room_id,
      },
    });
  } catch (err) {
    console.error("[POST /rooms/:id/join]", err.message);
    res.status(500).json({ error: "Errore ingresso stanza" });
  }
});

// ── POST /rooms/:id/leave — esci dalla stanza ──
router.post("/:id/leave", authenticateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    await supabase
      .from("room_participants")
      .delete()
      .eq("room_id", id)
      .eq("user_id", userId);

    // Se il creatore esce e non ci sono altri partecipanti → chiudi stanza
    const { data: room } = await supabase
      .from("rooms")
      .select("creator_id")
      .eq("id", id)
      .single();

    if (room?.creator_id === userId) {
      const { count } = await supabase
        .from("room_participants")
        .select("*", { count: "exact", head: true })
        .eq("room_id", id);

      if (count === 0) {
        await supabase
          .from("rooms")
          .update({ is_live: false, ended_at: new Date().toISOString() })
          .eq("id", id);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[POST /rooms/:id/leave]", err.message);
    res.status(500).json({ error: "Errore uscita stanza" });
  }
});

// ── DELETE /rooms/:id — chiudi stanza (solo creatore) ──
router.delete("/:id", authenticateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const { data: room } = await supabase
      .from("rooms")
      .select("creator_id")
      .eq("id", id)
      .single();

    if (room?.creator_id !== userId) {
      return res.status(403).json({ error: "Solo il creatore può chiudere la stanza" });
    }

    await supabase.from("room_participants").delete().eq("room_id", id);
    await supabase
      .from("rooms")
      .update({ is_live: false, ended_at: new Date().toISOString() })
      .eq("id", id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Errore chiusura stanza" });
  }
});

module.exports = router;
