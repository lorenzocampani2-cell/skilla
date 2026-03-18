"use client";
// ============================================================
// SKILLA — MessageBubble
// Singolo messaggio: testo, sistema, reazioni, azioni.
// ============================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pin, Trash2, Reply } from "lucide-react";
import { useSocket } from "@/components/providers/SocketProvider";
import { useAppStore } from "@/lib/store/useAppStore";
import { SPORT_CONFIG } from "@/../../shared/types";
import type { Message } from "@/../../shared/types";
import { cn, formatTime, stringToColor, getInitials } from "@/lib/utils";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "💪", "🏆"];

interface Props {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  chatId: string;
  isAdmin: boolean;
}

export function MessageBubble({ message, isOwn, showAvatar, chatId, isAdmin }: Props) {
  const { deleteMessage, pinMessage } = useSocket();
  const { interfaceMode } = useAppStore();
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const isEmergency = interfaceMode === "emergency";

  // Messaggio di sistema (join, leave, mute, ecc.)
  if (message.type === "system") {
    return (
      <div className="flex justify-center my-1">
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{
            background: "var(--bg-secondary)",
            color: "var(--text-muted)",
          }}
        >
          {message.content}
        </span>
      </div>
    );
  }

  const sender = message.sender;
  const senderSport = sender?.sport ? SPORT_CONFIG[sender.sport] : null;
  const avatarColor = stringToColor(sender?.id || "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-end gap-2 group",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar mittente */}
      {!isOwn && (
        <div className={cn("flex-shrink-0", !showAvatar && "invisible")}>
          {sender?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sender.avatar}
              alt={sender.displayName}
              className={cn(
                "rounded-full object-cover",
                isEmergency ? "w-10 h-10" : "w-8 h-8"
              )}
            />
          ) : (
            <div
              className={cn(
                "rounded-full flex items-center justify-center font-bold",
                isEmergency ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs"
              )}
              style={{ background: avatarColor, color: "white" }}
              title={sender?.displayName}
            >
              {senderSport?.emoji || getInitials(sender?.displayName || "?")}
            </div>
          )}
        </div>
      )}

      {/* Bolla messaggio */}
      <div className={cn("max-w-[75%] flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>

        {/* Nome mittente (solo se primo della sequenza) */}
        {!isOwn && showAvatar && sender && (
          <div className="flex items-center gap-1.5 ml-1">
            <span
              className="text-xs font-bold"
              style={{ color: senderSport?.color || avatarColor }}
            >
              {sender.displayName}
            </span>
            {senderSport && (
              <span className="text-xs">{senderSport.emoji}</span>
            )}
          </div>
        )}

        {/* Container messaggio + azioni */}
        <div
          className={cn("relative", isOwn ? "flex flex-row-reverse items-end gap-1" : "flex items-end gap-1")}
          onContextMenu={(e) => { e.preventDefault(); setShowActions(!showActions); }}
        >
          {/* Bolla */}
          <div
            className={cn(
              "message-bubble relative",
              isOwn ? "own" : "other",
              message.isDeleted && "opacity-50 italic",
              isEmergency && "text-emergency-base px-5 py-4"
            )}
          >
            {message.isDeleted ? (
              <span className="text-sm">🗑️ Messaggio eliminato</span>
            ) : (
              <>
                {/* Reply preview */}
                {message.replyToId && (
                  <div
                    className="text-xs px-2 py-1 rounded-lg mb-1.5 border-l-2 opacity-70"
                    style={{
                      borderColor: isOwn ? "rgba(255,255,255,0.5)" : "var(--accent)",
                      background: isOwn ? "rgba(0,0,0,0.2)" : "var(--bg-primary)",
                    }}
                  >
                    ↩ Risposta a...
                  </div>
                )}
                <p className={cn("text-sm leading-relaxed", isEmergency && "text-emergency-base")}>
                  {message.content}
                </p>
              </>
            )}

            {/* Ora + pin indicator */}
            <div className={cn("flex items-center gap-1 mt-1", isOwn ? "justify-end" : "justify-start")}>
              {message.isPinned && (
                <Pin size={10} className={isOwn ? "text-blue-200" : "text-blue-400"} />
              )}
              <span className="text-[10px] opacity-60">
                {formatTime(message.createdAt)}
              </span>
            </div>
          </div>

          {/* Azioni rapide (hover desktop) */}
          <AnimatePresence>
            {showActions && !message.isDeleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col gap-1 bg-card border rounded-xl p-1 shadow-xl"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border)",
                }}
              >
                {/* Reazioni rapide */}
                <div className="flex gap-1 px-1">
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      className="text-sm hover:scale-125 transition-transform p-1 rounded-lg hover:bg-white/10"
                      onClick={() => {
                        setShowActions(false);
                        // emit react socket
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Azioni admin */}
                {(isAdmin || isOwn) && (
                  <div className="border-t pt-1" style={{ borderColor: "var(--border)" }}>
                    {isAdmin && (
                      <button
                        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg
                                   text-xs font-medium hover:bg-white/10 text-blue-400"
                        onClick={() => { pinMessage(chatId, message.id); setShowActions(false); }}
                      >
                        <Pin size={12} />
                        {message.isPinned ? "Rimuovi pin" : "Pinna"}
                      </button>
                    )}
                    <button
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg
                                 text-xs font-medium hover:bg-white/10 text-red-400"
                      onClick={() => { deleteMessage(chatId, message.id); setShowActions(false); }}
                    >
                      <Trash2 size={12} />
                      Elimina
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reazioni */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5 ml-1">
            {message.reactions
              .filter((r) => r.userIds.length > 0)
              .map((reaction) => (
                <button
                  key={reaction.emoji}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full
                             text-xs font-medium border transition-all"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border)",
                  }}
                >
                  {reaction.emoji}
                  <span style={{ color: "var(--text-muted)" }}>
                    {reaction.userIds.length}
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Tap to show actions overlay (mobile) */}
      {showActions && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowActions(false)}
        />
      )}
    </motion.div>
  );
}
