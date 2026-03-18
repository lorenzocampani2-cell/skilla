// ============================================================
// SKILLA — Auth REST Routes
// Gestisce profilo utente, aggiornamenti, upload avatar.
// ============================================================

const express = require("express");
const { supabase, authenticateRequest } = require("../middleware/auth");

const router = express.Router();

// ── Profilo utente corrente ──
router.get("/profile", authenticateRequest, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", req.userId)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: "Profilo non trovato" });
    }

    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ error: "Errore recupero profilo" });
  }
});

// ── Aggiorna profilo ──
router.patch("/profile", authenticateRequest, async (req, res) => {
  try {
    const { displayName, sport, avatar, preferences, badges } = req.body;

    const updates = {};
    if (displayName) updates.display_name = displayName.trim().slice(0, 40);
    if (sport) updates.sport = sport;
    if (avatar !== undefined) updates.avatar = avatar;
    if (preferences) updates.preferences = preferences;
    if (badges) updates.badges = badges;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", req.userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    console.error("[PATCH /profile]", err.message);
    res.status(500).json({ error: "Errore aggiornamento profilo" });
  }
});

// ── Cerca utenti (per aggiungere a chat) ──
router.get("/users/search", authenticateRequest, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar, sport, badges, is_online")
      .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
      .neq("id", req.userId)
      .limit(10);

    res.json({ success: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ error: "Errore ricerca utenti" });
  }
});

// ── Profilo pubblico di un utente ──
router.get("/users/:userId", async (req, res) => {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar, sport, badges, is_online, created_at")
      .eq("id", req.params.userId)
      .single();

    if (!data) return res.status(404).json({ error: "Utente non trovato" });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: "Errore" });
  }
});

module.exports = router;
