"use client";
// ============================================================
// SKILLA — ChatWindow
// Finestra chat principale: messaggi + input + push-to-talk.
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Pin, MoreVertical, ArrowLeft, QrCode } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useSocket } from "@/components/providers/SocketProvider";
import { MessageBubble } from "./MessageBubble";
import { PushToTalk } from "./PushToTalk";
import { ChatAdminPanel } from "./ChatAdminPanel";
import { QRCodeModal } from "./QRCodeModal";
import { SPORT_CONFIG } from "@shared/types";
import type { Chat } from "@shared/types";
import { cn, formatTime } from "@/lib/utils";
import toast from "react-hot-toast";

interface Props {
  chat: Chat;
  onBack?: () => void;
}

export function ChatWindow({ chat, onBack }: Props) {
  const { currentUser, messages: allMessages, setMessages, interfaceMode } = useAppStore();
  const { joinChat, leaveChat, sendMessage, startTyping } = useSocket();

  const [input, setInput] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [pinnedVisible, setPinnedVisible] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = allMessages[chat.id] || [];
  const isAdmin = chat.adminIds?.includes(currentUser?.id || "");
  const pinnedMessages = messages.filter((m) => m.isPinned && !m.isDeleted);
  const sport = chat.sport ? SPORT_CONFIG[chat.sport] : null;
  const isEmergency = interfaceMode === "emergency";

  // Carica messaggi e unisciti alla chat
  useEffect(() => {
    joinChat(chat.id);
    loadMessages();

    return () => {
      leaveChat(chat.id);
    };
  }, [chat.id]);

  // Scroll automatico all'ultimo messaggio
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Ascolta eventi typing
  useEffect(() => {
    // Implementato tramite SocketProvider
  }, []);

  async function loadMessages() {
    try {
      setIsLoadingMessages(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chats/${chat.id}/messages`,
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );
      const data = await res.json();
      if (data.success) {
        setMessages(chat.id, data.data);
      }
    } finally {
      setIsLoadingMessages(false);
    }
  }

  function handleSend() {
    const content = input.trim();
    if (!content) return;
    sendMessage(chat.id, content, "text");
    setInput("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
    startTyping(chat.id);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header Chat ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {/* Back (mobile) */}
        {onBack && (
          <button onClick={onBack} className="btn-ghost p-2 rounded-xl -ml-2 md:hidden">
            <ArrowLeft size={20} />
          </button>
        )}

        {/* Avatar chat */}
        <div
          className={cn(
            "rounded-xl flex items-center justify-center text-xl flex-shrink-0",
            isEmergency ? "w-14 h-14" : "w-10 h-10"
          )}
          style={{ background: sport ? `${sport.color}25` : "var(--bg-secondary)" }}
        >
          {sport ? sport.emoji : (chat.type === "public" ? "🌐" : "🔒")}
        </div>

        {/* Info chat */}
        <div className="flex-1 min-w-0">
          <h2
            className={cn(
              "font-bold truncate",
              isEmergency ? "text-emergency-base" : "text-base"
            )}
            style={{ color: "var(--text-primary)" }}
          >
            {chat.name}
          </h2>
          <p
            className="text-xs truncate"
            style={{ color: "var(--text-muted)" }}
          >
            {chat.members?.filter((m) => !m.isExpelled).length || 0} membri
            {chat.type === "public" && " · Pubblica"}
            {chat.type === "private" && " · Privata"}
          </p>
        </div>

        {/* Azioni admin */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isAdmin && (
            <button
              onClick={() => setShowQR(true)}
              className="btn-ghost p-2 rounded-xl"
              title="Genera QR code invito"
            >
              <QrCode size={18} />
            </button>
          )}
          <button
            onClick={() => setShowAdmin(true)}
            className="btn-ghost p-2 rounded-xl"
            title="Info e impostazioni chat"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* ── Messaggi pinnati ── */}
      <AnimatePresence>
        {pinnedMessages.length > 0 && pinnedVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b overflow-hidden flex-shrink-0"
            style={{
              background: "rgba(59,130,246,0.08)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-center gap-2 px-4 py-2">
              <Pin size={12} className="text-blue-400 flex-shrink-0" />
              <p className="text-xs font-medium flex-1 truncate"
                 style={{ color: "var(--text-secondary)" }}>
                📌 {pinnedMessages[pinnedMessages.length - 1]?.content}
              </p>
              <button
                onClick={() => setPinnedVisible(false)}
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lista messaggi ── */}
      <div
        className="flex-1 overflow-y-auto touch-scroll px-4 py-4 flex flex-col gap-2"
        style={{ background: "var(--bg-primary)" }}
      >
        {isLoadingMessages ? (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={cn("flex gap-2", i % 2 === 0 ? "" : "flex-row-reverse")}>
                <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
                <div className="skeleton h-12 rounded-2xl"
                     style={{ width: `${Math.random() * 40 + 40}%` }} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
            <span className="text-5xl">👋</span>
            <p className="text-sm font-medium text-center"
               style={{ color: "var(--text-muted)" }}>
              Nessun messaggio ancora.
              <br />
              Inizia la conversazione!
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, i) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUser?.id}
                showAvatar={
                  i === 0 ||
                  messages[i - 1]?.senderId !== message.senderId
                }
                chatId={chat.id}
                isAdmin={isAdmin}
              />
            ))}

            {/* Typing indicator */}
            <AnimatePresence>
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex gap-1 px-4 py-3 rounded-2xl rounded-bl-sm"
                       style={{ background: "var(--bg-secondary)" }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{
                          background: "var(--text-muted)",
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input messaggio ── */}
      <div
        className="border-t flex-shrink-0 px-4 py-3"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3">
          {/* Campo testo */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Scrivi un messaggio..."
              className={cn(
                "input w-full pr-12",
                isEmergency && "text-emergency-base py-4"
              )}
              disabled={chat.settings?.onlyAdminsCanWrite && !isAdmin}
            />
            {/* Emoji button */}
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-lg"
              onClick={() => {}} // futuro: emoji picker
              aria-label="Aggiungi emoji"
            >
              😊
            </button>
          </div>

          {/* Invia / PTT */}
          {input.trim() ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              className={cn(
                "btn-primary flex-shrink-0 rounded-xl",
                isEmergency ? "p-5" : "p-3"
              )}
              aria-label="Invia messaggio"
            >
              <Send size={isEmergency ? 24 : 18} />
            </motion.button>
          ) : (
            <PushToTalk chatId={chat.id} />
          )}
        </div>

        {/* Avviso solo-admin */}
        {chat.settings?.onlyAdminsCanWrite && !isAdmin && (
          <p className="text-xs text-center mt-2" style={{ color: "var(--text-muted)" }}>
            Solo gli admin possono scrivere in questa chat
          </p>
        )}
      </div>

      {/* ── Pannello admin ── */}
      <ChatAdminPanel
        chat={chat}
        isOpen={showAdmin}
        onClose={() => setShowAdmin(false)}
        isAdmin={isAdmin}
      />

      {/* ── Modal QR code ── */}
      {showQR && (
        <QRCodeModal
          chatId={chat.id}
          chatName={chat.name}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  );
}

// Helper per ottenere JWT token
async function getToken(): Promise<string> {
  const { createClientComponentClient } = await import("@supabase/auth-helpers-nextjs");
  const supabase = createClientComponentClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}
