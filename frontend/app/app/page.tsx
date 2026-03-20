"use client";
// ============================================================
// SKILLA — App Home Page
// Dashboard principale: carousel sport, chat recenti, azioni rapide.
// ============================================================

import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, MessageSquare, Map, QrCode, Users } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { SportCarousel } from "@/components/sport/SportCarousel";
import { SPORT_CONFIG } from "@shared/types";
import { cn, timeAgo } from "@/lib/utils";

export default function AppHomePage() {
  const { currentUser, chats, interfaceMode } = useAppStore();
  const sport = currentUser?.sport || "skiing";
  const sportConfig = SPORT_CONFIG[sport];
  const isEmergency = interfaceMode === "emergency";

  const recentChats = [...chats]
    .sort((a, b) =>
      new Date(b.lastMessage?.createdAt || b.createdAt).getTime() -
      new Date(a.lastMessage?.createdAt || a.createdAt).getTime()
    )
    .slice(0, 3);

  // In modalità emergenza: layout ultra-semplificato
  if (isEmergency) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="text-center py-4">
          <p className="text-emergency-xl font-black" style={{ color: "var(--text-primary)" }}>
            {sportConfig.emoji} SKILLA
          </p>
          <p className="text-emergency-base" style={{ color: "var(--text-secondary)" }}>
            Ciao, {currentUser?.displayName}
          </p>
        </div>

        {/* Bottoni emergenza grandi */}
        <Link href="/app/chat" className="btn-primary w-full py-6 text-xl rounded-3xl text-center">
          💬 CHAT
        </Link>
        <Link href="/app/map" className="btn-primary w-full py-6 text-xl rounded-3xl text-center"
              style={{ background: "#10B981" }}>
          🗺️ MAPPA
        </Link>
        <Link href="/app/profile" className="btn-ghost w-full py-6 text-xl rounded-3xl border-2"
              style={{ borderColor: "var(--border)" }}>
          👤 PROFILO
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24 md:pb-6 max-w-2xl mx-auto">

      {/* ── Hero Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-b-3xl px-5 pt-5 pb-7"
        style={{
          background: "linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-card) 100%)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Glow decorativo */}
        <div
          className="absolute -top-8 -right-8 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)`,
          }}
        />
        <div className="flex items-center justify-between relative">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-1"
               style={{ color: "var(--text-muted)" }}>
              Bentornato
            </p>
            <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              {currentUser?.displayName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg">{sportConfig.emoji}</span>
              <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                {sportConfig.name}
              </span>
            </div>
          </div>

          {/* Avatar */}
          <Link href="/app/profile">
            <motion.div
              whileTap={{ scale: 0.92 }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center
                         font-black text-white text-xl relative"
              style={{
                background: `linear-gradient(135deg, ${sportConfig.color}, var(--primary))`,
                boxShadow: `0 4px 20px ${sportConfig.color}50`,
              }}
            >
              {currentUser?.displayName?.[0]?.toUpperCase()}
            </motion.div>
          </Link>
        </div>
      </motion.div>

      <div className="px-4 flex flex-col gap-6">

      {/* ── Azioni rapide ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-3"
      >
        {[
          { href: "/app/chat/new", icon: Plus,         label: "Nuova",    color: "#5865F2", bg: "rgba(88,101,242,0.15)" },
          { href: "/app/chat",     icon: MessageSquare, label: "Chat",     color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
          { href: "/app/map",      icon: Map,           label: "Mappa",    color: "#10B981", bg: "rgba(16,185,129,0.15)" },
          { href: "/app/join",     icon: QrCode,        label: "QR Code",  color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
        ].map((action) => (
          <Link key={action.href} href={action.href}>
            <motion.div
              whileTap={{ scale: 0.90 }}
              whileHover={{ scale: 1.04 }}
              className="flex flex-col items-center gap-2.5 p-3 rounded-2xl"
              style={{ background: action.bg }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: action.color + "22" }}
              >
                <action.icon size={20} style={{ color: action.color }} />
              </div>
              <span className="text-[10px] font-bold text-center leading-tight"
                    style={{ color: action.color }}>
                {action.label}
              </span>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* ── Sport Carousel ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <SportCarousel />
      </motion.div>

      {/* ── Chat recenti ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Chat recenti
          </h2>
          <Link href="/app/chat" className="text-sm font-semibold"
                style={{ color: "var(--accent)" }}>
            Vedi tutte →
          </Link>
        </div>

        {recentChats.length === 0 ? (
          <div className="card p-6 text-center flex flex-col items-center gap-3">
            <span className="text-4xl">💬</span>
            <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              Nessuna chat ancora.
              <br />
              Crea un gruppo o unisciti con un QR code!
            </p>
            <Link href="/app/chat/new" className="btn-primary">
              <Plus size={16} /> Nuova chat
            </Link>
          </div>
        ) : (
          recentChats.map((chat) => {
            const chatSport = chat.sport ? SPORT_CONFIG[chat.sport] : null;
            return (
              <Link key={chat.id} href={`/app/chat/${chat.id}`}>
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className="card p-4 flex items-center gap-3"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{
                      background: chatSport ? `${chatSport.color}20` : "var(--bg-secondary)",
                    }}
                  >
                    {chatSport?.emoji || (chat.type === "public" ? "🌐" : "🔒")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm truncate"
                         style={{ color: "var(--text-primary)" }}>
                        {chat.name}
                      </p>
                      {chat.lastMessage && (
                        <span className="text-[10px] ml-1 flex-shrink-0"
                              style={{ color: "var(--text-muted)" }}>
                          {timeAgo(chat.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate mt-0.5"
                       style={{ color: "var(--text-muted)" }}>
                      {chat.lastMessage?.isDeleted
                        ? "Messaggio eliminato"
                        : chat.lastMessage?.content || "Nessun messaggio"}
                    </p>
                  </div>
                </motion.div>
              </Link>
            );
          })
        )}
      </motion.div>

      {/* ── Badge sport utente ── */}
      {currentUser?.badges && currentUser.badges.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-3"
        >
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            I tuoi badge
          </h2>
          <div className="flex flex-wrap gap-2">
            {currentUser.badges.map((badge) => (
              <span
                key={badge.id}
                className="sport-badge"
                style={{ background: `${badge.color}20`, color: badge.color }}
              >
                {badge.emoji} {badge.label}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      </div>{/* /px-4 */}
    </div>
  );
}
