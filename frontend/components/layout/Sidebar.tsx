"use client";
// ============================================================
// SKILLA — Sidebar (desktop)
// Lista chat, navigazione, info utente.
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Search, Compass, Map, Bell, Settings, LogOut } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useAuth } from "@/components/providers/AuthProvider";
import { SPORT_CONFIG } from "@/../../shared/types";
import { cn, timeAgo } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, chats, activeChatId, setActiveChatId, unreadCounts } = useAppStore();
  const { signOut } = useAuth();

  const sport = currentUser?.sport || "other";
  const sportConfig = SPORT_CONFIG[sport];

  return (
    <aside
      className="flex flex-col h-screen border-r"
      style={{
        width: "var(--sidebar-width)",
        background: "var(--bg-secondary)",
        borderColor: "var(--border)",
      }}
    >
      {/* Header sidebar */}
      <div className="flex items-center justify-between px-4 py-4 border-b"
           style={{ borderColor: "var(--border)" }}>
        <Link href="/app" className="flex items-center gap-2">
          <span className="text-2xl">{sportConfig.emoji}</span>
          <span className="text-xl font-black text-gradient">SKILLA</span>
        </Link>
        <Link
          href="/app/chat/new"
          className="btn-ghost p-2 rounded-xl"
          title="Nuova chat"
        >
          <Plus size={18} />
        </Link>
      </div>

      {/* Ricerca */}
      <div className="px-3 py-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            className="input pl-8 text-xs py-2.5"
            placeholder="Cerca chat..."
          />
        </div>
      </div>

      {/* Link navigazione */}
      <nav className="px-2 pb-2">
        {[
          { href: "/app", label: "Esplora", icon: Compass },
          { href: "/app/map", label: "Mappa", icon: Map },
          { href: "/app/notifications", label: "Notifiche", icon: Bell },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1",
              "text-sm font-medium transition-all",
              pathname === item.href
                ? "bg-blue-500/10 text-blue-400"
                : "hover:bg-white/5"
            )}
            style={{ color: pathname === item.href ? undefined : "var(--text-secondary)" }}
          >
            <item.icon size={16} strokeWidth={2} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Lista chat */}
      <div className="flex-1 overflow-auto touch-scroll px-2">
        <p className="text-[10px] font-bold uppercase tracking-widest px-2 py-2"
           style={{ color: "var(--text-muted)" }}>
          Le tue chat
        </p>

        {chats.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
            <span className="text-3xl">💬</span>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Nessuna chat ancora.
              <br />
              Crea o unisciti a una chat!
            </p>
          </div>
        ) : (
          chats.map((chat) => {
            const isActive = chat.id === activeChatId;
            const unread = unreadCounts[chat.id] || 0;
            const sport = chat.sport ? SPORT_CONFIG[chat.sport] : null;

            return (
              <motion.button
                key={chat.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveChatId(chat.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1",
                  "text-left transition-all",
                  isActive
                    ? "bg-blue-500/15"
                    : "hover:bg-white/5"
                )}
              >
                {/* Avatar chat */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center
                             text-lg flex-shrink-0"
                  style={{
                    background: sport
                      ? `${sport.color}25`
                      : "var(--bg-secondary)",
                  }}
                >
                  {sport ? sport.emoji : (chat.type === "public" ? "🌐" : "🔒")}
                </div>

                {/* Info chat */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate"
                          style={{ color: "var(--text-primary)" }}>
                      {chat.name}
                    </span>
                    {chat.lastMessage && (
                      <span className="text-[10px] ml-1 flex-shrink-0"
                            style={{ color: "var(--text-muted)" }}>
                        {timeAgo(chat.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <p className="text-xs truncate"
                       style={{ color: "var(--text-muted)" }}>
                      {chat.lastMessage.isDeleted
                        ? "Messaggio eliminato"
                        : chat.lastMessage.content}
                    </p>
                  )}
                </div>

                {/* Badge unread */}
                {unread > 0 && (
                  <span className="min-w-5 h-5 px-1 rounded-full
                                   bg-blue-500 text-white text-[10px] font-bold
                                   flex items-center justify-center flex-shrink-0">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </motion.button>
            );
          })
        )}
      </div>

      {/* Footer — utente + impostazioni */}
      <div className="border-t p-3 flex items-center gap-3"
           style={{ borderColor: "var(--border)" }}>
        <Link href="/app/profile" className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center
                       font-bold text-sm flex-shrink-0"
            style={{ background: sportConfig.color, color: "white" }}
          >
            {currentUser?.displayName?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate"
               style={{ color: "var(--text-primary)" }}>
              {currentUser?.displayName}
            </p>
            <p className="text-xs truncate"
               style={{ color: "var(--text-muted)" }}>
              {sportConfig.emoji} {sportConfig.label}
            </p>
          </div>
        </Link>

        <div className="flex gap-1">
          <Link href="/app/settings" className="btn-ghost p-2 rounded-xl">
            <Settings size={16} />
          </Link>
          <button onClick={signOut} className="btn-ghost p-2 rounded-xl text-red-400 hover:text-red-300">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
