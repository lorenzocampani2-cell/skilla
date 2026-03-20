"use client";
// ============================================================
// SKILLA — Rooms Page
// Lista stanze voce live + crea stanza + entra nella stanza.
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Radio, X } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { SPORT_CONFIG, SportType } from "@shared/types";
import type { Room } from "@shared/types";
import { RoomCard } from "@/components/rooms/RoomCard";
import { VoiceRoom } from "@/components/rooms/VoiceRoom";
import toast from "react-hot-toast";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

const SPORTS = Object.entries(SPORT_CONFIG) as [SportType, (typeof SPORT_CONFIG)[SportType]][];

// ── Modal crea stanza ──
function CreateRoomModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: { name: string; description: string; sport: SportType | ""; maxUsers: number | null }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sport, setSport] = useState<SportType | "">("");
  const [maxUsers, setMaxUsers] = useState<string>("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: "var(--bg-secondary)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Nuova stanza
          </h2>
          <button className="btn-ghost p-2 rounded-xl" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <input
          className="input"
          placeholder="Nome della stanza *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
        />

        <input
          className="input"
          placeholder="Descrizione (facoltativa)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={120}
        />

        {/* Selezione sport */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
            Sport
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSport("")}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
              style={{
                borderColor: sport === "" ? "var(--primary)" : "var(--border)",
                background: sport === "" ? "var(--primary-glow)" : "transparent",
                color: sport === "" ? "var(--primary)" : "var(--text-muted)",
              }}
            >
              Tutti
            </button>
            {SPORTS.slice(0, 8).map(([key, s]) => (
              <button
                key={key}
                onClick={() => setSport(key)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                style={{
                  borderColor: sport === key ? s.color : "var(--border)",
                  background: sport === key ? `${s.color}20` : "transparent",
                  color: sport === key ? s.color : "var(--text-muted)",
                }}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>

        <input
          className="input"
          placeholder="Max partecipanti (lascia vuoto = illimitato)"
          type="number"
          min={2}
          max={100}
          value={maxUsers}
          onChange={(e) => setMaxUsers(e.target.value)}
        />

        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!name.trim()}
          onClick={() =>
            onCreate({
              name,
              description,
              sport,
              maxUsers: maxUsers ? Number(maxUsers) : null,
            })
          }
          className="btn-primary py-3 rounded-xl font-semibold"
        >
          🎙️ Crea stanza
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── Pagina principale ──
export default function RoomsPage() {
  const { currentUser } = useAppStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sportFilter, setSportFilter] = useState<SportType | "all">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [activeLivekitUrl, setActiveLivekitUrl] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: "live" });
      if (sportFilter !== "all") params.append("sport", sportFilter);

      const res = await fetch(`${BACKEND}/api/rooms?${params}`);
      const json = await res.json();
      if (json.success) setRooms(json.data);
    } catch (err) {
      console.error("[rooms] fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [sportFilter]);

  useEffect(() => {
    fetchRooms();
    // Aggiorna ogni 15 secondi
    const interval = setInterval(fetchRooms, 15000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  async function getAuthToken() {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  async function handleCreateRoom(formData: {
    name: string;
    description: string;
    sport: SportType | "";
    maxUsers: number | null;
  }) {
    setShowCreateModal(false);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND}/api/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          sport: formData.sport || null,
          maxUsers: formData.maxUsers,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Errore creazione stanza");
        return;
      }

      toast.success("Stanza creata!");
      setActiveRoom({ ...json.data, participantCount: 1, participants: [] });
      setActiveToken(json.data.token);
      setActiveLivekitUrl(json.data.livekitUrl);
      fetchRooms();
    } catch (err) {
      toast.error("Errore di rete");
    }
  }

  async function handleJoinRoom(room: Room) {
    setJoiningId(room.id);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND}/api/rooms/${room.id}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Impossibile entrare");
        return;
      }

      setActiveRoom(room);
      setActiveToken(json.data.token);
      setActiveLivekitUrl(json.data.livekitUrl);
      fetchRooms();
    } catch (err) {
      toast.error("Errore di rete");
    } finally {
      setJoiningId(null);
    }
  }

  async function handleLeaveRoom() {
    if (!activeRoom) return;
    try {
      const token = await getAuthToken();
      await fetch(`${BACKEND}/api/rooms/${activeRoom.id}/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    setActiveRoom(null);
    setActiveToken(null);
    setActiveLivekitUrl(null);
    fetchRooms();
  }

  const filteredRooms = rooms.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );
  });

  // Se in una stanza, mostra il componente voce
  if (activeRoom) {
    return (
      <div className="h-full p-4">
        <VoiceRoom
          room={activeRoom}
          token={activeToken}
          livekitUrl={activeLivekitUrl}
          currentUserId={currentUser?.id || ""}
          onLeave={handleLeaveRoom}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
              🎙️ Stanze Voce
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {rooms.length} stanze live
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl
                       text-sm font-semibold"
          >
            <Plus size={16} />
            Crea stanza
          </motion.button>
        </div>

        {/* Ricerca */}
        <div className="relative mb-3">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            className="input pl-8 text-sm"
            placeholder="Cerca stanze..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filtro sport */}
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {([["all", "Tutti", "🌐"]] as [string, string, string][])
            .concat(SPORTS.slice(0, 7).map(([k, s]) => [k, s.label, s.emoji]))
            .map(([key, label, emoji]) => (
              <button
                key={key}
                onClick={() => setSportFilter(key as SportType | "all")}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold
                           border transition-all"
                style={{
                  borderColor: sportFilter === key ? "var(--primary)" : "var(--border)",
                  background: sportFilter === key ? "var(--primary-glow)" : "transparent",
                  color: sportFilter === key ? "var(--primary)" : "var(--text-muted)",
                }}
              >
                {emoji} {label}
              </button>
            ))}
        </div>
      </div>

      {/* Lista stanze */}
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="text-4xl animate-bounce">🎙️</div>
            <p style={{ color: "var(--text-muted)" }}>Caricamento stanze...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
            <Radio size={48} strokeWidth={1} style={{ color: "var(--text-muted)" }} />
            <div className="text-center">
              <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                Nessuna stanza attiva
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Sii il primo a creare una stanza!
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2 px-5 py-3 rounded-xl font-semibold"
            >
              <Plus size={16} /> Crea una stanza
            </motion.button>
          </div>
        ) : (
          filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onJoin={handleJoinRoom}
              isJoining={joiningId === room.id}
            />
          ))
        )}
      </div>

      {/* Modal crea stanza */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateRoomModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateRoom}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
