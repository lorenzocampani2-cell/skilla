"use client";
// ============================================================
// SKILLA — VoiceRoom
// Componente voce basato su LiveKit (con fallback mock).
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, PhoneOff, Users, Volume2 } from "lucide-react";
import { SPORT_CONFIG } from "@shared/types";
import type { Room, RoomParticipant } from "@shared/types";

interface VoiceRoomProps {
  room: Room;
  token: string | null;
  livekitUrl: string | null;
  currentUserId: string;
  onLeave: () => void;
}

// ── Componente avatar parlante ──
function SpeakingAvatar({
  participant,
  isSpeaking,
}: {
  participant: RoomParticipant;
  isSpeaking: boolean;
}) {
  const user = participant.user;
  const sport = user?.sport ? SPORT_CONFIG[user.sport] : SPORT_CONFIG.other;

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: Infinity, duration: 0.8 }}
    >
      <div className="relative">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center
                     text-2xl font-bold border-2 transition-all"
          style={{
            background: `${sport.color}30`,
            borderColor: isSpeaking ? sport.color : "var(--border)",
            boxShadow: isSpeaking ? `0 0 16px ${sport.color}60` : "none",
          }}
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user?.displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            user?.displayName?.[0]?.toUpperCase() || "?"
          )}
        </div>

        {/* Indicatore microfono */}
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full
                     flex items-center justify-center"
          style={{
            background: participant.isMuted ? "#EF4444" : "#10B981",
          }}
        >
          {participant.isMuted ? (
            <MicOff size={10} color="white" />
          ) : (
            <Mic size={10} color="white" />
          )}
        </div>
      </div>

      <span
        className="text-xs font-semibold max-w-[72px] truncate text-center"
        style={{ color: "var(--text-primary)" }}
      >
        {user?.displayName || "Ospite"}
      </span>
      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
        {sport.emoji}
      </span>
    </motion.div>
  );
}

// ── LiveKit integrato (caricato dinamicamente) ──
function LiveKitVoice({
  token,
  livekitUrl,
  onLeave,
  isMuted,
  setIsMuted,
}: {
  token: string;
  livekitUrl: string;
  onLeave: () => void;
  isMuted: boolean;
  setIsMuted: (v: boolean) => void;
}) {
  const [Room, setRoom] = useState<React.ComponentType<unknown> | null>(null);
  const [Controls, setControls] = useState<React.ComponentType<unknown> | null>(null);
  const [livekitLoaded, setLivekitLoaded] = useState(false);

  useEffect(() => {
    // Carica LiveKit dinamicamente per evitare SSR issues
    Promise.all([
      import("@livekit/components-react").catch(() => null),
    ]).then(([lk]) => {
      if (lk) {
        setRoom(() => lk.LiveKitRoom as React.ComponentType<unknown>);
        setLivekitLoaded(true);
      }
    });
  }, []);

  if (!livekitLoaded || !Room) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
        <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
        Connessione in corso...
      </div>
    );
  }

  // Usa il componente LiveKit
  const LiveKitRoom = Room as React.ComponentType<{
    token: string;
    serverUrl: string;
    connect: boolean;
    audio: boolean;
    video: boolean;
    onDisconnected?: () => void;
    children?: React.ReactNode;
  }>;

  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect={true}
      audio={!isMuted}
      video={false}
      onDisconnected={onLeave}
    >
      <div className="flex items-center gap-2 text-sm text-green-400">
        <Volume2 size={14} />
        Connesso — audio attivo
      </div>
    </LiveKitRoom>
  );
}

// ── Componente principale ──
export function VoiceRoom({ room, token, livekitUrl, currentUserId, onLeave }: VoiceRoomProps) {
  const [isMuted, setIsMuted] = useState(false);
  const sport = room.sport ? SPORT_CONFIG[room.sport] : SPORT_CONFIG.other;

  const hasLiveKit = !!token && !!livekitUrl;

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Header stanza */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{
          background: `${sport.color}15`,
          borderColor: "var(--border)",
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{sport.emoji}</span>
            <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
              {room.name}
            </h2>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: "#EF444425", color: "#EF4444" }}
            >
              🔴 LIVE
            </span>
          </div>
          {room.description && (
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              {room.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          <Users size={14} />
          <span className="text-sm">{room.participantCount}</span>
        </div>
      </div>

      {/* Griglia partecipanti */}
      <div className="flex-1 overflow-auto p-5">
        {(!room.participants || room.participants.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <span className="text-5xl">{sport.emoji}</span>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Sei il primo in questa stanza
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6 justify-center pt-4">
            {room.participants.map((p) => (
              <SpeakingAvatar
                key={p.userId}
                participant={p}
                isSpeaking={p.isSpeaking && !p.isMuted}
              />
            ))}
          </div>
        )}
      </div>

      {/* LiveKit audio engine */}
      {hasLiveKit && (
        <div className="px-5 pb-2">
          <LiveKitVoice
            token={token}
            livekitUrl={livekitUrl}
            onLeave={onLeave}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
          />
        </div>
      )}

      {!hasLiveKit && (
        <div className="px-5 pb-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Voce non configurata — imposta LIVEKIT_* nelle env vars
          </span>
        </div>
      )}

      {/* Controlli */}
      <div
        className="flex items-center justify-center gap-4 p-4 border-t"
        style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
      >
        {/* Toggle microfono */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsMuted(!isMuted)}
          className="w-14 h-14 rounded-full flex items-center justify-center
                     transition-all font-semibold"
          style={{
            background: isMuted ? "#EF444425" : "var(--primary-glow)",
            color: isMuted ? "#EF4444" : "var(--primary)",
            border: `2px solid ${isMuted ? "#EF4444" : "var(--primary)"}`,
          }}
          title={isMuted ? "Riattiva microfono" : "Silenzia microfono"}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </motion.button>

        {/* Lascia stanza */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onLeave}
          className="w-14 h-14 rounded-full flex items-center justify-center
                     bg-red-500 hover:bg-red-600 transition-all"
          title="Lascia stanza"
        >
          <PhoneOff size={22} color="white" />
        </motion.button>
      </div>
    </div>
  );
}
