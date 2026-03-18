"use client";
// ============================================================
// SKILLA — Chat List Page
// Lista chat private e pubbliche, ricerca, crea nuova.
// ============================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Search, Globe, Lock, Users } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { SPORT_CONFIG } from "@shared/types";
import type { Chat } from "@shared/types";
import { cn, timeAgo, getToken } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ChatListPage() {
  const { currentUser, chats, setChats, activeChatId, setActiveChatId, interfaceMode } = useAppStore();
  const [tab, setTab] = useState<"mine" | "public">("mine");
  const [search, setSearch] = useState("");
  const [publicChats, setPublicChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const activeChat = chats.find((c) => c.id === activeChatId);
  const isEmergency = interfaceMode === "emergency";

  // Carica chat dell'utente
  useEffect(() => {
    loadMyChats();
  }, []);

  // Carica chat pubbliche quando si cambia tab
  useEffect(() => {
    if (tab === "public") loadPublicChats();
  }, [tab, search]);

  async function loadMyChats() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chats/my`,
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      const data = await res.json();
      if (data.success) setChats(data.data);
    } catch { /* silently fail */ }
  }

  async function loadPublicChats() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (currentUser?.sport) params.set("sport", currentUser.sport);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chats/public?${params}`
      );
      const data = await res.json();
      if (data.success) setPublicChats(data.data);
    } finally {
      setIsLoading(false);
    }
  }

  const myFilteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Se c'è una chat attiva, mostra ChatWindow in fullscreen su mobile
  if (activeChat && window.innerWidth < 768) {
    return (
      <ChatWindow
        chat={activeChat}
        onBack={() => setActiveChatId(null)}
      />
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Lista chat (sinistra su desktop, fullscreen su mobile) ── */}
      <div
        className={cn(
          "flex flex-col",
          activeChat ? "hidden md:flex md:w-80 border-r" : "flex-1"
        )}
        style={{ borderColor: "var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b"
             style={{ borderColor: "var(--border)" }}>
          <h1 className={cn("font-bold", isEmergency ? "text-emergency-lg" : "text-xl")}
              style={{ color: "var(--text-primary)" }}>
            Chat
          </h1>
          <Link
            href="/app/chat/new"
            className="btn-primary px-3 py-2.5 text-sm rounded-xl"
          >
            <Plus size={16} />
            Nuova
          </Link>
        </div>

        {/* Ricerca */}
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                   style={{ color: "var(--text-muted)" }} />
            <input
              className="input pl-9 text-sm"
              placeholder="Cerca chat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
          {[
            { id: "mine", label: "Le mie", icon: Lock },
            { id: "public", label: "Pubbliche", icon: Globe },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id as "mine" | "public")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3",
                "text-sm font-semibold transition-all border-b-2"
              )}
              style={{
                borderColor: tab === id ? "var(--accent)" : "transparent",
                color: tab === id ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-auto touch-scroll">
          {tab === "mine" ? (
            myFilteredChats.length === 0 ? (
              <EmptyChatList />
            ) : (
              myFilteredChats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === activeChatId}
                  onClick={() => setActiveChatId(chat.id)}
                  isEmergency={isEmergency}
                />
              ))
            )
          ) : isLoading ? (
            <div className="flex flex-col gap-1 p-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : publicChats.length === 0 ? (
            <div className="text-center py-12">
              <Globe size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Nessuna chat pubblica trovata
              </p>
            </div>
          ) : (
            publicChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChatId}
                onClick={() => setActiveChatId(chat.id)}
                isEmergency={isEmergency}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Chat window (destra su desktop) ── */}
      {activeChat ? (
        <div className="flex-1 hidden md:flex">
          <ChatWindow
            chat={activeChat}
            onBack={() => setActiveChatId(null)}
          />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center"
             style={{ background: "var(--bg-primary)" }}>
          <div className="text-center">
            <p className="text-5xl mb-4">💬</p>
            <p className="font-semibold" style={{ color: "var(--text-muted)" }}>
              Seleziona una chat per iniziare
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ChatListItem({
  chat,
  isActive,
  onClick,
  isEmergency,
}: {
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
  isEmergency: boolean;
}) {
  const sport = chat.sport ? SPORT_CONFIG[chat.sport] : null;
  const { unreadCounts } = useAppStore();
  const unread = unreadCounts[chat.id] || 0;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 transition-all text-left",
        isEmergency ? "py-5" : "py-3.5",
        isActive
          ? "bg-blue-500/10"
          : "hover:bg-white/5"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "rounded-2xl flex items-center justify-center flex-shrink-0",
          isEmergency ? "w-14 h-14 text-3xl" : "w-11 h-11 text-xl"
        )}
        style={{ background: sport ? `${sport.color}20` : "var(--bg-secondary)" }}
      >
        {sport?.emoji || (chat.type === "public" ? "🌐" : "🔒")}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "font-semibold truncate",
              isEmergency ? "text-emergency-base" : "text-sm"
            )}
            style={{ color: isActive ? "var(--accent)" : "var(--text-primary)" }}
          >
            {chat.name}
          </span>
          {chat.lastMessage && !isEmergency && (
            <span className="text-[10px] ml-1 flex-shrink-0"
                  style={{ color: "var(--text-muted)" }}>
              {timeAgo(chat.lastMessage.createdAt)}
            </span>
          )}
        </div>
        {!isEmergency && (
          <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
            {chat.lastMessage?.isDeleted
              ? "Messaggio eliminato"
              : chat.lastMessage?.content || `${chat.type === "public" ? "🌐" : "🔒"} Chat ${chat.type === "public" ? "pubblica" : "privata"}`}
          </p>
        )}
      </div>

      {/* Badge unread */}
      {unread > 0 && (
        <span className={cn(
          "rounded-full font-bold flex items-center justify-center bg-blue-500 text-white flex-shrink-0",
          isEmergency ? "min-w-8 h-8 text-sm" : "min-w-5 h-5 px-1 text-[10px]"
        )}>
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </motion.button>
  );
}

function EmptyChatList() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 px-4 text-center">
      <span className="text-5xl">💬</span>
      <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
        Nessuna chat ancora.
      </p>
      <Link href="/app/chat/new" className="btn-primary">
        <Plus size={16} /> Crea chat
      </Link>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        oppure scansiona un QR code per unirti a una chat esistente
      </p>
    </div>
  );
}
