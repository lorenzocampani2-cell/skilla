"use client";
// ============================================================
// SKILLA — RoomCard
// Card per una stanza voce live nell'elenco.
// ============================================================

import { motion } from "framer-motion";
import { Users, Mic } from "lucide-react";
import { SPORT_CONFIG } from "@shared/types";
import type { Room } from "@shared/types";

interface RoomCardProps {
  room: Room;
  onJoin: (room: Room) => void;
  isJoining?: boolean;
}

export function RoomCard({ room, onJoin, isJoining }: RoomCardProps) {
  const sport = room.sport ? SPORT_CONFIG[room.sport] : SPORT_CONFIG.other;
  const isFull = room.maxUsers != null && room.participantCount >= room.maxUsers;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="rounded-2xl p-4 border cursor-pointer transition-all"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border)",
      }}
      onClick={() => !isFull && onJoin(room)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Sport icon */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center
                       text-xl flex-shrink-0"
            style={{ background: `${sport.color}20` }}
          >
            {sport.emoji}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className="font-bold text-sm truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {room.name}
              </h3>
              {room.isLive && (
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase
                             flex-shrink-0"
                  style={{ background: "#EF444420", color: "#EF4444" }}
                >
                  LIVE
                </span>
              )}
            </div>
            {room.description && (
              <p
                className="text-xs truncate mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {room.description}
              </p>
            )}
          </div>
        </div>

        {/* Bottone join */}
        <button
          className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold
                     transition-all"
          style={{
            background: isFull ? "var(--bg-tertiary)" : "var(--primary-glow)",
            color: isFull ? "var(--text-muted)" : "var(--primary)",
            border: `1.5px solid ${isFull ? "var(--border)" : "var(--primary)"}`,
            opacity: isJoining ? 0.7 : 1,
          }}
          disabled={isFull || isJoining}
          onClick={(e) => {
            e.stopPropagation();
            if (!isFull) onJoin(room);
          }}
        >
          {isJoining ? "..." : isFull ? "Piena" : "Entra"}
        </button>
      </div>

      {/* Footer: partecipanti + creator */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t"
           style={{ borderColor: "var(--border)" }}>
        {/* Avatars partecipanti */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {(room.participants || []).slice(0, 5).map((p, i) => (
              <div
                key={p.userId}
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center
                           text-[10px] font-bold"
                style={{
                  background: `${sport.color}30`,
                  borderColor: "var(--bg-secondary)",
                  zIndex: 5 - i,
                }}
              >
                {p.user?.displayName?.[0]?.toUpperCase() || "?"}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
            <Users size={12} />
            <span className="text-xs">
              {room.participantCount}
              {room.maxUsers ? `/${room.maxUsers}` : ""}
            </span>
          </div>
        </div>

        {/* Speakers (chi sta parlando) */}
        <div className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          <Mic size={11} />
          <span className="text-[11px]">
            {(room.participants || []).filter((p) => p.isSpeaking).length} attivi
          </span>
        </div>
      </div>
    </motion.div>
  );
}
